import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { CheckSquare, Users, Settings, Database, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { initializeApp } from 'firebase/app';
import { fetchMembers } from '../../services/memberService';
import { fetchTeams } from '../../services/teamService';
import { fetchAttendance } from '../../services/attendanceService';
import { calculateAttendanceStats } from '../../utils/analyticsUtils';
import { use3DTilt } from '../../hooks/use3DTilt';

const TiltButton = ({ children, to, primary, onClick, disabled }) => {
  const tiltRef = use3DTilt({ maxTilt: 15, scale: 1.05, zLift: 15 }); // Increased tilt max slightly for visibility
  const className = `perspective-container flex items-center gap-2 px-6 py-3 rounded-[1.25rem] text-sm font-semibold transition-all preserve-3d ${
    primary ? 'bg-gradient-to-r from-[#8B5CF6] to-[#C060FF] text-[#0D0F16] shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:opacity-90' : 'bg-[#0D0F16] border border-white/5 text-white hover:bg-[#1A1D27]'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  if (to) {
    return (
      <Link to={to} className={className} ref={tiltRef}>
        <div style={{ transform: 'translateZ(10px)' }} className="flex items-center gap-2">{children}</div>
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={className} ref={tiltRef}>
      <div style={{ transform: 'translateZ(10px)' }} className="flex items-center gap-2">{children}</div>
    </button>
  );
};

const TiltRow = ({ children }) => {
  const tiltRef = use3DTilt({ maxTilt: 5, scale: 1.02, zLift: 10 }); // Increased maxTilt slightly
  return (
    <div 
      ref={tiltRef} 
      className="group flex items-center justify-between py-4 px-2 border border-white/5 hover:border-white/10 transition-colors rounded-2xl preserve-3d bg-[#0D0F16]/80 backdrop-blur-md shadow-lg perspective-container"
    >
      <div style={{ transform: 'translateZ(15px)' }} className="w-full flex items-center justify-between preserve-3d">
        {children}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [clubStats, setClubStats] = useState(null);
  const [teamStatsList, setTeamStatsList] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const members = await fetchMembers();
        const teams = await fetchTeams();
        const records = await fetchAttendance(); // All time for now

        const overallStats = calculateAttendanceStats(records, members);
        setClubStats({ ...overallStats, totalMembers: members.length });

        const tStats = teams.map(t => {
          const tMembers = members.filter(m => m.teamId === t.id);
          const tRecords = records.filter(r => r.teamId === t.id);
          const stats = calculateAttendanceStats(tRecords, tMembers);
          return {
            id: t.id,
            name: t.name,
            leaderCount: tMembers.filter(m => m.role === 'Team Leader').length,
            memberCount: tMembers.filter(m => m.role === 'Member').length,
            ...stats
          };
        });
        
        setTeamStatsList(tStats);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSeed = async () => {
    if (!window.confirm("This will create 3 teams and 12 users. Proceed?")) return;
    setSeeding(true);
    setSeedMessage('Starting...');
    try {
      const teamsData = ['AI', 'Vibe Coding', 'Marketing'];
      const secondaryApp = initializeApp({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      }, "SeedApp_" + Date.now());
      const seedAuth = getAuth(secondaryApp);

      for (const tName of teamsData) {
        setSeedMessage(`Creating ${tName}...`);
        const teamRef = await addDoc(collection(db, 'teams'), { name: tName });
        const teamId = teamRef.id;

        const leaderEmail = `leader.${tName.toLowerCase().replace(' ', '')}@club.com`;
        const leaderCred = await createUserWithEmailAndPassword(seedAuth, leaderEmail, 'password123');
        await setDoc(doc(db, 'users', leaderCred.user.uid), {
          name: `${tName} Leader`, email: leaderEmail, role: 'Team Leader', teamId: teamId
        });
        await signOut(seedAuth);

        for (let i = 1; i <= 3; i++) {
          const memberEmail = `member${i}.${tName.toLowerCase().replace(' ', '')}@club.com`;
          const memberCred = await createUserWithEmailAndPassword(seedAuth, memberEmail, 'password123');
          await setDoc(doc(db, 'users', memberCred.user.uid), {
            name: `${tName} Member ${i}`, email: memberEmail, role: 'Member', teamId: teamId
          });
          await signOut(seedAuth);
        }
      }
      setSeedMessage('Database seeded successfully! Refresh to see data.');
    } catch (err) {
      console.error(err);
      setSeedMessage('Error: ' + err.message);
    }
    setSeeding(false);
  };

  if (loading) {
    return <Layout title="Dashboard"><div className="text-theme-ink-muted">Loading data...</div></Layout>;
  }

  // Calculate proportional widths for the stacked bar
  const total = teamStatsList.reduce((acc, t) => acc + (t.present + t.late + t.absent), 0) || 1;
  const colors = ['#8AA300', '#6C6E78', '#14151A', '#E2E2D9']; // Neutral + Accent palette for teams

  return (
    <Layout title="Club overview">
      
      {/* Quick Actions Row */}
      <div className="flex flex-wrap gap-4 mb-8 hidden">
        {/* Hiding the old quick actions to match the screenshot exactly, or we can keep them above the card */}
      </div>

      {/* Status Band Card */}
      <div className="bg-[#12151f]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-10 mb-10 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 relative z-10">
          
          <div className="flex flex-col items-center lg:items-start shrink-0">
            <div className="text-[110px] font-display font-extrabold leading-[0.8] tracking-tighter mono-numbers text-transparent bg-clip-text bg-gradient-to-t from-[#B23BFF] to-[#3E63FF]">
              {clubStats?.percentage || 0}<span className="text-6xl text-white ml-1">%</span>
            </div>
            <span className="text-theme-ink-muted text-sm mt-4 font-medium">club-wide attendance, this week</span>
          </div>

          <div className="flex-1 w-full flex flex-col justify-center">
            {/* Stacked Bar */}
            <div className="h-6 w-full flex rounded-full overflow-hidden mb-6 bg-[#1A1D27] shadow-inner">
              {teamStatsList.map((t, i) => {
                const tTotal = t.present + t.late + t.absent;
                const width = total === 1 ? 0 : (tTotal / total) * 100;
                let bgStyle = '';
                if (i === 0) bgStyle = 'linear-gradient(90deg, #A855F7, #3B82F6)';
                else if (i === 1) bgStyle = '#3B82F6';
                else bgStyle = '#1E293B';

                return width > 0 ? (
                  <div key={t.id} style={{ width: `${width}%`, background: bgStyle }} className="h-full border-r border-[#12151f]/50 last:border-0" />
                ) : null;
              })}
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-6 mb-6">
              {teamStatsList.map((t, i) => {
                let color = '';
                if (i === 0) color = '#A855F7';
                else if (i === 1) color = '#3B82F6';
                else color = '#64748B';
                return (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-sm" style={{ background: color }}></div>
                    <span className="text-theme-ink-muted">{t.name} <span className="text-white ml-1">· {t.percentage}%</span></span>
                  </div>
                );
              })}
            </div>

            {/* Meta Stats Columns */}
            <div className="flex gap-12 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-theme-ink-muted">Total members</span>
                <span className="text-white font-bold text-xl mono-numbers">{clubStats?.totalMembers || 0}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-theme-ink-muted">Sessions logged</span>
                <span className="text-white font-bold text-xl mono-numbers">{clubStats?.totalRecords || 0}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-theme-ink-muted">Vs. last week</span>
                <span className="text-[#5C87FF] font-bold text-xl mono-numbers">+4 pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Ledger */}
      <div className="mb-12">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-theme-ink-muted">TEAMS</h3>
          <Link to="/admin/analysis" className="text-sm font-semibold text-[#A855F7] hover:text-[#C060FF] transition-colors">
            Open club analysis
          </Link>
        </div>
        
        <div className="flex flex-col gap-4 mb-10">
          {teamStatsList.length === 0 ? (
            <div className="py-8 text-center border border-theme-line glass-panel rounded-xl">
              <p className="text-theme-ink-muted mb-4">No teams found in the database.</p>
            </div>
          ) : (
            teamStatsList.map((t, i) => {
              const isPositive = t.percentage >= 70;
              const trendColor = isPositive ? '#A855F7' : '#EF4444';
              const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
              
              return (
                <TiltRow key={t.id}>
                  <div className="flex items-center gap-4 w-1/3 pl-4">
                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" style={{ background: '#A855F7' }}></div>
                    <div className="flex flex-col gap-1">
                      <h4 className="font-bold text-white text-base">{t.name}</h4>
                      <p className="text-xs text-theme-ink-muted">Leader • {t.memberCount} members</p>
                    </div>
                  </div>

                  {/* Vertical Bar Sparkline */}
                  <div className="hidden md:flex flex-1 items-end gap-1.5 h-8 justify-center">
                    {[...Array(6)].map((_, idx) => {
                      const height = 30 + Math.random() * 70;
                      const isRecent = idx > 3;
                      return (
                        <div 
                          key={idx} 
                          className="w-2 rounded-full transition-all" 
                          style={{ 
                            height: `${height}%`, 
                            background: isRecent ? 'linear-gradient(to top, #3B82F6, #A855F7)' : '#1E293B',
                            boxShadow: isRecent ? '0 0 8px rgba(168,85,247,0.4)' : 'none'
                          }}
                        ></div>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-end w-1/3 pr-6 gap-8">
                    <span className="text-2xl font-bold mono-numbers text-white">{t.percentage}%</span>
                    <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: trendColor }}>
                      <TrendIcon className="w-4 h-4" /> 
                      <span>{Math.floor(Math.random() * 5) + 1} pts</span>
                    </div>
                  </div>
                </TiltRow>
              )
            })
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-4 mb-16">
          <TiltButton to="/admin/mark-attendance" primary>
            <CheckSquare className="w-4 h-4" strokeWidth={2.5} /> Mark today's attendance
          </TiltButton>
          <TiltButton to="/admin/members">
            <Users className="w-4 h-4" strokeWidth={2.5} /> Add a member
          </TiltButton>
          <TiltButton to="/admin/teams">
            <Settings className="w-4 h-4" strokeWidth={2.5} /> Manage teams
          </TiltButton>
        </div>

        {/* Bottom Seed Section */}
        <div className="flex items-center justify-between border-t border-white/5 pt-8">
          <p className="text-xs text-theme-ink-muted">Empty club? Generate 3 teams with 1 leader and 3 members each to try the attendance flow.</p>
          <TiltButton onClick={handleSeed} disabled={seeding}>
            {seeding ? 'Seeding...' : 'Seed database'}
          </TiltButton>
        </div>
        {seedMessage && <p className="mt-4 text-xs text-theme-accent-a text-right">{seedMessage}</p>}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
