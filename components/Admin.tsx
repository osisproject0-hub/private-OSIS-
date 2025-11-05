import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
import { Profile } from '../types';
import { SpinnerIcon, SearchIcon, PlusIcon, CloseIcon } from './Icons';

const NewChannelModal: React.FC<{
    onClose: () => void;
    onChannelCreated: () => void;
}> = ({ onClose, onChannelCreated }) => {
    const [channelName, setChannelName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (channelName.trim().length < 3) {
            setError('Channel name must be at least 3 characters.');
            return;
        }
        setLoading(true);
        setError('');

        const { error: insertError } = await supabase.from('channels').insert({ name: channelName.trim() });
        if (insertError) {
            setError(insertError.message);
        } else {
            onChannelCreated();
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-8 w-full max-w-md border border-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Create New Channel</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-800"><CloseIcon className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="channelName" className="block text-sm font-medium text-gray-400 mb-2">Channel Name</label>
                        <input
                            type="text"
                            id="channelName"
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., event-planning"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                    <div className="flex justify-end gap-4">
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

export default function Admin() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChannelModal, setShowChannelModal] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      setError(error.message);
      console.error('Error fetching members:', error);
    } else {
      setMembers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);
  
  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member') => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      alert('Failed to update role: ' + error.message);
    } else {
      setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    }
  };
  
  const filteredMembers = useMemo(() => 
    members.filter(member => 
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [members, searchTerm]);

  if (profile?.role !== 'admin') {
    return (
      <div className="flex-1 p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
        <p className="text-gray-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {showChannelModal && <NewChannelModal onClose={() => setShowChannelModal(false)} onChannelCreated={() => { /* Optionally refresh channel list elsewhere */ }} />}
      <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-100">Admin Panel</h1>
            <p className="text-md text-gray-400 mt-1">Manage OSIS Members & Channels</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                <input 
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <button onClick={() => setShowChannelModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <PlusIcon className="w-5 h-5"/>
                New Channel
            </button>
        </div>
      </header>
      
      {loading && <div className="flex-1 flex items-center justify-center"><SpinnerIcon className="w-10 h-10 text-blue-500" /></div>}
      {error && <div className="flex-1 p-8 text-center text-red-400">Error: {error}</div>}

      {!loading && !error && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3">Member</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id} className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium text-gray-100 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img src={member.avatar_url} alt={member.full_name} className="w-10 h-10 rounded-full object-cover" />
                      <span>{member.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      member.role === 'admin' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                      { profile.id !== member.id && (
                          <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'member')}
                              className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 max-w-[120px]"
                          >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                          </select>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
