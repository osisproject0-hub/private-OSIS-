
import React, { useState } from 'react';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';
import { SpinnerIcon } from './Icons';

export default function Settings() {
  const { profile, user } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoadingProfile(true);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (error) {
      setMessage({ type: 'error', text: 'Error updating profile: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Note: You might need to refresh the profile in the Auth context
    }
    setLoadingProfile(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: "Passwords do not match." });
      return;
    }
    if(password.length < 6) {
        setMessage({ type: 'error', text: "Password should be at least 6 characters." });
        return;
    }
    setLoadingPassword(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: 'error', text: 'Error updating password: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPassword('');
      setConfirmPassword('');
    }
    setLoadingPassword(false);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
        <p className="text-md text-gray-400 mt-1">Manage your account details.</p>
      </header>
      
      {message && (
        <div className={`p-4 mb-6 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-10 max-w-2xl">
        {/* Profile Information */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Profile Information</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="email">Email</label>
              <input type="email" id="email" value={user?.email || ''} disabled className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-500 cursor-not-allowed"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="fullName">Full Name</label>
              <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="text-right">
              <button type="submit" disabled={loadingProfile} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                {loadingProfile ? <SpinnerIcon className="w-5 h-5"/> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Change Password</h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="password">New Password</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="confirmPassword">Confirm New Password</label>
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="text-right">
              <button type="submit" disabled={loadingPassword} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center min-w-[150px]">
                {loadingPassword ? <SpinnerIcon className="w-5 h-5"/> : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
