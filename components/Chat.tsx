import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
import { Channel, Message, Profile } from '../types';
import { SendIcon, MicIcon, PhoneIcon, VideoIcon, SpinnerIcon, ImagePlusIcon } from './Icons';
import { RealtimeChannel } from '@supabase/supabase-js';

// --- Sub-components defined in the same file for simplicity ---

const ChannelList: React.FC<{
  channels: Channel[];
  activeChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
}> = ({ channels, activeChannel, onSelectChannel }) => (
  <div className="w-64 bg-gray-900 p-4 border-r border-gray-800 flex-col hidden md:flex">
    <h2 className="text-xl font-bold mb-4 px-2">Channels</h2>
    <div className="flex-1 space-y-1 overflow-y-auto">
      {channels.map((channel) => (
        <button
          key={channel.id}
          onClick={() => onSelectChannel(channel)}
          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
            activeChannel?.id === channel.id
              ? 'bg-blue-600/20 text-blue-300'
              : 'text-gray-400 hover:bg-gray-800'
          }`}
        >
          # {channel.name}
        </button>
      ))}
    </div>
  </div>
);

const MessageView: React.FC<{ messages: Message[]; userId: string | undefined }> = ({ messages, userId }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  // Fix: Replaced import.meta.env with hardcoded Supabase URL to resolve TypeScript error.
  const VITE_SUPABASE_URL = 'https://shbkbmkbvktozaargrpz.supabase.co';

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const isImageUrl = (url: string) => {
      if (!VITE_SUPABASE_URL) return false;
      const publicUrl = `${VITE_SUPABASE_URL}/storage/v1/object/public/chat_images/`;
      return url.startsWith(publicUrl) && /\.(jpg|jpeg|png|gif|webp)$/.test(url.toLowerCase());
  }
  
  const AudioPlayer: React.FC<{ src: string }> = ({ src }) => {
      return (
          <div className="w-64">
            <audio controls src={src} className="w-full h-10 custom-audio-player">
                Your browser does not support the audio element.
            </audio>
          </div>
      );
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="space-y-6">
        {messages.map((message) => {
          const isSender = message.user_id === userId;
          return (
            <div key={message.id} className={`flex items-end gap-3 ${isSender ? 'flex-row-reverse' : ''}`}>
              <img
                src={message.profiles.avatar_url}
                alt={message.profiles.full_name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div
                className={`max-w-lg p-1 rounded-xl ${
                  isSender
                    ? 'bg-blue-600'
                    : 'bg-gray-700'
                }`}
              >
                <div className="p-2">
                    {!isSender && <p className="text-xs font-bold text-blue-300 mb-1 px-1">{message.profiles.full_name}</p>}
                    {message.type === 'audio' ? (
                      <AudioPlayer src={message.content} />
                    ) : isImageUrl(message.content) ? (
                      <img src={message.content} alt="User upload" className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer" onClick={() => window.open(message.content, '_blank')} />
                    ) : (
                      <p className="text-sm text-gray-100 whitespace-pre-wrap px-1">{message.content}</p>
                    )}
                    <p className={`text-xs mt-1.5 ${isSender ? 'text-blue-200' : 'text-gray-400'} text-right px-1`}>
                      {formatTime(message.created_at)}
                    </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div ref={endOfMessagesRef} />
    </div>
  );
};

const ChatHeader: React.FC<{ activeChannel: Channel | null; onlineCount: number }> = ({ activeChannel, onlineCount }) => (
  <header className="flex items-center justify-between p-4 border-b border-gray-800">
    <div>
      <h2 className="text-xl font-bold">{activeChannel ? `# ${activeChannel.name}` : 'Select a channel'}</h2>
      <p className="text-sm text-gray-400">{onlineCount} anggota online</p>
    </div>
    <div className="flex items-center gap-4">
        {/* These are UI placeholders for future implementation */}
        <button className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title="Start Voice Call (Not Implemented)">
            <PhoneIcon className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title="Start Video Call (Not Implemented)">
            <VideoIcon className="w-5 h-5" />
        </button>
    </div>
  </header>
);

const OnlineMembersList: React.FC<{ onlineUsers: { [key: string]: any[] } }> = ({ onlineUsers }) => {
    const members = Object.values(onlineUsers).map(presence => presence[0].user);

    return (
        <div className="w-64 bg-gray-900 p-4 border-l border-gray-800 flex-col hidden lg:flex">
            <h2 className="text-xl font-bold mb-4 px-2">Online</h2>
            <div className="flex-1 space-y-3 overflow-y-auto">
                {members.map(member => (
                    <div key={member.id} className="flex items-center gap-3 px-2">
                        <div className="relative">
                           <img src={member.avatar_url} alt={member.full_name} className="w-8 h-8 rounded-full object-cover" />
                           <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-gray-900"></span>
                        </div>
                        <span className="text-sm font-medium text-gray-300 truncate">{member.full_name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Chat Component ---

export default function Chat() {
  const { user, profile } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const messageChannelRef = useRef<RealtimeChannel | null>(null);

  const [onlineUsers, setOnlineUsers] = useState({});

  const fetchChannels = useCallback(async () => {
    const { data, error } = await supabase.from('channels').select('*');
    if (error) {
      console.error('Error fetching channels:', error);
    } else if (data) {
      setChannels(data);
      if (data.length > 0 && !activeChannel) {
        setActiveChannel(data[0]);
      }
    }
  }, [activeChannel]);

  const fetchMessages = useCallback(async (channelId: number) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(*)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data as any[] as Message[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    if (activeChannel && profile) {
      fetchMessages(activeChannel.id);

      if(messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
      }

      messageChannelRef.current = supabase.channel(`room:${activeChannel.id}`);

      messageChannelRef.current
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${activeChannel.id}` },
          async (payload) => {
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', payload.new.user_id)
                .single();
            if(error) console.error("Error fetching profile for new message", error);
            else setMessages((prevMessages) => [...prevMessages, {...payload.new, profiles: profileData} as Message]);
          }
        )
        .on('presence', { event: 'sync' }, () => {
            const newState = messageChannelRef.current?.presenceState();
            if (newState) setOnlineUsers(newState);
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await messageChannelRef.current?.track({
                    user: { id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url },
                    online_at: new Date().toISOString()
                });
            }
        });
    }
    
    return () => {
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
      }
    };
  }, [activeChannel, fetchMessages, profile]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user || !activeChannel) return;

    const content = newMessage;
    setNewMessage('');
    textareaRef.current?.style.removeProperty('height');

    const { error } = await supabase.from('messages').insert({
      content,
      user_id: user.id,
      channel_id: activeChannel.id,
      type: 'text'
    });
    if (error) console.error('Error sending message:', error);
  };
  
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleStartRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        const audioChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => { audioChunks.push(event.data); };
        
        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          if (!user || !activeChannel || audioBlob.size === 0) return;

          const fileName = `voice-note-${Date.now()}.webm`;
          const { error } = await supabase.storage.from('voice_notes').upload(fileName, audioBlob);
          if (error) { console.error('Error uploading voice note:', error); return; }

          const { data: { publicUrl } } = supabase.storage.from('voice_notes').getPublicUrl(fileName);
          if(publicUrl) {
            await supabase.from('messages').insert({ content: publicUrl, user_id: user.id, channel_id: activeChannel.id, type: 'audio' });
          }
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Microphone access was denied. Please allow microphone access in your browser settings.");
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeChannel) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('chat_images').upload(fileName, file);

    if (error) {
        console.error('Error uploading image:', error);
        return;
    }

    const { data: { publicUrl } } = supabase.storage.from('chat_images').getPublicUrl(fileName);
    if(publicUrl) {
        await supabase.from('messages').insert({ content: publicUrl, user_id: user.id, channel_id: activeChannel.id, type: 'text' }); // Stored as text type
    }
  };

  return (
    <div className="flex h-full">
      <ChannelList channels={channels} activeChannel={activeChannel} onSelectChannel={setActiveChannel} />
      <div className="flex-1 flex flex-col bg-gray-950">
        <ChatHeader activeChannel={activeChannel} onlineCount={Object.keys(onlineUsers).length} />
        {loading ? (
             <div className="flex-1 flex items-center justify-center">
                <SpinnerIcon className="w-8 h-8 text-blue-500" />
            </div>
        ) : (
            <MessageView messages={messages} userId={user?.id} />
        )}
        <div className="p-4 border-t border-gray-800">
          <form onSubmit={handleSendMessage} className="flex items-start gap-4 bg-gray-800 rounded-xl p-2">
             <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
             <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white self-end transition-colors">
                <ImagePlusIcon className="w-5 h-5"/>
            </button>
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaInput}
              onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                }
              }}
              placeholder={`Message #${activeChannel?.name || ''}`}
              className="flex-1 bg-transparent px-2 py-2.5 text-sm text-gray-200 resize-none focus:outline-none max-h-40 overflow-y-auto"
              rows={1}
            />
            <div className="flex items-center self-end h-11">
                <button
                    type="button"
                    onClick={handleStartRecording}
                    className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                >
                <MicIcon className="w-5 h-5" />
                </button>
                <button
                type="submit"
                className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={newMessage.trim() === ''}
                >
                <SendIcon className="w-5 h-5" />
                </button>
            </div>
          </form>
        </div>
      </div>
      <OnlineMembersList onlineUsers={onlineUsers} />
    </div>
  );
}