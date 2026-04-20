'use client';

import { useState } from 'react';
import { Sidebar, SidebarToggle } from './Sidebar';
import { Header } from './Header';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center h-14 px-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <SidebarToggle onOpen={() => setSidebarOpen(true)} />
          <span className="ml-3 text-sm font-semibold text-white">ITSM AI Agent</span>
          <div className="ml-auto flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-xs text-emerald-400 ml-1">Live</span>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:block">
          <Header />
        </div>

        <main className="flex-1 p-4 lg:p-6 xl:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
