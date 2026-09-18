import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { fetchMembers } from '../../services/memberService';
import { fetchAttendance, markAttendance } from '../../services/attendanceService';
import { fetchTeams } from '../../services/teamService';
import { TeamAnalytics } from '../../components/analytics/TeamAnalytics';
import { applyFilters } from '../../utils/analyticsUtils';
import { Users, Calendar, TrendingUp, Search, ArrowLeft, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

const TeamDetails = () => {
  const { user, isAdmin, isLeader } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  
  // Determine the effective team ID based on role
  // Admin: from URL. Leader: from auth context.
  const effectiveTeamId = isAdmin ? params.teamId : user?.teamId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [teamInfo, setTeamInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState([]);
  
  const [activeTab, setActiveTab] = useState('Overview'); // Overview, Members, Attendance, Analytics
  
  // Attendance Tab State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    if (!effectiveTeamId) {
      setError("No team assigned or selected.");
      setLoading(false);
      return;
    }

    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [teamsData, membersData, recordsData] = await Promise.all([
          fetchTeams(),
          fetchMembers(effectiveTeamId),
          fetchAttendance(effectiveTeamId)
        ]);

        const team = teamsData.find(t => t.id === effectiveTeamId);
        if (!team) throw new Error("Team not found.");
        
        const teamLeader = membersData.find(m => m.role === 'Team Leader');
        
        setTeamInfo({
          ...team,
          leaderName: teamLeader ? teamLeader.name : 'No Leader Assigned'
        });
        
        setMembers(membersData);
        setRecords(recordsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load team data. You may not have permission to view this team.");
      }
      setLoading(false);
    };

    loadInitialData();
  }, [effectiveTeamId]);

  // Derived Attendance Data for the selected date
  const filteredRecordsByDate = useMemo(() => {
    return records.filter(r => r.date === date);
  }, [records, date]);

  const filteredMembers = useMemo(() => {
    if (!search) return members;
    const lowerSearch = search.toLowerCase();
    return members.filter(m => 
      m.name.toLowerCase().includes(lowerSearch) || 
      m.email.toLowerCase().includes(lowerSearch)
    );
  }, [members, search]);

  const statsForDate = useMemo(() => {
    const present = filteredRecordsByDate.filter(r => r.status === 'Present').length;
    const late = filteredRecordsByDate.filter(r => r.status === 'Late').length;
    const absent = filteredRecordsByDate.filter(r => r.status === 'Absent').length;
    const notMarked = members.length - (present + late + absent);
    return { present, late, absent, notMarked };
  }, [filteredRecordsByDate, members.length]);

  const handleStatusChange = async (memberId, status) => {
    if (!isAdmin) return;
    
    // Optimistic update
    const prevRecords = [...records];
    const tempId = `${memberId}_${date}`;
    
    const existingIndex = records.findIndex(r => r.userId === memberId && r.date === date);
    let newRecords = [...records];
    
    if (existingIndex >= 0) {
      newRecords[existingIndex] = { ...newRecords[existingIndex], status, _optimistic: true };
    } else {
      newRecords.push({ id: tempId, userId: memberId, teamId: effectiveTeamId, date, status, _optimistic: true });
    }
    setRecords(newRecords);

    try {
      const savedRecord = await markAttendance({
        userId: memberId,
        teamId: effectiveTeamId,
        date: date,
        status: status,
        markedBy: user.uid
      });
      
      // Update with confirmed record
      setRecords(current => {
        const idx = current.findIndex(r => r.userId === memberId && r.date === date);
        if (idx >= 0) {
          const updated = [...current];
          updated[idx] = savedRecord;
          return updated;
        }
        return current;
      });
    } catch (err) {
      console.error(err);
      // Revert on failure
      setRecords(prevRecords);
    }
  };

  if (loading) {
    return (
      <Layout title="Team Details" description="Loading workspace...">
        <div className="card h-64 animate-pulse bg-theme-bg/50"></div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Access Denied" description="Authorization Error">
        <div className="card p-12 text-center flex flex-col items-center">
          <ShieldAlert className="w-10 h-10 text-theme-absent mb-4" />
          <p className="text-theme-text font-medium">{error}</p>
          {isAdmin && (
            <button onClick={() => navigate('/admin/teams')} className="mt-6 btn-primary">
              Return to Teams
            </button>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={teamInfo?.name} description={`Team Leader: ${teamInfo?.leaderName}`}>
      
      {/* Header Area */}
      <div className="mb-6 flex flex-col gap-4">
        {isAdmin && (
          <button 
            onClick={() => navigate('/admin/teams')}
            className="flex items-center gap-2 text-sm font-medium text-theme-text-secondary hover:text-theme-primary transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Teams
          </button>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-theme-primary tracking-tight">{teamInfo?.name}</h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-theme-text-secondary font-medium">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {members.length} Members</span>
              <span>&bull;</span>
              <span>Leader: {teamInfo?.leaderName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-theme-border-subtle mb-6">
        {['Overview', 'Members', 'Attendance', 'Analytics'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-6 py-3 font-semibold text-sm whitespace-nowrap transition-colors border-b-2",
              activeTab === tab 
                ? "border-theme-accent text-theme-accent" 
                : "border-transparent text-theme-text-secondary hover:text-theme-text hover:border-theme-border"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">Total Members</span>
              <Users className="w-5 h-5 text-theme-muted" />
            </div>
            <span className="text-3xl font-bold text-theme-primary">{members.length}</span>
          </div>
          <div className="card p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">Total Sessions Logged</span>
              <Calendar className="w-5 h-5 text-theme-muted" />
            </div>
            <span className="text-3xl font-bold text-theme-primary">{records.length}</span>
          </div>
          <div className="card p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">Overall Attendance</span>
              <TrendingUp className="w-5 h-5 text-theme-muted" />
            </div>
            <span className="text-3xl font-bold text-theme-accent">
              {records.length > 0 
                ? Math.round(((records.filter(r => r.status === 'Present').length + (records.filter(r => r.status === 'Late').length * 0.5)) / records.length) * 100) 
                : 0}%
            </span>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'Members' && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-theme-border-subtle flex justify-between items-center">
            <h3 className="font-semibold text-theme-primary">Team Roster</h3>
            {isLeader && (
              <button onClick={() => navigate('/leader/external-members')} className="btn-primary text-xs py-1.5 px-3">
                Recruit External Members
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-theme-accent-light text-theme-accent flex items-center justify-center font-bold text-xs">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-theme-primary">{m.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={clsx(
                        "text-xs font-semibold px-2 py-1 rounded-md",
                        m.role === 'Team Leader' ? "bg-theme-accent-light text-theme-accent" : "bg-theme-bg text-theme-text-secondary"
                      )}>
                        {m.role}
                      </span>
                    </td>
                    <td className="text-sm text-theme-text-secondary">{m.email}</td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr><td colSpan="3" className="text-center py-8 text-theme-text-secondary">No members found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'Attendance' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
            
            <div className="flex gap-4 items-end flex-1 w-full max-w-lg">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-theme-text-secondary uppercase tracking-wider mb-2">Date</label>
                <input 
                  type="date"
                  className="w-full bg-white border border-theme-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent shadow-sm"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search members..." 
                  className="w-full bg-white border border-theme-border rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent shadow-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            {!isAdmin && (
              <div className="px-3 py-1.5 rounded-full bg-theme-bg text-theme-text-secondary text-xs font-bold uppercase tracking-wider border border-theme-border flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> View Only
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-theme-border-subtle p-4 shadow-sm flex items-center justify-between">
              <span className="text-sm font-semibold text-theme-text">Present</span>
              <span className="text-xl font-bold text-theme-present">{statsForDate.present}</span>
            </div>
            <div className="bg-white rounded-xl border border-theme-border-subtle p-4 shadow-sm flex items-center justify-between">
              <span className="text-sm font-semibold text-theme-text">Late</span>
              <span className="text-xl font-bold text-theme-late">{statsForDate.late}</span>
            </div>
            <div className="bg-white rounded-xl border border-theme-border-subtle p-4 shadow-sm flex items-center justify-between">
              <span className="text-sm font-semibold text-theme-text">Absent</span>
              <span className="text-xl font-bold text-theme-absent">{statsForDate.absent}</span>
            </div>
            <div className="bg-white rounded-xl border border-theme-border-subtle p-4 shadow-sm flex items-center justify-between">
              <span className="text-sm font-semibold text-theme-text-secondary">Not Marked</span>
              <span className="text-xl font-bold text-theme-muted">{statsForDate.notMarked}</span>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => {
                    const record = filteredRecordsByDate.find(r => r.userId === member.id);
                    const currentStatus = record?.status;
                    
                    return (
                      <tr key={member.id} className={clsx(record?._optimistic && "opacity-60")}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-theme-bg flex items-center justify-center font-bold text-xs text-theme-primary border border-theme-border-subtle">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-theme-primary">{member.name}</span>
                          </div>
                        </td>
                        <td className="w-[280px] sm:w-[350px]">
                          {isAdmin ? (
                            <div className="flex p-1 bg-theme-bg rounded-lg border border-theme-border-subtle overflow-hidden">
                              <button
                                onClick={() => handleStatusChange(member.id, 'Present')}
                                className={clsx(
                                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                                  currentStatus === 'Present' ? "bg-theme-present-bg text-theme-present shadow-sm border border-theme-present/20" : "text-theme-muted hover:text-theme-text"
                                )}
                              >
                                ✓ Present
                              </button>
                              <button
                                onClick={() => handleStatusChange(member.id, 'Late')}
                                className={clsx(
                                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                                  currentStatus === 'Late' ? "bg-theme-late-bg text-theme-late shadow-sm border border-theme-late/20" : "text-theme-muted hover:text-theme-text"
                                )}
                              >
                                ◷ Late
                              </button>
                              <button
                                onClick={() => handleStatusChange(member.id, 'Absent')}
                                className={clsx(
                                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                                  currentStatus === 'Absent' ? "bg-theme-absent-bg text-theme-absent shadow-sm border border-theme-absent/20" : "text-theme-muted hover:text-theme-text"
                                )}
                              >
                                × Absent
                              </button>
                            </div>
                          ) : (
                            <span className={clsx(
                              "text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit",
                              currentStatus === 'Present' ? "bg-theme-present-bg text-theme-present" :
                              currentStatus === 'Late' ? "bg-theme-late-bg text-theme-late" :
                              currentStatus === 'Absent' ? "bg-theme-absent-bg text-theme-absent" :
                              "bg-theme-bg text-theme-text-secondary"
                            )}>
                              {currentStatus === 'Present' && "✓ Present"}
                              {currentStatus === 'Late' && "◷ Late"}
                              {currentStatus === 'Absent' && "× Absent"}
                              {!currentStatus && "— Not Marked"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMembers.length === 0 && (
                    <tr><td colSpan="2" className="text-center py-8 text-theme-text-secondary">No members found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'Analytics' && (
        <div>
          {records.length > 0 ? (
            <TeamAnalytics records={records} members={members} />
          ) : (
            <div className="card p-12 text-center flex flex-col items-center">
              <TrendingUp className="w-10 h-10 text-theme-muted mb-4" />
              <p className="text-theme-text font-medium">No analytics available</p>
              <p className="text-sm text-theme-text-secondary">Attendance data is required to generate insights.</p>
            </div>
          )}
        </div>
      )}

    </Layout>
  );
};

export default TeamDetails;
