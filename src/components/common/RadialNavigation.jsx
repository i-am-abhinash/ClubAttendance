import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, Users, Settings, BarChart2, 
  CalendarCheck, LogOut, UserMinus
} from 'lucide-react';
import clsx from 'clsx';

const RadialNavigation = () => {
  const { logout, isAdmin, isLeader, isMember } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!isMobile) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 350);
    }
  };

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
      { to: '/admin', icon: Home, label: 'Dashboard' },
      { to: '/admin/teams', icon: Users, label: 'Teams' },
      { to: '/admin/members', icon: UserMinus, label: 'Members' },
      { to: '/admin/external-members', icon: Users, label: 'External' },
      { to: '/admin/attendance', icon: CalendarCheck, label: 'Attendance' },
      { to: '/admin/analysis', icon: BarChart2, label: 'Analytics' },
    ];
  } else if (isLeader) {
    navItems = [
      { to: '/leader', icon: Home, label: 'Dashboard' },
      { to: '/leader/external-members', icon: Users, label: 'External' },
      { to: '/leader/analysis', icon: BarChart2, label: 'Analytics' },
    ];
  } else if (isMember) {
    navItems = [
      { to: '/member', icon: Home, label: 'Dashboard' },
      { to: '/member/attendance', icon: CalendarCheck, label: 'Attendance' },
    ];
  }

  const allItems = [
    ...navItems, 
    { to: '#settings', icon: Settings, label: 'Settings' },
    { action: handleLogout, icon: LogOut, label: 'Logout', isLogout: true }
  ];
  const totalItems = allItems.length;

  const radius = isMobile ? 75 : 90; 
  const arcRadius = radius - 15; 

  const getAngle = (index, total) => {
    if (total === 1) return 0;
    const startAngle = -80; 
    const endAngle = 80; 
    const spread = endAngle - startAngle;
    const step = spread / (total - 1);
    return (startAngle + index * step) * (Math.PI / 180);
  };

  return (
    <>
      <div 
        className={clsx(
          "fixed inset-0 z-40 transition-all duration-300 pointer-events-none",
          isOpen ? "bg-slate-900/5 backdrop-blur-[1px] opacity-100 pointer-events-auto" : "opacity-0"
        )}
        onClick={() => setIsOpen(false)}
        onMouseEnter={() => {
          // If the mouse hits the backdrop and stops, it's not in the aside. 
          // So it's safe to let the timeout run.
        }}
      />

      <aside 
        ref={navRef}
        className="fixed top-1/2 left-6 sm:left-8 -translate-y-1/2 z-50 flex items-center justify-center pointer-events-none"
        style={{ width: '0px', height: '0px' }} 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        
        {/* Arc Line & Nodes */}
        <div 
          className={clsx(
            "absolute top-0 left-0 transition-all duration-300 ease-out pointer-events-none flex items-center justify-center",
            isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )}
        >
          <svg 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible" 
            width={radius * 2} 
            height={radius * 2.5}
            style={{ pointerEvents: 'none' }}
          >
            <path 
              d={`M ${radius},${radius * 1.25 - arcRadius} A ${arcRadius} ${arcRadius} 0 0 1 ${radius},${radius * 1.25 + arcRadius}`}
              fill="none" 
              stroke="#5865F2" 
              strokeWidth="1.5" 
              strokeOpacity="0.4"
              style={{ filter: 'drop-shadow(0 0 4px rgba(88,101,242,0.5))' }}
            />
            {allItems.map((item, index) => {
              const angle = getAngle(index, totalItems);
              const cx = radius + arcRadius * Math.cos(angle); 
              const cy = radius * 1.25 + arcRadius * Math.sin(angle);
              return (
                <circle 
                  key={`dot-${index}`}
                  cx={cx} 
                  cy={cy} 
                  r="3.5" 
                  fill="#FFFFFF" 
                  stroke="#5865F2" 
                  strokeWidth="1.5"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.9))' }}
                />
              );
            })}
          </svg>
        </div>

        {/* Floating Navigation Buttons */}
        <div className="absolute top-0 left-0 pointer-events-none">
          {allItems.map((item, index) => {
            const angle = getAngle(index, totalItems);
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const delay = index * 50; 

            const isActive = location.pathname === item.to;

            const style = isOpen ? {
              transform: `translate(${x}px, ${y}px) scale(1)`,
              opacity: 1,
              transitionDelay: `${delay}ms`,
            } : {
              transform: `translate(0px, 0px) scale(0)`,
              opacity: 0,
              transitionDelay: '0ms',
            };

            const NodeContent = () => (
              <div className="relative group flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2">
                <div 
                  className={clsx(
                    "w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] rounded-full flex items-center justify-center transition-all duration-[200ms] ease-out shadow-[0_2px_8px_rgba(0,0,0,0.06)] border cursor-pointer",
                    "group-hover:-translate-y-[3px] group-hover:scale-[1.08] group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
                    isActive ? "bg-theme-accent-light text-theme-accent border-theme-accent shadow-[0_0_15px_rgba(88,101,242,0.4)]" : "bg-white text-theme-primary border-theme-border hover:border-theme-accent/30",
                    item.isLogout && "group-hover:!text-theme-absent group-hover:!border-theme-absent/30"
                  )}
                >
                  <item.icon className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px]" />
                </div>
                
                <div 
                  className={clsx(
                    "absolute top-[calc(100%+8px)] text-[12px] sm:text-[13px] font-medium whitespace-nowrap transition-colors duration-200 pointer-events-none text-center tracking-wide",
                    isActive ? "text-theme-accent font-bold" : "text-theme-text group-hover:text-theme-primary font-semibold",
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
                    "absolute top-0 left-0 focus:outline-none transition-all duration-[300ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]",
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
                  "absolute top-0 left-0 focus:outline-none transition-all duration-[300ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                  isOpen ? "pointer-events-auto" : "pointer-events-none"
                )}
                tabIndex={isOpen ? 0 : -1}
              >
                <NodeContent />
              </NavLink>
            );
          })}
        </div>

        {/* MITRA Central Logo */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          className={clsx(
            "absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent pointer-events-auto group",
            "w-[56px] h-[56px] sm:w-[64px] sm:h-[64px]", 
            "bg-[#0A101D] border border-[#2B354E] shadow-[inset_0_0_12px_rgba(255,255,255,0.05),_0_0_20px_rgba(88,101,242,0.3)]",
            isOpen ? "scale-95 shadow-[inset_0_0_20px_rgba(255,255,255,0.1),_0_0_25px_rgba(88,101,242,0.6)]" : "hover:scale-105 hover:shadow-[inset_0_0_15px_rgba(255,255,255,0.08),_0_0_25px_rgba(88,101,242,0.4)]"
          )}
        >
          <div className="w-[85%] h-[85%] rounded-full flex items-center justify-center overflow-hidden">
             <img 
              src="/mitra-logo.jpg" 
              alt="MITRA" 
              className="w-full h-full object-contain"
              style={{ filter: 'invert(1) brightness(2)', mixBlendMode: 'screen' }} 
            />
          </div>
        </button>
      </aside>
    </>
  );
};

export default RadialNavigation;
