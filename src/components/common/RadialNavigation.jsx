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

  const toggleNav = () => {
    setIsOpen(!isOpen);
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

  // Include settings. Logout is handled elsewhere if we want it super compact. 
  // Let's keep settings inside but not logout (which is in the header top right profile dropdown).
  const allItems = [
    ...navItems, 
    { to: '/settings', icon: Settings, label: 'Settings' }
  ];
  const totalItems = allItems.length;

  // Extremely compact radius
  const radius = isMobile ? 85 : 100; 
  const arcRadius = radius - 15; 

  // Compute angles for right-facing arc
  const getAngle = (index, total) => {
    if (total === 1) return 0;
    // Spread evenly across a semi-circle on the right side (-80 to 80)
    const maxSpread = 160; 
    const step = maxSpread / (total - 1);
    const startAngle = -80;
    return (startAngle + index * step) * (Math.PI / 180);
  };

  const startAngleRad = getAngle(0, totalItems);
  const endAngleRad = getAngle(totalItems - 1, totalItems);

  // For the glowing path, we center the SVG over the logo button.
  const svgCenter = radius + 20; 
  const x1 = svgCenter + arcRadius * Math.cos(startAngleRad);
  const y1 = svgCenter + arcRadius * Math.sin(startAngleRad);
  
  // Create arc path dynamically
  let d = `M ${x1},${y1}`;
  for (let i = 1; i < totalItems; i++) {
    const angle = getAngle(i, totalItems);
    const x = svgCenter + arcRadius * Math.cos(angle);
    const y = svgCenter + arcRadius * Math.sin(angle);
    d += ` A ${arcRadius} ${arcRadius} 0 0 1 ${x},${y}`;
  }

  return (
    <>
      <div 
        className={clsx(
          "fixed inset-0 z-40 transition-all duration-300 pointer-events-none",
          isOpen ? "bg-slate-900/5 backdrop-blur-[1px] opacity-100 pointer-events-auto" : "opacity-0"
        )}
        onClick={() => setIsOpen(false)}
      />

      <aside 
        ref={navRef}
        className="fixed left-4 sm:left-6 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
      >
        <div className="relative flex items-center justify-center w-[48px] h-[48px] sm:w-[56px] sm:h-[56px]">
          
          <button
            onClick={toggleNav}
            aria-label={isOpen ? "Close navigation" : "Open navigation"}
            className={clsx(
              "absolute z-50 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent pointer-events-auto",
              "w-full h-full",
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

          <div 
            className={clsx(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out pointer-events-none z-40",
              isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}
          >
            <svg 
              className="overflow-visible" 
              width={svgCenter * 2} 
              height={svgCenter * 2}
            >
              <path 
                d={d}
                fill="none" 
                stroke="#5865F2" 
                strokeWidth="1.5" 
                strokeOpacity="0.4"
                style={{ filter: 'drop-shadow(0 0 4px rgba(88,101,242,0.5))' }}
              />
              {allItems.map((item, index) => {
                const angle = getAngle(index, totalItems);
                const cx = svgCenter + arcRadius * Math.cos(angle); 
                const cy = svgCenter + arcRadius * Math.sin(angle);
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

          <div className="absolute top-1/2 left-1/2 pointer-events-none z-40">
            {allItems.map((item, index) => {
              const angle = getAngle(index, totalItems);
              const x = radius * Math.cos(angle);
              const y = radius * Math.sin(angle);
              const delay = index * 40; 

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
                  <div className="relative group flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                    <div 
                      className={clsx(
                        "w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] rounded-full flex items-center justify-center transition-all duration-[200ms] ease-out shadow-[0_2px_8px_rgba(0,0,0,0.06)] border cursor-pointer",
                        "hover:-translate-y-[3px] hover:scale-[1.08] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
                        isActive ? "bg-theme-accent-light text-theme-accent border-theme-accent shadow-[0_0_15px_rgba(88,101,242,0.4)]" : "bg-white text-theme-primary border-theme-border hover:border-theme-accent/30"
                      )}
                    >
                      <item.icon className="w-[18px] h-[18px]" />
                    </div>
                    
                    <div 
                      className={clsx(
                        "absolute left-[calc(100%+12px)] top-1/2 px-2.5 py-1.5 rounded-[8px] bg-white/95 border border-theme-border/60 shadow-sm backdrop-blur-sm text-[12px] sm:text-[13px] font-medium whitespace-nowrap transition-all duration-200 pointer-events-none text-left tracking-wide",
                        "opacity-0 -translate-x-2 -translate-y-1/2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:-translate-y-[calc(50%+3px)]",
                        isActive ? "text-theme-accent font-bold border-theme-accent/30" : "text-theme-text font-semibold"
                      )}
                    >
                      {item.label}
                    </div>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
};

export default RadialNavigation;
