import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, Settings, BarChart3, 
  CheckSquare, LogOut, UserMinus
} from 'lucide-react';
import clsx from 'clsx';

const RadialNavigation = () => {
  const { logout, isAdmin, isLeader, isMember } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  let navItems = [];
  if (isAdmin) {
    navItems = [
      { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
      { to: '/admin/teams', icon: Settings, label: 'Teams' },
      { to: '/admin/members', icon: Users, label: 'Members' },
      { to: '/admin/external-members', icon: UserMinus, label: 'External' },
      { to: '/admin/attendance', icon: CheckSquare, label: 'Attendance' },
      { to: '/admin/analysis', icon: BarChart3, label: 'Analytics' },
    ];
  } else if (isLeader) {
    navItems = [
      { to: '/leader', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/leader/external-members', icon: UserMinus, label: 'External' },
      { to: '/leader/analysis', icon: BarChart3, label: 'Analytics' },
    ];
  } else if (isMember) {
    navItems = [
      { to: '/member', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/member/attendance', icon: CheckSquare, label: 'Attendance' },
    ];
  }

  const allItems = [...navItems, { action: handleLogout, icon: LogOut, label: 'Logout', isLogout: true }];
  const totalItems = allItems.length;

  const radius = isMobile ? 120 : 180; 

  const getAngle = (index, total) => {
    if (total === 1) return 0;
    const maxSpread = 150; // -75 to +75 degrees
    const itemSpread = 32; 
    const actualSpread = Math.min(maxSpread, (total - 1) * itemSpread);
    const startAngle = -(actualSpread / 2);
    const step = actualSpread / (total - 1);
    return (startAngle + index * step) * (Math.PI / 180);
  };

  return (
    <>
      <div 
        className={clsx(
          "fixed inset-0 bg-slate-900/5 backdrop-blur-[2px] z-40 transition-all duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      <aside 
        ref={navRef}
        className="fixed top-1/2 left-0 -translate-y-1/2 z-50 flex items-center pointer-events-none"
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          className={clsx(
            "relative flex items-center justify-center bg-white rounded-r-full border border-l-0 border-theme-border shadow-soft transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent pointer-events-auto group",
            "w-12 h-20 sm:w-16 sm:h-24",
            isOpen ? "scale-105 shadow-md border-theme-accent/30 bg-theme-bg" : "hover:shadow-md hover:bg-theme-bg hover:w-14 sm:hover:w-18"
          )}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 relative overflow-hidden rounded-full border border-theme-border/50 bg-white shadow-inner flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <img 
              src="/mitra-logo.jpg" 
              alt="MITRA" 
              className="w-[120%] h-[120%] object-cover mix-blend-multiply" 
            />
          </div>
        </button>

        <div className="absolute top-1/2 left-[calc(100%-8px)] w-0 h-0 pointer-events-none">
          {allItems.map((item, index) => {
            const angle = getAngle(index, totalItems);
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const delay = index * 40; 

            const isActive = location.pathname === item.to;

            const style = isOpen ? {
              transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%)) scale(1)`,
              opacity: 1,
              transitionDelay: `${delay}ms`,
            } : {
              transform: `translate(0px, 0px) scale(0)`,
              opacity: 0,
              transitionDelay: '0ms',
            };

            const NodeContent = () => (
              <div className="relative group flex items-center">
                <div 
                  className={clsx(
                    "w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] rounded-full flex items-center justify-center transition-transform duration-200 relative shadow-soft",
                    "group-hover:-translate-y-[4px] group-hover:scale-[1.06] group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
                    isActive ? "bg-theme-accent-light text-theme-accent shadow-md border border-theme-accent/20" : "bg-white text-theme-text-secondary border border-theme-border group-hover:text-theme-primary group-hover:bg-theme-bg",
                    item.isLogout && "group-hover:!text-theme-absent"
                  )}
                >
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                
                <div 
                  className={clsx(
                    "absolute left-[calc(100%+12px)] px-3 py-1.5 text-[12px] sm:text-[13px] font-semibold tracking-wide whitespace-nowrap rounded-lg shadow-sm transition-all duration-200 pointer-events-none",
                    isActive ? "bg-white text-theme-accent border border-theme-accent/20" : "bg-white/95 text-theme-text-secondary border border-theme-border backdrop-blur-sm group-hover:text-theme-primary group-hover:border-theme-border-subtle",
                    item.isLogout && "group-hover:!text-theme-absent"
                  )}
                >
                  {item.label}
                </div>
              </div>
            );

            if (item.action) {
              return (
                <button 
                  key="logout" 
                  onClick={(e) => { e.preventDefault(); item.action(); }} 
                  style={style} 
                  className={clsx(
                    "absolute focus:outline-none transition-all duration-[350ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
                    isOpen ? "pointer-events-auto" : "pointer-events-none"
                  )}
                  tabIndex={isOpen ? 0 : -1}
                >
                  <NodeContent />
                </button>
              );
            }

            return (
              <NavLink 
                key={item.to} 
                to={item.to} 
                style={style} 
                className={clsx(
                  "absolute focus:outline-none transition-all duration-[350ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
                  isOpen ? "pointer-events-auto" : "pointer-events-none"
                )}
                tabIndex={isOpen ? 0 : -1}
              >
                <NodeContent />
              </NavLink>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default RadialNavigation;
