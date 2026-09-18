import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, BarChart3, LogOut, CheckSquare, Settings } from 'lucide-react';
import clsx from 'clsx';

const NavItem = ({ link }) => {
  const Icon = link.icon;
  
  return (
    <NavLink
      to={link.path}
      className={({ isActive }) => clsx(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
        isActive 
          ? "bg-theme-accent-light text-theme-accent" 
          : "text-theme-text-secondary hover:bg-theme-bg hover:text-theme-primary"
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-theme-accent rounded-r-md"></div>
          )}
          <Icon className={clsx("w-5 h-5", isActive ? "text-theme-accent" : "text-theme-muted group-hover:text-theme-text-secondary")} strokeWidth={2} />
          <span>{link.name}</span>
        </>
      )}
    </NavLink>
  );
};

const Sidebar = () => {
  const { user, isAdmin, isLeader, isMember, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getLinks = () => {
    if (isAdmin) {
      return [
        { section: 'Overview', items: [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard }
        ]},
        { section: 'Management', items: [
          { name: 'Manage Teams', path: '/admin/teams', icon: Users },
          { name: 'Manage Members', path: '/admin/members', icon: Users },
          { name: 'Mark Attendance', path: '/admin/mark-attendance', icon: CheckSquare }
        ]},
        { section: 'Insights', items: [
          { name: 'Club Analysis', path: '/admin/analysis', icon: BarChart3 }
        ]}
      ];
    }
    if (isLeader) {
      return [
        { section: 'Overview', items: [
          { name: 'Dashboard', path: '/leader', icon: LayoutDashboard }
        ]},
        { section: 'Management', items: [
          { name: 'Mark Attendance', path: '/leader/mark-attendance', icon: CheckSquare }
        ]},
        { section: 'Insights', items: [
          { name: 'Team Analysis', path: '/leader/analysis', icon: BarChart3 }
        ]}
      ];
    }
    if (isMember) {
      return [
        { section: 'Overview', items: [
          { name: 'Dashboard', path: '/member', icon: LayoutDashboard }
        ]},
        { section: 'Records', items: [
          { name: 'My Attendance', path: '/member/attendance', icon: CheckSquare }
        ]}
      ];
    }
    return [];
  };

  const sections = getLinks();

  return (
    <aside className="w-[260px] h-screen bg-theme-surface border-r border-theme-border flex-col hidden md:flex shrink-0">
      
      {/* Brand */}
      <div className="h-20 px-6 flex items-center gap-3 border-b border-theme-border-subtle shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-theme-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 22H22L12 2Z" fill="white"/>
          </svg>
        </div>
        <span className="font-bold text-lg tracking-tight text-theme-primary">ClubAttendance</span>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-theme-muted mb-1">
              {section.section}
            </h4>
            <div className="flex flex-col gap-0.5">
              {section.items.map(link => (
                <NavItem key={link.name} link={link} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-theme-border-subtle">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-theme-border-subtle hover:bg-theme-bg transition-colors cursor-pointer group mb-2">
          <div className="w-10 h-10 rounded-full bg-theme-accent-light text-theme-accent flex items-center justify-center font-bold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-semibold text-theme-text truncate">{user?.name}</span>
            <span className="text-xs font-medium text-theme-text-secondary truncate">{user?.role}</span>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-theme-text-secondary hover:bg-theme-absent-bg hover:text-theme-absent transition-colors"
        >
          <LogOut className="w-5 h-5 text-theme-muted hover:text-theme-absent transition-colors" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
