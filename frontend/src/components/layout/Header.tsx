'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, User, Zap } from 'lucide-react';

function useLiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

interface HeaderProps {
  openTickets?: number;
  criticalAlerts?: number;
}

export function Header({ openTickets = 0, criticalAlerts = 0 }: HeaderProps) {
  const router = useRouter();
  const time = useLiveClock();
  const [showMenu, setShowMenu] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserEmail(payload.email || payload.sub || 'Admin');
      }
    } catch {
      setUserEmail('Admin');
    }
  }, []);

  const signOut = () => {
    localStorage.removeItem('access_token');
    router.replace('/login');
  };

  const totalAlerts = (criticalAlerts ?? 0) + (openTickets > 0 ? 1 : 0);

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
      {/* Left: Live indicator */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/50 rounded-full px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-xs text-emerald-300 font-medium">Live</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-slate-500 text-xs">
          <Zap size={12} className="text-blue-400" />
          <span>Real-time sync</span>
        </div>
      </div>

      {/* Center: Live clock */}
      <div className="hidden sm:block text-center">
        <p className="text-xs text-slate-500 font-mono tracking-widest">
          {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
        <p className="text-sm text-slate-300 font-mono font-semibold tabular-nums">{time}</p>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <Bell size={17} />
          {totalAlerts > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center leading-none">
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <User size={14} className="text-white" />
            </div>
            <span className="hidden sm:block text-xs text-slate-300 max-w-[120px] truncate">
              {userEmail || 'Admin'}
            </span>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 z-50 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                  <p className="text-xs text-slate-500">Signed in as</p>
                  <p className="text-sm text-white font-medium truncate mt-0.5">{userEmail || 'Admin'}</p>
                </div>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
