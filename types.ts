import { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  role: 'admin' | 'member';
}

export interface Message {
  id: number;
  created_at: string;
  content: string;
  user_id: string;
  channel_id: number;
  type: 'text' | 'audio';
  profiles: Profile;
}

export interface Channel {
  id: number;
  name: string;
}

export interface Event {
    id: number;
    created_at: string;
    title: string;
    description: string;
    event_date: string;
    created_by: string;
}

export interface AppUser extends User {
    profile: Profile;
}
