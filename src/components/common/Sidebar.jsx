import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, BarChart3, LogOut, CheckSquare } from 'lucide-react';
import clsx from 'clsx';
import { use3DTilt } from '../../hooks/use3DTilt';

const TiltNavItem = ({ link }) => {
  const tiltRef = use3DTilt({ maxTilt: 15, scale: 1.1, zLift: 20 });
  const Icon = link.icon;
  
  return (
    <NavLink
      ref={tiltRef}
      to={link.path}
      title={link.name}
      className={({ isActive }) => clsx(
        "perspective-container w-[52px] h-[52px] rounded-[1.25rem] flex items-center justify-center transition-all duration-300 preserve-3d group relative",
        isActive ? "bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]" : "text-theme-ink-muted hover:text-white"
      )}
    >
      <Icon 
        className="w-[22px] h-[22px] transition-transform duration-300 group-hover:translate-z-6" 
        style={{ transform: 'translateZ(10px)' }}
        strokeWidth={2} 
      />
    </NavLink>
  );
};

const TiltLogout = ({ onLogout }) => {
  const tiltRef = use3DTilt({ maxTilt: 15, scale: 1.1, zLift: 20 });
  
  return (
    <div className="w-full flex justify-center mt-auto pb-4">
      <button
        ref={tiltRef}
        onClick={onLogout}
        title="Logout"
        className="perspective-container w-12 h-12 rounded-full flex items-center justify-center text-theme-ink-muted hover:text-white transition-all duration-300 preserve-3d group"
      >
        <LogOut className="w-5 h-5" style={{ transform: 'translateZ(10px)' }} strokeWidth={2} />
      </button>
    </div>
  );
};

const Sidebar = () => {
  const { isAdmin, isLeader, isMember, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getLinks = () => {
    if (isAdmin) {
      return [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Manage Teams', path: '/admin/teams', icon: Users },
        { name: 'Manage Members', path: '/admin/members', icon: Users },
        { name: 'Mark Attendance', path: '/admin/mark-attendance', icon: CheckSquare },
        { name: 'Club Analysis', path: '/admin/analysis', icon: BarChart3 },
      ];
    }
    if (isLeader) {
      return [
        { name: 'Dashboard', path: '/leader', icon: LayoutDashboard },
        { name: 'Mark Attendance', path: '/leader/mark-attendance', icon: CheckSquare },
        { name: 'Team Analysis', path: '/leader/analysis', icon: BarChart3 },
      ];
    }
    if (isMember) {
      return [
        { name: 'Dashboard', path: '/member', icon: LayoutDashboard },
        { name: 'My Attendance', path: '/member/attendance', icon: CheckSquare },
      ];
    }
    return [];
  };

  const links = getLinks();

  return (
    <aside className="w-[76px] my-6 ml-6 bg-[#0D0F16]/80 backdrop-blur-xl rounded-[2rem] border border-white/5 flex-col hidden md:flex items-center py-6 shadow-2xl relative z-20">
      
      {/* Brand icon / Logo mark */}
      <div className="w-12 h-12 rounded-[1rem] flex items-center justify-center mb-8 bg-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.4)]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 22H22L12 2Z" fill="white"/>
          <circle cx="12" cy="14" r="3" fill="#8B5CF6"/>
        </svg>
      </div>
      
      <div className="flex-1 w-full flex flex-col items-center gap-6 mt-4">
        {links.map((link) => (
          <TiltNavItem key={link.name} link={link} />
        ))}
      </div>

      <TiltLogout onLogout={handleLogout} />
    </aside>
  );
};

export default Sidebar;
