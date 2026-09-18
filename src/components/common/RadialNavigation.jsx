import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, Settings, BarChart3, 
  CheckSquare, LogOut, UserMinus, Menu, X
} from 'lucide-react';
import clsx from 'clsx';

const RadialNavigation = () => {
  const { user, logout, isAdmin, isLeader, isMember } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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

  // Tighten radius for ~250px total width footprint
  const radius = 95; 
  const centerX = 125; 
  const centerY = 140; 
  const startAngle = -Math.PI / 2;

  const renderDial = (isMobile) => {
    return (
      <div className="relative w-[250px] h-[280px]">
        {/* Center Logo */}
        <div className="absolute top-[140px] left-[125px] -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] bg-white rounded-full shadow-nav flex items-center justify-center z-20 border-4 border-[#F7F8FA]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-theme-primary to-[#25324A] flex items-center justify-center shadow-inner">
            <span className="text-white font-bold text-[15px]">CA</span>
          </div>
        </div>

        {/* Orbit Ring */}
        <div className="absolute top-[140px] left-[125px] -translate-x-1/2 -translate-y-1/2 w-[190px] h-[190px] rounded-full border border-theme-border/60 z-0"></div>

        {/* Nodes */}
        {allItems.map((item, index) => {
          const angle = startAngle + (index * (2 * Math.PI)) / allItems.length;
          const x = centerX + radius * Math.cos(angle) - 22; // 22 is half of 44px
          const y = centerY + radius * Math.sin(angle) - 22;

          const isActive = location.pathname === item.to;

          const NodeContent = () => (
            <div 
              className={clsx(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 relative group cursor-pointer shadow-soft hover:scale-110 hover:-translate-y-1 hover:shadow-float z-10",
                isActive ? "bg-theme-accent-light text-theme-accent shadow-md border border-theme-accent/20 scale-[1.12]" : "bg-white text-theme-text-secondary border border-theme-border/60 hover:text-theme-primary",
                item.isLogout && "hover:!text-theme-absent hover:!bg-theme-absent-bg"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              
              {/* Tooltip Label */}
              <div className={clsx(
                "absolute top-[calc(100%+6px)] px-2 py-1 text-[10px] font-bold tracking-wider uppercase rounded bg-theme-primary text-white shadow-lg opacity-0 pointer-events-none transition-opacity duration-200 whitespace-nowrap",
                "group-hover:opacity-100",
                isActive && !isMobile && "opacity-100" // Always show label if active on desktop
              )}>
                {item.label}
              </div>
            </div>
          );

          if (item.action) {
            return (
              <button key="logout" onClick={item.action} style={{ left: x, top: y }} className="absolute z-10 focus:outline-none">
                <NodeContent />
              </button>
            );
          }

          return (
            <NavLink key={item.to} to={item.to} style={{ left: x, top: y }} className="absolute z-10">
              <NodeContent />
            </NavLink>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <aside className="hidden lg:flex fixed top-0 left-0 w-[280px] h-screen items-center justify-center pointer-events-none z-40">
        <div className="pointer-events-auto pl-4">
          {renderDial(false)}
        </div>
      </aside>

      <button 
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 w-[52px] h-[52px] bg-theme-accent text-white rounded-full flex items-center justify-center shadow-float z-40 hover:scale-105 active:scale-95 transition-transform"
      >
        <Menu className="w-[22px] h-[22px]" />
      </button>

      <div className={clsx(
        "lg:hidden fixed inset-0 bg-theme-bg/95 backdrop-blur-sm z-50 transition-all duration-300 flex items-center justify-center",
        mobileOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      )}>
        <button 
          onClick={() => setMobileOpen(false)}
          className="absolute top-6 right-6 p-2.5 bg-white rounded-full shadow-soft text-theme-text-secondary hover:text-theme-primary"
        >
          <X className="w-5 h-5" />
        </button>
        {renderDial(true)}
      </div>
    </>
  );
};

export default RadialNavigation;
