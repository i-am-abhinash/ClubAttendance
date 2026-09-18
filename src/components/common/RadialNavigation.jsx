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

  const radius = isMobile ? 100 : 140; 

  const getAngle = (index, total) => {
    if (total === 1) return 0;
    const maxSpread = 160; 
    const itemSpread = 34; 
    const actualSpread = Math.min(maxSpread, (total - 1) * itemSpread);
    const startAngle = -(actualSpread / 2);
    const step = actualSpread / (total - 1);
    return (startAngle + index * step) * (Math.PI / 180);
  };

  return (
    <>
      <div 
        className={clsx(
          "fixed inset-0 bg-slate-900/5 backdrop-blur-[1px] z-40 transition-all duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      <aside 
        ref={navRef}
        className="fixed top-1/2 left-3 sm:left-4 -translate-y-1/2 z-50 flex items-center pointer-events-none"
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          className={clsx(
            "relative flex items-center justify-center bg-white rounded-[14px] border border-theme-border shadow-soft transition-all duration-300 focus:outline-none pointer-events-auto group p-1.5 sm:p-2",
            isOpen ? "scale-105 shadow-md border-theme-accent/30" : "hover:shadow-md hover:bg-theme-bg"
          )}
          style={{ width: '80px', height: '48px' }} // Compact pill-like container for the logo
        >
          <div className="w-full h-full relative flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
            <img 
              src="/mitra-logo.jpg" 
              alt="MITRA" 
              className="w-full h-full object-contain mix-blend-multiply" 
            />
          </div>
        </button>

        <div className="absolute top-1/2 left-full ml-4 w-0 h-0 pointer-events-none">
          {allItems.map((item, index) => {
            const angle = getAngle(index, totalItems);
            // We want the items to fan out. Since the origin is exactly to the right of the button,
            // we can apply standard polar coordinates.
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const delay = index * 35; 

            const isActive = location.pathname === item.to;

            const style = isOpen ? {
              transform: `translate(${x}px, calc(${y}px - 50%)) scale(1)`,
              opacity: 1,
              transitionDelay: `${delay}ms`,
            } : {
              transform: `translate(0px, -50%) scale(0.8)`,
              opacity: 0,
              transitionDelay: '0ms',
            };

            const NodeContent = () => (
              <div 
                className={clsx(
                  "h-[44px] sm:h-[48px] px-4 rounded-[12px] flex items-center gap-2.5 transition-transform duration-200 relative shadow-sm",
                  "hover:-translate-y-[4px] hover:scale-[1.05] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)]",
                  isActive ? "bg-theme-accent-light text-theme-accent shadow-md border border-theme-accent/20" : "bg-white/95 backdrop-blur-sm text-theme-text-secondary border border-theme-border hover:text-theme-primary hover:border-theme-border-subtle hover:bg-white",
                  item.isLogout && "hover:!text-theme-absent"
                )}
              >
                <item.icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                <span className="text-[13px] sm:text-[14px] font-medium tracking-wide whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            );

            if (item.action) {
              return (
                <button 
                  key="logout" 
                  onClick={(e) => { e.preventDefault(); item.action(); }} 
                  style={style} 
                  className={clsx(
                    "absolute focus:outline-none origin-left transition-all duration-[300ms] ease-out",
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
                  "absolute focus:outline-none origin-left transition-all duration-[300ms] ease-out",
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
