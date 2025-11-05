
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { SchoolIcon, SpinnerIcon } from './Icons';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=${fullName}`
          }
        }
      });
      if (error) {
        setError(error.message);
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        setMessage('User with this email already exists. Please try logging in.');
      } else {
        setMessage('Registration successful! Please check your email to verify your account.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-800">
        <div className="text-center mb-8">
            <div className="inline-block bg-blue-600/10 p-3 rounded-full mb-4">
                <SchoolIcon className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-100">OSIS Portal</h1>
            <p className="text-gray-400">SMK LPPMRI 2 KEDUNGREJA</p>
        </div>
        
        <form onSubmit={handleAuth}>
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? <SpinnerIcon className="w-5 h-5" /> : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </div>
        </form>

        {error && <p className="text-center text-red-400 text-sm mt-4">{error}</p>}
        {message && <p className="text-center text-green-400 text-sm mt-4">{message}</p>}

        <p className="text-center text-sm text-gray-500 mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-blue-500 hover:text-blue-400 focus:outline-none">
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
