import React, { useState, useEffect, useRef, useMemo } from 'react';
import RadialNavigation from './RadialNavigation';
import { Search, Users, Briefcase, X, Fingerprint } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchMembers } from '../../services/memberService';
import { fetchTeams } from '../../services/teamService';

const Layout = ({ children, title, description }) => {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [allData, setAllData] = useState({ members: [], teams: [] });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (user) {
      Promise.all([fetchMembers(), fetchTeams()]).then(([m, t]) => {
        setAllData({ members: m, teams: t });
      }).catch(console.error);
    }
  }, [user]);

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
          opacity: 0.03,
          filter: "grayscale(100%) sepia(100%) hue-rotate(190deg) saturate(300%) brightness(1.2)"
        }}
      />

      {/* Top Header - Full Width */}
      <header className="fixed top-0 left-0 right-0 h-[88px] w-full flex items-center justify-between px-6 lg:px-10 border-b border-theme-border bg-[#0A101A]/80 backdrop-blur-md z-30">
        
        <div className="flex-1 min-w-0 pr-4 flex items-center gap-4">
          
          <img 
            src="/mitra-logo.jpg" 
            alt="MITRA Logo" 
            className="h-10 sm:h-12 w-auto object-contain mix-blend-screen"
            style={{ filter: 'invert(1) grayscale(100%) brightness(1.5)' }}
          />
          
          <div className="flex flex-col justify-center border-l border-theme-border pl-4 ml-2">
            <h1 className="text-[20px] sm:text-[22px] font-bold text-theme-primary truncate">
              {getGreeting()}, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-[12px] sm:text-[13px] text-theme-text-secondary mt-0.5 truncate hidden sm:block">
              {title} - {description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-5 shrink-0">
          {/* Search */}
          <div ref={searchRef} className="hidden md:block relative w-64 z-50">
            <div className="relative">
              <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search members or teams..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-theme-surface-elevated border border-theme-border rounded-full py-2 pl-9 pr-8 text-[13px] text-theme-text focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all placeholder-theme-muted"
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
              <div className="absolute top-full left-0 right-0 mt-2 bg-theme-surface-higher border border-theme-border-subtle rounded-xl shadow-glow overflow-hidden max-h-[400px] overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
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
          
          <div className="hidden sm:block text-[13px] font-medium text-theme-text-secondary">
            {today}
          </div>
          
          <div className="h-8 w-px bg-theme-border hidden sm:block"></div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[13px] font-semibold text-theme-primary">{user?.name}</div>
              <div className="text-[11px] text-theme-cyan font-medium tracking-wide uppercase">{user?.role}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-theme-surface-higher text-theme-cyan border border-theme-border flex items-center justify-center font-bold text-sm shadow-inner">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A101A]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-md shadow-[0_0_40px_rgba(109,124,255,0.15)] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header / Cover */}
            <div className="h-24 bg-gradient-to-r from-theme-accent/20 to-theme-cyan/20 relative">
              <button 
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-theme-bg/50 text-white hover:bg-theme-absent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="px-6 pb-6 relative">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-theme-surface-higher border-[3px] border-theme-surface flex items-center justify-center text-3xl font-bold text-theme-cyan shadow-lg absolute -top-10 left-6">
                {selectedMember.name?.charAt(0).toUpperCase()}
              </div>

              <div className="pt-12">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-theme-primary">{selectedMember.name}</h2>
                    <p className="text-theme-text-secondary text-sm flex items-center gap-2 mt-1">
                      <Fingerprint className="w-3.5 h-3.5" /> {selectedMember.regdNo || 'No RegdNo'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                    selectedMember.role === 'Admin' ? 'bg-theme-present/20 text-theme-present' :
                    selectedMember.role === 'Team Leader' ? 'bg-theme-accent/20 text-theme-accent' :
                    'bg-theme-surface-higher text-theme-muted border border-theme-border'
                  }`}>
                    {selectedMember.role}
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="bg-theme-bg/50 rounded-xl p-4 border border-theme-border-subtle">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-1">Team Assignment</div>
                    <div className="text-sm font-semibold text-theme-primary flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-theme-cyan" /> {getTeamName(selectedMember.teamId)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-theme-bg/50 rounded-xl p-4 border border-theme-border-subtle">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-1">Branch</div>
                      <div className="text-sm font-semibold text-theme-primary truncate">
                        {selectedMember.branch || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-theme-bg/50 rounded-xl p-4 border border-theme-border-subtle">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-1">Status</div>
                      <div className="text-sm font-semibold text-theme-primary">
                        Active
                      </div>
                    </div>
                  </div>
                  
                  {selectedMember.email && (
                    <div className="bg-theme-bg/50 rounded-xl p-4 border border-theme-border-subtle">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-1">Internal Email</div>
                      <div className="text-sm font-mono text-theme-text-secondary truncate">
                        {selectedMember.email}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
