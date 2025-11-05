
import React, { useState, useRef } from 'react';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';
import { SpinnerIcon, ImagePlusIcon } from './Icons';

export default function Settings() {
  const { profile, user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoadingProfile(true);
    setMessage(null);

    let newAvatarUrl = profile?.avatar_url;

    if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
            setMessage({ type: 'error', text: 'Error uploading avatar: ' + uploadError.message });
            setLoadingProfile(false);
            return;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        newAvatarUrl = `${data.publicUrl}?t=${new Date().getTime()}`; // Add timestamp to break cache
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, avatar_url: newAvatarUrl })
      .eq('id', user.id);

    if (updateError) {
      setMessage({ type: 'error', text: 'Error updating profile: ' + updateError.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      await refreshProfile();
      setAvatarFile(null);
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setAvatarFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
              setAvatarPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  }

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
             <div className="flex items-center gap-4">
                <div className="relative">
                    <img src={avatarPreview || ''} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-blue-600 p-1.5 rounded-full text-white hover:bg-blue-700">
                        <ImagePlusIcon className="w-4 h-4" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="fullName">Full Name</label>
                    <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="email">Email</label>
              <input type="email" id="email" value={user?.email || ''} disabled className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-500 cursor-not-allowed"/>
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