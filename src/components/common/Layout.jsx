import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children, title, description }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex h-screen bg-theme-bg text-theme-text font-sans overflow-hidden">
      
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      {/* Main Content Area */}
      {/* Added dynamic margin-left for desktop based on Sidebar width. It's normally 240px, or 72px when collapsed, but Sidebar uses CSS classes. 
          To keep it simple without complex state passing, we just add padding that accommodates the expanded sidebar. */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[240px] h-screen overflow-y-auto">
        
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-theme-border-subtle flex items-center px-4 shrink-0">
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 text-theme-text-secondary hover:text-theme-primary hover:bg-theme-bg rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 font-semibold text-theme-primary">ClubAttendance</span>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex h-20 items-center justify-between px-8 border-b border-theme-border-subtle bg-white/50 backdrop-blur-sm shrink-0 sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-theme-primary">{title}</h1>
            {description && <p className="text-sm text-theme-text-secondary mt-0.5">{description}</p>}
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm text-theme-text-secondary">
              <CalendarIcon className="w-4 h-4 text-theme-muted" />
              <span className="font-medium">{today}</span>
            </div>
            <button className="text-theme-muted hover:text-theme-primary transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-theme-accent rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {/* Mobile Title (hidden on desktop) */}
          <div className="lg:hidden mb-6 mt-2">
            <h1 className="text-xl font-bold text-theme-primary">{title}</h1>
            {description && <p className="text-sm text-theme-text-secondary mt-1">{description}</p>}
          </div>
          
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
