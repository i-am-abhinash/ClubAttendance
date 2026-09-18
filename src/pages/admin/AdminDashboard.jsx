import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Users, UsersRound, Calendar, CheckSquare, Settings, Database, ArrowRight, TrendingUp } from 'lucide-react';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { initializeApp } from 'firebase/app';
import { fetchMembers } from '../../services/memberService';
import { fetchTeams } from '../../services/teamService';
import { fetchAttendance } from '../../services/attendanceService';
import { calculateAttendanceStats } from '../../utils/analyticsUtils';

const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
  <div className="card p-6 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">{title}</span>
      <div className="p-2 bg-theme-bg rounded-lg text-theme-primary">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-3xl font-bold text-theme-primary">{value}</span>
      <div className="flex items-center gap-2">
        {trend && (
          <span className="text-xs font-semibold text-theme-present bg-theme-present-bg px-2 py-0.5 rounded-md">
            {trend}
          </span>
        )}
        <span className="text-xs font-medium text-theme-text-secondary">{subtitle}</span>
      </div>
    </div>
  </div>
);

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
        const records = await fetchAttendance();

        const overallStats = calculateAttendanceStats(records, members);
        setClubStats({ ...overallStats, totalMembers: members.length });

        const tStats = teams.map(t => {
          const tMembers = members.filter(m => m.teamId === t.id);
          const tRecords = records.filter(r => r.teamId === t.id);
          const stats = calculateAttendanceStats(tRecords, tMembers);
          return {
            id: t.id,
            name: t.name,
            memberCount: tMembers.length,
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
    return (
      <Layout title="Dashboard" description="Monitor attendance and activity.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="card h-32 animate-pulse bg-theme-bg/50"></div>)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" description="Monitor attendance, teams, and member activity.">
      
      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <Link to="/admin/mark-attendance" className="btn-primary flex items-center gap-2">
          <CheckSquare className="w-4 h-4" /> Mark Attendance
        </Link>
        <Link to="/admin/members" className="btn-secondary flex items-center gap-2">
          <Users className="w-4 h-4" /> Manage Members
        </Link>
        <Link to="/admin/teams" className="btn-secondary flex items-center gap-2">
          <Settings className="w-4 h-4" /> Teams Setup
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Members" 
          value={clubStats?.totalMembers || 0} 
          subtitle="Registered users" 
          icon={UsersRound} 
        />
        <StatCard 
          title="Active Teams" 
          value={teamStatsList.length} 
          subtitle="Managed groups" 
          icon={Database} 
        />
        <StatCard 
          title="Attendance Rate" 
          value={`${clubStats?.percentage || 0}%`} 
          subtitle="Overall average" 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Sessions Logged" 
          value={clubStats?.totalRecords || 0} 
          subtitle="Total recorded" 
          icon={Calendar} 
        />
      </div>

      {/* Team Performance Table */}
      <div className="card overflow-hidden mb-12">
        <div className="px-6 py-5 border-b border-theme-border-subtle flex items-center justify-between">
          <h3 className="font-semibold text-theme-primary">Team Performance</h3>
          <Link to="/admin/analysis" className="text-sm font-medium text-theme-accent hover:text-theme-primary-hover transition-colors">
            View Analytics &rarr;
          </Link>
        </div>
        
        {teamStatsList.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Database className="w-10 h-10 text-theme-muted mb-4" />
            <p className="text-theme-text font-medium mb-1">No teams found</p>
            <p className="text-sm text-theme-text-secondary mb-6">Create teams to start tracking attendance.</p>
            <button onClick={handleSeed} disabled={seeding} className="btn-secondary">
              {seeding ? 'Seeding...' : 'Seed Database with Dummy Data'}
            </button>
            {seedMessage && <p className="mt-4 text-xs text-theme-accent">{seedMessage}</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Members</th>
                  <th>Present</th>
                  <th>Late</th>
                  <th>Absent</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {teamStatsList.map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium text-theme-primary">{t.name}</td>
                    <td className="text-theme-text-secondary">{t.memberCount}</td>
                    <td>
                      <span className="bg-theme-present-bg text-theme-present px-2.5 py-1 rounded-md text-xs font-semibold">
                        {t.present}
                      </span>
                    </td>
                    <td>
                      <span className="bg-theme-late-bg text-theme-late px-2.5 py-1 rounded-md text-xs font-semibold">
                        {t.late}
                      </span>
                    </td>
                    <td>
                      <span className="bg-theme-absent-bg text-theme-absent px-2.5 py-1 rounded-md text-xs font-semibold">
                        {t.absent}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{t.percentage}%</span>
                        <div className="w-24 h-1.5 bg-theme-border-subtle rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-theme-accent rounded-full" 
                            style={{ width: `${t.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </Layout>
  );
};

export default AdminDashboard;
