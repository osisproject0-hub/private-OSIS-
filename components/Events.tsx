import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
import { Event } from '../types';
import { SpinnerIcon, PlusIcon, CloseIcon } from './Icons';

const NewEventModal: React.FC<{
    onClose: () => void;
    onEventCreated: () => void;
}> = ({ onClose, onEventCreated }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !eventDate) {
            setError('Title and date are required.');
            return;
        }
        setLoading(true);
        setError('');

        const { error: insertError } = await supabase.from('events').insert({
            title,
            description,
            event_date: new Date(eventDate).toISOString(),
            created_by: user?.id,
        });

        if (insertError) {
            setError(insertError.message);
        } else {
            onEventCreated();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl p-8 w-full max-w-lg border border-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Create New Event</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-800"><CloseIcon className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-2">Event Title</label>
                        <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="eventDate" className="block text-sm font-medium text-gray-400 mb-2">Event Date & Time</label>
                        <input type="datetime-local" id="eventDate" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-blue-500 focus:border-blue-500"></textarea>
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center min-w-[100px]">
                            {loading ? <SpinnerIcon className="w-5 h-5"/> : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default function Events() {
    const { profile } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('event_date', { ascending: false });
        
        if(error) {
            setError(error.message);
        } else {
            setEvents(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);
    
    return (
        <div className="flex-1 p-8 overflow-y-auto">
            {showModal && <NewEventModal onClose={() => setShowModal(false)} onEventCreated={fetchEvents} />}
            <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100">Events & Agenda</h1>
                    <p className="text-md text-gray-400 mt-1">Jadwal kegiatan dan rapat OSIS.</p>
                </div>
                {profile?.role === 'admin' && (
                     <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <PlusIcon className="w-5 h-5"/>
                        New Event
                    </button>
                )}
            </header>
            
            {loading && <div className="flex-1 flex items-center justify-center"><SpinnerIcon className="w-10 h-10 text-blue-500" /></div>}
            {error && <div className="flex-1 p-8 text-center text-red-400">Error: {error}</div>}

            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <div key={event.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col">
                            <h2 className="text-xl font-bold text-blue-400 mb-2">{event.title}</h2>
                            <p className="text-sm font-medium text-gray-400 mb-4">{new Date(event.event_date).toLocaleString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-gray-300 flex-1">{event.description}</p>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <div className="md:col-span-2 lg:col-span-3 text-center py-12 bg-gray-900 border border-gray-800 rounded-xl">
                            <h2 className="text-xl font-semibold text-gray-300">No events found.</h2>
                            <p className="text-gray-500">Admins can create a new event using the button above.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
