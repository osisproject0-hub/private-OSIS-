import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';
import { Event } from '../types';

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ memberCount: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Fetch member count
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      // Fetch upcoming events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })
        .limit(3);

      if (eventsError) {
        console.error("Error fetching events", eventsError);
      } else {
        setUpcomingEvents(eventsData);
      }

      setStats({ memberCount: count ?? 0 });
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-100">Selamat Datang, {profile?.full_name}!</h1>
          <p className="text-lg text-gray-400 mt-2">Portal Komunikasi & Manajemen OSIS SMK LPPMRI 2 Kedungreja</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <main className="lg:col-span-2 space-y-8">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-100 mb-4">Tentang Portal Ini</h2>
                    <p className="text-gray-300 leading-relaxed">
                        Portal ini dirancang untuk menjadi pusat komunikasi internal bagi seluruh anggota OSIS. Manfaatkan fitur chat untuk koordinasi cepat, panel admin untuk manajemen anggota, dan selalu periksa dashboard untuk pengumuman terbaru. Teknologi ini dibuat untuk mempermudah dan mengefektifkan kerja kita bersama.
                    </p>
                </div>
                 <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-purple-400 mb-4">Pengumuman Penting</h2>
                    <p className="text-gray-300">Rapat pleno pengurus OSIS akan dilaksanakan pada hari Sabtu pukul 09:00. Kehadiran wajib.</p>
                </div>
            </main>
            <aside className="space-y-8">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-blue-400 mb-4">Statistik OSIS</h2>
                    <div className="flex items-center">
                        <p className="text-4xl font-bold text-gray-100">{stats.memberCount}</p>
                        <p className="ml-3 text-gray-400">Total Anggota</p>
                    </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-green-400 mb-4">Agenda Terdekat</h2>
                    {upcomingEvents.length > 0 ? (
                        <ul className="space-y-4">
                        {upcomingEvents.map(event => (
                            <li key={event.id} className="border-l-4 border-green-500 pl-4">
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
