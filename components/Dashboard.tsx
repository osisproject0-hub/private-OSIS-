import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';
import { Event } from '../types';
import { SendIcon, SpinnerIcon } from './Icons';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ memberCount: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState<Event | null>(null);
  const [quickMessage, setQuickMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Fetch member count
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      // Fetch upcoming events and announcement
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false }) // Get latest first for announcement
        .limit(4);

      if (eventsError) {
        console.error("Error fetching events", eventsError);
      } else {
        setLatestAnnouncement(eventsData[0] || null);
        // Sort by event date for upcoming events
        const sortedEvents = [...eventsData].sort((a,b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
        setUpcomingEvents(sortedEvents.slice(0, 3));
      }

      setStats({ memberCount: count ?? 0 });
    };

    fetchDashboardData();
  }, []);

  const handleQuickSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quickMessage.trim() === '' || !user) return;
    setIsSending(true);

    // Find the 'general' channel
    const { data: channel } = await supabase.from('channels').select('id').eq('name', 'general').single();

    if (channel) {
        const { error } = await supabase.from('messages').insert({
            content: quickMessage,
            user_id: user.id,
            channel_id: channel.id,
            type: 'text'
        });
        if (error) {
            console.error('Error sending quick message:', error);
        } else {
            setQuickMessage('');
        }
    } else {
        console.error("Could not find general channel");
    }
    setIsSending(false);
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-100">Selamat Datang, {profile?.full_name}!</h1>
          <p className="text-lg text-gray-400 mt-2">Portal Komunikasi & Manajemen OSIS SMK LPPMRI 2 Kedungreja</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {latestAnnouncement && (
                    <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 shadow-lg">
                        <h2 className="text-xl font-bold text-purple-400 mb-3">Pengumuman Terbaru</h2>
                        <h3 className="text-lg font-semibold text-gray-200">{latestAnnouncement.title}</h3>
                        <p className="text-sm text-gray-400 mb-3">{new Date(latestAnnouncement.event_date).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                        <p className="text-gray-300">{latestAnnouncement.description}</p>
                    </div>
                )}
                 <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-gray-200 mb-4">Kirim Cepat ke #general</h2>
                    <form onSubmit={handleQuickSend} className="flex items-center gap-4">
                        <input
                          type="text"
                          value={quickMessage}
                          onChange={(e) => setQuickMessage(e.target.value)}
                          placeholder="Tulis pesan singkat..."
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button type="submit" disabled={isSending || quickMessage.trim() === ''} className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                           {isSending ? <SpinnerIcon className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
                        </button>
                    </form>
                </div>
            </div>
            <aside className="space-y-8">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-blue-400 mb-4">Statistik OSIS</h2>
                    <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg">
                        <p className="text-gray-300">Total Anggota</p>
                        <p className="text-3xl font-bold text-gray-100">{stats.memberCount}</p>
                    </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-green-400 mb-4">Agenda Terdekat</h2>
                    {upcomingEvents.length > 0 ? (
                        <ul className="space-y-4">
                        {upcomingEvents.map(event => (
                            <li key={event.id} className="border-l-4 border-green-500 pl-4 transition-all hover:bg-gray-800/50 -ml-4 px-4 py-2 rounded-r-lg">
                                <p className="font-bold text-gray-200">{event.title}</p>
                                <p className="text-sm text-gray-400">{new Date(event.event_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400">Tidak ada agenda terdekat.</p>
                    )}
                </div>
            </aside>
        </div>
      </div>
    </div>
  );
}