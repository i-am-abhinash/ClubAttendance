import React from 'react';
import Sidebar from './Sidebar';
import NetworkBackground from './NetworkBackground';
import { useAuth } from '../../context/AuthContext';
import { Menu } from 'lucide-react';

const Layout = ({ children, title }) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden text-theme-ink relative bg-transparent">
      <div className="z-10 flex h-full w-full relative">
        <Sidebar />
        
        {/* Mobile Sidebar overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-theme-bg/90 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="relative flex w-24 flex-1 flex-col items-center pt-6">
              <Sidebar />
            </div>
          </div>
        )}

        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          <header className="flex shrink-0 items-start justify-between px-6 sm:px-8 lg:px-12 z-10 pt-8 pb-4">
            <button type="button" className="-m-2.5 p-2.5 text-theme-ink md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 text-sm text-theme-ink-muted">
                <span className="bg-[#B23BFF]/20 text-[#C060FF] px-2 py-0.5 rounded-md font-semibold text-xs tracking-wide">
                  {user?.role === 'Team Leader' ? 'Leader' : user?.role}
                </span>
                <span>Thursday, 17 September • Week 38</span>
              </div>
              <h2 className="text-4xl font-display font-extrabold tracking-tight text-white">{title}</h2>
            </div>

            <div className="flex items-center gap-x-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold leading-none text-white">{user?.name}</span>
                <span className="text-xs font-medium text-theme-ink-muted mt-1">Signed in as {user?.role}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#B23BFF] flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(178,59,255,0.4)]">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-12 pb-12 z-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
