import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
import { Event } from '../types';
import { SpinnerIcon, PlusIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, CalendarIcon } from './Icons';

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
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
        if(error) setError(error.message);
        else setEvents(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();

    const eventsByDate = useMemo(() => {
        return events.reduce((acc, event) => {
            const date = new Date(event.event_date).toDateString();
            if (!acc[date]) acc[date] = [];
            acc[date].push(event);
            return acc;
        }, {} as Record<string, Event[]>);
    }, [events]);

    const selectedDateEvents = useMemo(() => {
        return eventsByDate[selectedDate.toDateString()] || [];
    }, [eventsByDate, selectedDate]);
    
    const handleDelete = async (eventId: number) => {
        if(window.confirm("Are you sure you want to delete this event?")) {
            const { error } = await supabase.from('events').delete().eq('id', eventId);
            if (error) {
                alert("Error deleting event: " + error.message);
            } else {
                fetchEvents();
            }
        }
    }

    return (
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
            {showModal && <NewEventModal onClose={() => setShowModal(false)} onEventCreated={fetchEvents} />}
            <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100">Events & Agenda</h1>
                    <p className="text-md text-gray-400 mt-1">Jadwal kegiatan dan rapat OSIS.</p>
                </div>
                {profile?.role === 'admin' && (
                     <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 self-start md:self-center">
                        <PlusIcon className="w-5 h-5"/>
                        New Event
                    </button>
                )}
            </header>
            
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 rounded-full hover:bg-gray-800">
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </button>
                    <h2 className="text-xl font-semibold text-center">{currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 rounded-full hover:bg-gray-800">
                        <ChevronRightIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => <div key={day}>{day}</div>)}
                </div>
                {loading ? <div className="flex justify-center items-center h-64"><SpinnerIcon className="w-10 h-10 text-blue-500" /></div> :
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                    {Array.from({ length: daysInMonth }).map((_, day) => {
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day + 1);
                        const dateString = date.toDateString();
                        const isToday = dateString === new Date().toDateString();
                        const isSelected = dateString === selectedDate.toDateString();
                        const dailyEvents = eventsByDate[dateString] || [];
                        return (
                            <button onClick={() => setSelectedDate(date)} key={day} className={`relative p-2 h-20 md:h-24 rounded-lg flex flex-col focus:outline-none transition-colors duration-200
                                ${isSelected ? 'bg-blue-600/30 ring-2 ring-blue-500' : isToday ? 'bg-blue-900/50' : 'bg-gray-800/50 hover:bg-gray-800'}`}>
                                <span className={`font-bold text-sm ${isToday ? 'text-blue-400' : ''}`}>{day + 1}</span>
                                <div className="flex-1 overflow-y-auto mt-1 flex flex-wrap gap-1">
                                    {dailyEvents.slice(0, 3).map(event => <div key={event.id} className="w-full h-1.5 bg-green-500 rounded-full" title={event.title}></div>)}
                                </div>
                            </button>
                        );
                    })}
                </div>}
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Agenda untuk {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                <div className="space-y-4">
                    {loading ? <div className="flex justify-center items-center py-8"><SpinnerIcon className="w-8 h-8 text-blue-500"/></div> :
                    selectedDateEvents.length > 0 ? (
                        selectedDateEvents.map(event => (
                            <div key={event.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className='flex-1'>
                                    <p className="text-sm font-medium text-gray-400">{new Date(event.event_date).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                                    <h3 className="text-lg font-bold text-blue-400">{event.title}</h3>
                                    <p className="text-gray-300 text-sm mt-1">{event.description}</p>
                                </div>
                                {profile?.role === 'admin' && (
                                    <button onClick={() => handleDelete(event.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full self-end sm:self-center">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-xl">
                            <CalendarIcon className="w-12 h-12 mx-auto text-gray-600"/>
                            <p className="text-gray-500 mt-4">Tidak ada acara yang dijadwalkan untuk hari ini.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}