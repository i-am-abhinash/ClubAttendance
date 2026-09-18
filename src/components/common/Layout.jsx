import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell } from 'lucide-react';

const Layout = ({ children, title, description }) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-theme-bg overflow-hidden text-theme-text font-sans">
      <Sidebar />
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-theme-primary/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative bg-white w-[260px] h-full shadow-2xl">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 shrink-0 bg-white border-b border-theme-border flex items-center justify-between px-6 lg:px-10 z-10">
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              className="p-2 -ml-2 text-theme-muted hover:text-theme-text md:hidden rounded-lg hover:bg-theme-bg" 
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-theme-primary">{title}</h1>
              {description && (
                <p className="text-sm font-medium text-theme-text-secondary">{description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-theme-muted hover:text-theme-primary transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-theme-accent rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-[1px] bg-theme-border hidden sm:block"></div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold leading-none text-theme-primary">{user?.name}</span>
                <span className="text-xs font-medium text-theme-text-secondary mt-1">{user?.role}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-theme-accent-light text-theme-accent flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 relative">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
