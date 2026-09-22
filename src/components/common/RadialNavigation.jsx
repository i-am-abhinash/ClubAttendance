import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, Users, Settings, LogOut,
  CalendarCheck, UserMinus, UserPlus
} from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';

const RadialNavigation = () => {
  const { theme } = useTheme();
  const { isAdmin, isLeader, isMember, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300); // Small delay to prevent accidental closing
  };

  const handleLogout = async (e) => {
    e.preventDefault();
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
    ];
  } else if (isLeader) {
    navItems = [
      { to: '/leader', icon: Home, label: 'Dashboard' },
      { to: '/leader/team', icon: Users, label: 'My Team' },
      { to: '/leader/external-members', icon: UserPlus, label: 'Recruit' },
    ];
  } else if (isMember) {
    navItems = [
      { to: '/member', icon: Home, label: 'Dashboard' },
      { to: '/member/attendance', icon: CalendarCheck, label: 'Attendance' },
    ];
  }

  const allItems = [
    ...navItems, 
    { to: '/settings', icon: Settings, label: 'Settings' },
    { to: '#logout', icon: LogOut, label: 'Logout', onClick: handleLogout }
  ];
  const totalItems = allItems.length;

  const radius = isMobile ? 85 : 100; 
  const arcRadius = radius - 15; 

  const getAngle = (index, total) => {
    if (total === 1) return 0;
    const maxSpread = 160; 
    const step = maxSpread / (total - 1);
    const startAngle = -80;
    return (startAngle + index * step) * (Math.PI / 180);
  };

  const startAngleRad = getAngle(0, totalItems);
  const endAngleRad = getAngle(totalItems - 1, totalItems);

  const svgCenter = radius + 20; 
  const x1 = svgCenter + arcRadius * Math.cos(startAngleRad);
  const y1 = svgCenter + arcRadius * Math.sin(startAngleRad);
  
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
          isOpen ? "bg-theme-bg/60 backdrop-blur-[2px] opacity-100 pointer-events-auto" : "opacity-0"
        )}
      />

      <aside 
        ref={navRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="fixed left-4 sm:left-6 top-1/2 -translate-y-1/2 z-50 pointer-events-auto"
      >
        <div className="relative flex items-center justify-center w-[48px] h-[48px] sm:w-[56px] sm:h-[56px]">
          
          <div
            className={clsx(
              "absolute z-50 rounded-full flex items-center justify-center transition-all duration-300",
              "w-full h-full cursor-pointer",
              "bg-[#0A101A] border border-[#1E2A3A] shadow-[0_0_20px_rgba(109,124,255,0.15)]",
              isOpen ? "scale-95 shadow-[0_0_25px_rgba(56,189,248,0.3)] border-[#38BDF8]" : "hover:scale-105 hover:shadow-[0_0_25px_rgba(109,124,255,0.3)] hover:border-[#6D7CFF]"
            )}
          >
            <div className="w-[85%] h-[85%] rounded-full flex items-center justify-center overflow-hidden bg-[#0A101A]">
               <img 
                src="/mitra-logo.jpg" 
                alt="MITRA" 
                className="w-[70%] h-[70%] object-contain mix-blend-screen"
                style={{ filter: 'invert(1) grayscale(100%) brightness(1.5)' }}
              />
            </div>
          </div>

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
                stroke="var(--color-border)" 
                strokeWidth="1.5" 
                strokeOpacity="0.8"
              />
              {allItems.map((item, index) => {
                const angle = getAngle(index, totalItems);
                const cx = svgCenter + arcRadius * Math.cos(angle); 
                const cy = svgCenter + arcRadius * Math.sin(angle);
                const isActive = location.pathname === item.to || (location.pathname.startsWith(item.to) && item.to !== '/admin' && item.to !== '/leader' && item.to !== '/member' && item.to !== '#logout');
                
                return (
                  <circle 
                    key={`dot-${index}`}
                    cx={cx} 
                    cy={cy} 
                    r="3.5" 
                    fill={isActive ? "var(--color-text)" : "var(--color-surface-higher)"} 
                    stroke={isActive ? "var(--color-text)" : "var(--color-border)"} 
                    strokeWidth="1.5"
                    style={{ filter: isActive ? 'drop-shadow(0 0 6px var(--color-text))' : 'none' }}
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

              const isActive = location.pathname === item.to || (location.pathname.startsWith(item.to) && item.to !== '/admin' && item.to !== '/leader' && item.to !== '/member' && item.to !== '#logout');

              const style = isOpen ? {
                transform: `translate(${x}px, ${y}px) scale(1)`,
                opacity: 1,
                transitionDelay: `${delay}ms`,
              } : {
                transform: `translate(0px, 0px) scale(0)`,
                opacity: 0,
                transitionDelay: '0ms',
              };

              // Use an anchor tag for Logout if it has an onClick, otherwise NavLink
              if (item.onClick) {
                return (
                  <a 
                    key={item.to} 
                    href={item.to}
                    onClick={item.onClick}
                    style={style} 
                    className={clsx(
                      "absolute top-0 left-0 focus:outline-none transition-all duration-[300ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                      isOpen ? "pointer-events-auto" : "pointer-events-none"
                    )}
                  >
                    <div className="relative group flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                      <div 
                        className={clsx(
                          "w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] rounded-full flex items-center justify-center transition-all duration-[200ms] ease-out border cursor-pointer",
                          "hover:-translate-y-[3px] hover:scale-[1.08]",
                          "bg-theme-surface text-theme-text border-theme-border hover:border-theme-text hover:bg-theme-surface-elevated hover:shadow-float shadow-soft"
                        )}
                      >
                        <item.icon className="w-[18px] h-[18px]" />
                      </div>
                      
                      <div 
                        className={clsx(
                          "absolute left-[calc(100%+12px)] top-1/2 px-3 py-1.5 rounded-lg bg-theme-surface-elevated border border-theme-border shadow-float text-[12px] sm:text-[13px] font-medium whitespace-nowrap transition-all duration-200 pointer-events-none text-left tracking-wide",
                          "opacity-0 -translate-x-2 -translate-y-1/2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:-translate-y-[calc(50%+3px)]",
                          "text-theme-text font-semibold"
                        )}
                      >
                        {item.label}
                      </div>
                    </div>
                  </a>
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
                >
                  <div className="relative group flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                    <div 
                      className={clsx(
                        "w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] rounded-full flex items-center justify-center transition-all duration-[200ms] ease-out border cursor-pointer",
                        "hover:-translate-y-[3px] hover:scale-[1.08] shadow-soft",
                        isActive 
                          ? "bg-theme-surface-elevated text-theme-text border-theme-text shadow-float" 
                          : "bg-theme-surface text-theme-text-secondary border-theme-border hover:border-theme-accent hover:text-theme-primary hover:bg-theme-surface-elevated shadow-float"
                      )}
                    >
                      <item.icon className="w-[18px] h-[18px]" />
                    </div>
                    
                    <div 
                      className={clsx(
                        "absolute left-[calc(100%+12px)] top-1/2 px-3 py-1.5 rounded-lg bg-theme-surface-elevated border border-theme-border shadow-float text-[12px] sm:text-[13px] font-medium whitespace-nowrap transition-all duration-200 pointer-events-none text-left tracking-wide",
                        "opacity-0 -translate-x-2 -translate-y-1/2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:-translate-y-[calc(50%+3px)]",
                        isActive ? "text-theme-text font-bold" : "text-theme-text font-medium"
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
