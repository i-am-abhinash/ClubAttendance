import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart3, 
  CheckSquare, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  UserMinus,
  ShieldAlert
} from 'lucide-react';
import clsx from 'clsx';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout, isAdmin, isLeader, isMember } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const NavItem = ({ to, icon: Icon, label, group }) => (
    <NavLink
      to={to}
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) => clsx(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium relative group mb-1",
        isActive 
          ? "bg-[#EEF0FF] text-[#1F2937]" 
          : "text-[#64748B] hover:bg-[#F7F8FA] hover:text-[#1F2937]"
      )}
    >
      {({ isActive }) => (
        <>
          <Icon className={clsx("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-[#5865F2]" : "text-[#94A3B8] group-hover:text-[#64748B]")} />
          {!collapsed && <span>{label}</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              {label}
            </div>
          )}
          {isActive && !collapsed && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#5865F2] rounded-r-full"></div>
          )}
        </>
      )}
    </NavLink>
  );

  const NavGroup = ({ title, children }) => (
    <div className="mb-6">
      {!collapsed && <h4 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-3 px-3">{title}</h4>}
      {children}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside 
        className={clsx(
          "fixed top-0 left-0 h-screen bg-[#FFFFFF] border-r border-[#E5E7EB] z-50 transition-all duration-300 flex flex-col shadow-[2px_0_10px_rgba(0,0,0,0.02)]",
          collapsed ? "w-[72px]" : "w-[240px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-4 border-b border-[#E5E7EB] shrink-0">
          <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#172033] to-[#25324A] flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white font-bold text-sm">CA</span>
            </div>
            {!collapsed && <span className="font-semibold text-[#172033] text-sm truncate">ClubAttendance</span>}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
          
          <NavGroup title="Overview">
            {isAdmin && <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />}
            {isLeader && <NavItem to="/leader" icon={LayoutDashboard} label="Dashboard" />}
            {isMember && <NavItem to="/member" icon={LayoutDashboard} label="Dashboard" />}
          </NavGroup>

          {isAdmin && (
            <>
              <NavGroup title="Management">
                <NavItem to="/admin/teams" icon={Settings} label="Teams" />
                <NavItem to="/admin/members" icon={Users} label="Members" />
                <NavItem to="/admin/external-members" icon={UserMinus} label="External Members" />
              </NavGroup>
              <NavGroup title="Attendance">
                <NavItem to="/admin/attendance" icon={CheckSquare} label="Attendance" />
              </NavGroup>
              <NavGroup title="Insights">
                <NavItem to="/admin/analysis" icon={BarChart3} label="Analytics" />
              </NavGroup>
            </>
          )}

          {isLeader && (
            <>
              <NavGroup title="Management">
                <NavItem to="/leader/external-members" icon={UserMinus} label="External Members" />
              </NavGroup>
              <NavGroup title="Insights">
                <NavItem to="/leader/analysis" icon={BarChart3} label="Analytics" />
              </NavGroup>
            </>
          )}

          {isMember && (
            <>
              <NavGroup title="Personal">
                <NavItem to="/member/attendance" icon={CheckSquare} label="My Attendance" />
              </NavGroup>
            </>
          )}

        </div>

        {/* User Profile Area & Collapse Toggle */}
        <div className="p-4 border-t border-[#EEF0F3] shrink-0">
          <div className={clsx("flex items-center mb-4", collapsed ? "justify-center" : "gap-3")}>
            <div className="w-9 h-9 rounded-full bg-[#EEF0FF] text-[#5865F2] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[#172033] text-sm truncate">{user?.name}</div>
                <div className="text-[11px] text-[#64748B] truncate">{user?.role}</div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-1">
            <button 
              onClick={handleLogout} 
              className={clsx(
                "flex items-center gap-2 px-3 py-2 text-sm text-[#64748B] hover:text-[#172033] hover:bg-[#F7F8FA] rounded-md transition-colors",
                collapsed && "justify-center"
              )}
              title="Logout"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className={clsx(
                "hidden lg:flex items-center gap-2 px-3 py-2 text-sm text-[#94A3B8] hover:text-[#172033] hover:bg-[#F7F8FA] rounded-md transition-colors",
                collapsed && "justify-center"
              )}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
