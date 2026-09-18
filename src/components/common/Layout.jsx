import React, { useState, useRef, useEffect } from 'react';
import RadialNavigation from './RadialNavigation';
import { Search, Bell, ChevronDown, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children, title, description }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-theme-bg text-theme-text font-sans relative overflow-x-hidden">
      
      {/* Background Watermark */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          backgroundImage: "url('/mitra-logo.jpg')",
          backgroundPosition: "center right",
          backgroundRepeat: "no-repeat",
          backgroundSize: "800px",
          opacity: 0.03,
          mixBlendMode: "multiply"
        }}
      />

      {/* Independent Radial Navigation (Fixed on Left Edge) */}
      <RadialNavigation />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative w-full pl-[80px] sm:pl-[100px] lg:pl-[120px]">
        
        {/* Top Header */}
        <header className="h-[88px] flex items-center justify-between pr-6 lg:pr-10 border-b border-theme-border-subtle bg-white/70 backdrop-blur-md sticky top-0 z-30">
          
          <div className="flex-1 min-w-0 pr-4 flex items-center gap-4">
            
            <img 
              src="/mitra-logo.jpg" 
              alt="MITRA Logo" 
              className="h-10 sm:h-12 w-auto object-contain mix-blend-multiply"
            />
            
            <div className="flex flex-col justify-center border-l border-theme-border-subtle pl-4 ml-2">
              <h1 className="text-[20px] sm:text-[22px] font-bold text-theme-primary truncate">
                {getGreeting()}, {user?.name?.split(' ')[0]} 👋
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
                className="w-full bg-theme-bg/80 border border-theme-border rounded-full py-2 pl-9 pr-4 text-[13px] focus:outline-none focus:bg-white focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all"
              />
            </div>
            
            <div className="hidden sm:block text-[13px] font-medium text-theme-text-secondary">
              {today}
            </div>
            
            <button className="text-theme-muted hover:text-theme-primary transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-theme-accent rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-theme-border hidden sm:block"></div>
            
            <div className="relative" ref={dropdownRef}>
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="text-right hidden sm:block">
                  <div className="text-[13px] font-semibold text-theme-primary">{user?.name}</div>
                  <div className="text-[11px] text-theme-text-secondary">{user?.role}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-theme-accent-light text-theme-accent flex items-center justify-center font-bold text-sm border border-theme-accent/20 group-hover:shadow-md transition-shadow">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="w-4 h-4 text-theme-muted hidden sm:block" />
              </div>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-float border border-theme-border-subtle py-1 z-50">
                  <button 
                    onClick={() => { setShowDropdown(false); navigate('/settings'); }}
                    className="w-full text-left px-4 py-2 text-sm text-theme-text hover:bg-theme-bg flex items-center gap-2"
                  >
                    <SettingsIcon className="w-4 h-4 text-theme-muted" /> Settings
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-theme-absent hover:bg-theme-absent-bg flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 py-6 pr-6 lg:py-10 lg:pr-10 max-w-[1600px] w-full">
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
