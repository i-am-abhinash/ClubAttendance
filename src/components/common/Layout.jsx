import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MemberDetailsModal } from "../members/MemberDetailsModal";
import RadialNavigation from './RadialNavigation';
import { Search, Users, Briefcase, X, Fingerprint, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useClubData } from '../../context/ClubDataContext';

const Layout = ({ children, title, description }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // Consume shared context — no local fetch needed
  const { members: allMembers, teams: allTeams } = useClubData();
  const allData = { members: allMembers, teams: allTeams };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchRef = useRef(null);



  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { members: [], teams: [] };
    const q = searchQuery.toLowerCase();
    
    const filteredMembers = allData.members.filter(m => 
      (m.name?.toLowerCase().includes(q)) || 
      (m.regdNo?.toLowerCase().includes(q)) ||
      (m.branch?.toLowerCase().includes(q))
    ).slice(0, 6);

    const filteredTeams = allData.teams.filter(t => 
      t.name?.toLowerCase().includes(q)
    ).slice(0, 3);

    return { members: filteredMembers, teams: filteredTeams };
  }, [searchQuery, allData]);

  const [selectedMember, setSelectedMember] = useState(null);

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getTeamName = (teamId) => {
    if (!teamId) return 'External Member';
    const team = allData.teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  return (
    <div className="flex flex-col min-h-screen bg-theme-bg text-theme-text font-sans relative overflow-x-hidden">
      
      {/* Background Watermark */}
        <div 
          className="fixed inset-0 pointer-events-none z-0" 
          style={{
            backgroundImage: "url('/mitra-logo.jpg')",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            opacity: theme === 'dark' ? 0.03 : 0.05,
            filter: theme === 'dark' ? 'invert(1) grayscale(100%) brightness(1.2)' : 'grayscale(100%)',
            mixBlendMode: theme === 'dark' ? 'screen' : 'multiply'
          }}
        />

      {/* Top Header - Full Width */}
            <header className="fixed top-0 left-0 right-0 h-[88px] w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-6 lg:px-10 border-b border-theme-border bg-theme-surface/80 backdrop-blur-md z-50" style={{backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', background: theme === 'dark' ? 'rgba(13,20,32,0.9)' : 'rgba(255,255,255,0.72)'}}>
        {isMobileSearchOpen ? (
          <div className="flex-1 flex items-center gap-2 w-full h-full" ref={searchRef}>
            <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 text-theme-muted hover:text-theme-primary">
              <X size={20} />
            </button>
            <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Search members or teams..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full border rounded-full py-2 pl-4 pr-8 text-[13px] text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-text transition-all placeholder-theme-muted"
                  style={{
                    background: theme === 'dark' ? '#111B2A' : 'rgba(255,255,255,0.80)',
                    borderColor: theme === 'dark' ? '#1E2A3A' : 'rgba(0,0,0,0.10)',
                  }}
                  autoFocus
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {/* Search Results Dropdown Mobile */}
                {isSearchFocused && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-theme-surface-higher border border-theme-border-subtle rounded-xl shadow-float overflow-hidden max-h-[400px] overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                  {searchResults.members.length === 0 && searchResults.teams.length === 0 ? (
                    <div className="p-4 text-center text-sm text-theme-text-secondary">
                      No results found for "{searchQuery}"
                    </div>
                  ) : (
                    <div className="py-2">
                      {searchResults.teams.length > 0 && (
                        <div className="mb-2">
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> Teams
                          </div>
                          {searchResults.teams.map(team => (
                            <div key={team.id} className="px-3 py-2 hover:bg-theme-bg cursor-pointer transition-colors flex items-center justify-between">
                              <span className="text-sm font-semibold text-theme-primary">{team.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.members.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1">
                            <Users className="w-3 h-3" /> Members
                          </div>
                          {searchResults.members.map(member => (
                            <div 
                              key={member.id} 
                              onClick={() => {
                                setSelectedMember(member);
                                setIsSearchFocused(false);
                                setSearchQuery('');
                                setIsMobileSearchOpen(false);
                              }}
                              className="px-3 py-2 hover:bg-theme-bg cursor-pointer transition-colors border-b border-theme-border-subtle/30 last:border-0"
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-sm font-semibold text-theme-primary">{member.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3 min-w-0 shrink">
            <img 
              src="/mitra-logo.jpg" 
              alt="MITRA Logo" 
              className={`h-9 sm:h-11 w-auto shrink-0 object-contain ${theme === 'dark' ? 'mix-blend-screen' : 'mix-blend-multiply'}`}
              style={{ filter: theme === 'dark' ? 'invert(1) grayscale(100%) brightness(1.5)' : 'grayscale(100%) brightness(1.1)' }}
            />
            <div className="flex flex-col justify-center border-l border-theme-border-solid pl-3 min-w-0">
              <h1 className="text-[18px] sm:text-[20px] font-bold text-theme-text truncate leading-tight">
                {getGreeting()}, {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-[11px] sm:text-[12px] text-theme-text-secondary truncate hidden sm:block">
                {title} - {description}
              </p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user?.role === 'Admin' && (
              <>
                <button 
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-theme-text-secondary hover:text-theme-text hover:bg-theme-surface-secondary transition-all"
                >
                  <Search size={18} />
                </button>
                <div ref={searchRef} className="hidden md:block relative w-52 lg:w-64 z-50">
                  <div className="relative">
                    <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search members or teams..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      className="w-full border rounded-full py-2 pl-9 pr-8 text-[13px] text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-text transition-all placeholder-theme-muted"
                      style={{
                        background: theme === 'dark' ? '#111B2A' : 'rgba(255,255,255,0.80)',
                        borderColor: theme === 'dark' ? '#1E2A3A' : 'rgba(0,0,0,0.10)',
                      }}
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {isSearchFocused && searchQuery.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-theme-surface-higher border border-theme-border-subtle rounded-xl shadow-float overflow-hidden max-h-[400px] overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                      {searchResults.members.length === 0 && searchResults.teams.length === 0 ? (
                        <div className="p-4 text-center text-sm text-theme-text-secondary">
                          No results found for "{searchQuery}"
                        </div>
                      ) : (
                        <div className="py-2">
                          {/* Teams Section */}
                          {searchResults.teams.length > 0 && (
                            <div className="mb-2">
                              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> Teams
                              </div>
                              {searchResults.teams.map(team => (
                                <div key={team.id} className="px-3 py-2 hover:bg-theme-bg cursor-pointer transition-colors flex items-center justify-between">
                                  <span className="text-sm font-semibold text-theme-primary">{team.name}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Members Section */}
                          {searchResults.members.length > 0 && (
                            <div>
                              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1">
                                <Users className="w-3 h-3" /> Members
                              </div>
                              {searchResults.members.map(member => (
                                <div 
                                  key={member.id} 
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setIsSearchFocused(false);
                                    setSearchQuery('');
                                  }}
                                  className="px-3 py-2 hover:bg-theme-bg cursor-pointer transition-colors border-b border-theme-border-subtle/30 last:border-0"
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="text-sm font-semibold text-theme-primary">{member.name}</span>
                                    {member.role !== 'Member' && (
                                      <span className="text-[9px] uppercase tracking-wide bg-theme-accent/10 text-theme-accent px-1.5 py-0.5 rounded">
                                        {member.role}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-theme-text-secondary">
                                    <span className="flex items-center gap-1">
                                      <Fingerprint className="w-3 h-3" /> {member.regdNo || 'No RegdNo'}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-theme-border"></span>
                                    <span className="truncate">{getTeamName(member.teamId)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

          <div className="hidden sm:block text-[13px] font-medium text-theme-text-secondary">
            {today}
          </div>
          
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center text-theme-text-secondary hover:text-theme-text hover:bg-theme-surface-secondary transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className="h-8 w-px bg-theme-border hidden sm:block"></div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[13px] font-semibold text-theme-primary">{user?.name}</div>
              <div className="text-[11px] text-theme-text font-medium tracking-wide uppercase">{user?.role}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-theme-surface-higher text-theme-text border border-theme-border flex items-center justify-center font-bold text-sm shadow-inner">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        </>
        )}
      </header>

      <div className="flex-1 flex w-full pt-[88px]">
        {/* Independent Radial Navigation (Fixed on Left Edge) */}
        <RadialNavigation />
        
        {/* Main Content Area */}
        <main className="flex-1 py-6 pr-6 lg:py-10 lg:pr-10 pl-[80px] sm:pl-[100px] lg:pl-[120px] max-w-[1600px] w-full mx-auto">
          <div className="sm:hidden mb-6">
            <h2 className="text-lg font-bold text-theme-primary">{title}</h2>
            <p className="text-xs text-theme-text-secondary mt-1">{description}</p>
          </div>
          
          {children}
        </main>
      </div>

      {/* Quick Profile Modal */}
      
            {selectedMember && (
        <MemberDetailsModal 
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          teams={allData.teams}
          isAdmin={user?.role === 'Admin'}
          isSaving={false}
          currentUserId={user?.uid}
        />
      )}
    </div>
  );
};

export default Layout;
