import React from 'react';
import RadialNavigation from './RadialNavigation';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children, title, description }) => {
  const { user } = useAuth();
  
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex flex-col min-h-screen bg-theme-bg text-theme-text font-sans relative overflow-x-hidden">
      
      {/* Background Watermark */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          backgroundImage: "url('/mitra-logo.jpg')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          opacity: 0.03,
          filter: "grayscale(100%) sepia(100%) hue-rotate(190deg) saturate(300%) brightness(1.2)"
        }}
      />

      {/* Top Header - Full Width */}
      <header className="fixed top-0 left-0 right-0 h-[88px] w-full flex items-center justify-between px-6 lg:px-10 border-b border-theme-border bg-[#0A101A]/80 backdrop-blur-md z-30">
        
        <div className="flex-1 min-w-0 pr-4 flex items-center gap-4">
          
          <img 
            src="/mitra-logo.jpg" 
            alt="MITRA Logo" 
            className="h-10 sm:h-12 w-auto object-contain mix-blend-screen"
            style={{ filter: 'invert(1) grayscale(100%) brightness(1.5)' }}
          />
          
          <div className="flex flex-col justify-center border-l border-theme-border pl-4 ml-2">
            <h1 className="text-[20px] sm:text-[22px] font-bold text-theme-primary truncate">
              {getGreeting()}, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-[12px] sm:text-[13px] text-theme-text-secondary mt-0.5 truncate hidden sm:block">
              {title} - {description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-5 shrink-0">
          {/* Search */}
          <div className="hidden md:flex items-center relative w-64">
            <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-theme-surface-elevated border border-theme-border rounded-full py-2 pl-9 pr-4 text-[13px] text-theme-text focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all placeholder-theme-muted"
            />
          </div>
          
          <div className="hidden sm:block text-[13px] font-medium text-theme-text-secondary">
            {today}
          </div>
          
          <button className="text-theme-muted hover:text-theme-primary transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-theme-cyan rounded-full border-2 border-[#0A101A]"></span>
          </button>
          
          <div className="h-8 w-px bg-theme-border hidden sm:block"></div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[13px] font-semibold text-theme-primary">{user?.name}</div>
              <div className="text-[11px] text-theme-cyan font-medium tracking-wide uppercase">{user?.role}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-theme-surface-higher text-theme-cyan border border-theme-border flex items-center justify-center font-bold text-sm shadow-inner">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative w-full pt-[88px]">
        {/* Independent Radial Navigation (Fixed on Left Edge) */}
        <RadialNavigation />
        
        {/* Main Content Area */}
        <main className="flex-1 py-6 pr-6 lg:py-10 lg:pr-10 pl-[80px] sm:pl-[100px] lg:pl-[120px] max-w-[1600px] w-full z-10 relative mx-auto">
          <div className="sm:hidden mb-6">
            <h2 className="text-lg font-bold text-theme-primary">{title}</h2>
            <p className="text-xs text-theme-text-secondary mt-1">{description}</p>
          </div>
          
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
