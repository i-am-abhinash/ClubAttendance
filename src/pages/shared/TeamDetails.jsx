import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { fetchMembers } from '../../services/memberService';
import { fetchAttendance, markAttendance } from '../../services/attendanceService';
import { fetchTeams } from '../../services/teamService';
import { TeamAnalytics } from '../../components/analytics/TeamAnalytics';
import { Users, Calendar, TrendingUp, Search, ArrowLeft, ShieldAlert, CheckCircle2, Clock, XCircle, Minus } from 'lucide-react';
import clsx from 'clsx';

const TeamDetails = () => {
  const { user, isAdmin, isLeader } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  
  const effectiveTeamId = isAdmin ? params.teamId : user?.teamId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [teamInfo, setTeamInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState([]);
  
  const [activeTab, setActiveTab] = useState('Overview');
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

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
          leaderName: teamLeader ? teamLeader.name : 'Unassigned'
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
    const existingIndex = records.findIndex(r => r.userId === memberId && r.date === date);
    const oldRecords = [...records];
    
    const newRecord = {
      id: `${memberId}_${date}`,
      userId: memberId,
      teamId: effectiveTeamId,
      date,
      status,
      timestamp: new Date().toISOString(),
      _optimistic: true
    };

    if (existingIndex >= 0) {
      const updated = [...records];
      updated[existingIndex] = newRecord;
      setRecords(updated);
    } else {
      setRecords([...records, newRecord]);
    }

    try {
      await markAttendance(memberId, date, status, effectiveTeamId);
      // Clean optimistic flag
      setRecords(prev => prev.map(r => r.id === newRecord.id ? { ...r, _optimistic: false } : r));
    } catch (err) {
      console.error(err);
      alert("Failed to mark attendance.");
      setRecords(oldRecords); // Revert
    }
  };

  const getOverallAttendanceRate = () => {
    if (records.length === 0) return 0;
    let score = 0;
    records.forEach(r => {
      if (r.status === 'Present') score += 1;
      if (r.status === 'Late') score += 0.5;
    });
    return Math.round((score / records.length) * 100);
  };

  if (loading) {
    return (
      <Layout title="Team Details" description="Loading workspace...">
        <div className="card p-12 text-center bg-theme-surface">
          <div className="w-6 h-6 border-2 border-theme-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-theme-text-secondary">Loading workspace...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Access Denied" description="Authorization Error">
        <div className="card p-12 text-center bg-theme-surface">
          <ShieldAlert className="w-10 h-10 text-theme-absent mx-auto mb-4" />
          <h2 className="text-xl font-bold text-theme-primary mb-2">Access Denied</h2>
          <p className="text-sm text-theme-text-secondary">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={teamInfo?.name || "Team Workspace"} description="Unified team management and analytics.">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {isAdmin && (
            <button 
              onClick={() => navigate('/admin/teams')}
              className="p-2 rounded-full hover:bg-theme-surface-elevated text-theme-text-secondary hover:text-theme-primary transition-colors border border-transparent hover:border-theme-border"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-2xl font-bold text-theme-primary drop-shadow-sm">{teamInfo?.name}</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-theme-border mb-6">
        {['Overview', 'Members', 'Attendance', 'Analytics'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap border-b-2",
              activeTab === tab 
                ? "border-theme-accent text-theme-accent" 
                : "border-transparent text-theme-text-secondary hover:text-theme-primary hover:border-theme-border"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card p-6 bg-gradient-to-br from-theme-surface to-[#0B111D]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-theme-muted uppercase tracking-wider">Members</h3>
              <Users className="w-5 h-5 text-theme-cyan" />
            </div>
            <div className="text-3xl font-bold text-theme-primary drop-shadow-sm">{members.length}</div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-theme-surface to-[#0B111D]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-theme-muted uppercase tracking-wider">Overall Attendance</h3>
              <TrendingUp className="w-5 h-5 text-theme-accent" />
            </div>
            <div className="text-3xl font-bold text-theme-primary drop-shadow-sm">{getOverallAttendanceRate()}%</div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-theme-surface to-[#0B111D]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-theme-muted uppercase tracking-wider">Team Leader</h3>
              <ShieldAlert className="w-5 h-5 text-theme-late" />
            </div>
            <div className="text-xl font-bold text-theme-primary truncate">{teamInfo?.leaderName}</div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'Members' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-theme-border bg-theme-surface-elevated flex justify-between items-center">
            <h3 className="font-bold text-theme-primary">Team Roster</h3>
            {isLeader && (
              <button 
                onClick={() => navigate('/leader/external-members')}
                className="btn-primary text-xs py-1.5 px-3"
              >
                Recruit Members
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  {(isAdmin || isLeader) && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-theme-surface-higher flex items-center justify-center font-bold text-xs text-theme-cyan border border-theme-border shadow-inner">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-theme-primary">{member.name}</span>
                      </div>
                    </td>
                    <td><span className="text-theme-text-secondary text-sm">{member.email}</span></td>
                    <td>
                      <span className={clsx(
                        "text-[10px] uppercase font-bold tracking-wide px-2 py-1 rounded-md",
                        member.role === 'Team Leader' ? "bg-theme-cyan/20 text-theme-cyan" : "bg-theme-surface-higher text-theme-text-secondary"
                      )}>
                        {member.role}
                      </span>
                    </td>
                    {(isAdmin || isLeader) && (
                      <td className="text-right">
                        {member.role !== 'Team Leader' && (
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Remove ${member.name} from this team? They will become an External Member.`)) return;
                              try {
                                const { updateMember } = await import('../../services/memberService');
                                await updateMember(member.id, { teamId: null });
                                setMembers(prev => prev.filter(m => m.id !== member.id));
                              } catch (err) {
                                alert("Failed to remove member.");
                              }
                            }}
                            className="text-theme-muted hover:text-theme-absent transition-colors p-2 rounded-lg hover:bg-theme-absent-bg inline-flex items-center justify-center"
                            title="Remove from Team"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr><td colSpan={(isAdmin || isLeader) ? 4 : 3} className="text-center py-8 text-theme-text-secondary">No members in this team.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'Attendance' && (
        <div className="flex flex-col gap-6">
          
          <div className="card p-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-theme-surface-elevated">
            <div className="flex w-full md:w-auto gap-4">
              <div className="flex-1 md:w-48">
                <input 
                  type="date" 
                  className="w-full bg-theme-surface border border-theme-border rounded-lg py-2 px-3 text-sm text-theme-text focus:outline-none focus:border-theme-accent shadow-inner [color-scheme:dark]"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div className="flex-1 md:w-64 relative">
                <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search members..." 
                  className="w-full bg-theme-surface border border-theme-border rounded-lg py-2 pl-9 pr-3 text-sm text-theme-text focus:outline-none focus:border-theme-accent shadow-inner placeholder-theme-muted"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            {!isAdmin && (
              <div className="px-3 py-1.5 rounded-lg bg-theme-surface-higher text-theme-text-secondary text-[11px] font-bold uppercase tracking-wider border border-theme-border flex items-center gap-1.5 shadow-inner">
                <ShieldAlert className="w-3.5 h-3.5" /> View Only
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-theme-surface-elevated rounded-xl border border-theme-border p-4 shadow-soft flex items-center justify-between group hover:border-theme-present/50 transition-colors">
              <span className="text-sm font-semibold text-theme-text">Present</span>
              <span className="text-2xl font-bold text-theme-present drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">{statsForDate.present}</span>
            </div>
            <div className="bg-theme-surface-elevated rounded-xl border border-theme-border p-4 shadow-soft flex items-center justify-between group hover:border-theme-late/50 transition-colors">
              <span className="text-sm font-semibold text-theme-text">Late</span>
              <span className="text-2xl font-bold text-theme-late drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">{statsForDate.late}</span>
            </div>
            <div className="bg-theme-surface-elevated rounded-xl border border-theme-border p-4 shadow-soft flex items-center justify-between group hover:border-theme-absent/50 transition-colors">
              <span className="text-sm font-semibold text-theme-text">Absent</span>
              <span className="text-2xl font-bold text-theme-absent drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]">{statsForDate.absent}</span>
            </div>
            <div className="bg-theme-surface-elevated rounded-xl border border-theme-border p-4 shadow-soft flex items-center justify-between">
              <span className="text-sm font-semibold text-theme-text-secondary">Not Marked</span>
              <span className="text-2xl font-bold text-theme-muted">{statsForDate.notMarked}</span>
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
                            <div className="w-8 h-8 rounded-full bg-theme-surface-higher flex items-center justify-center font-bold text-xs text-theme-cyan border border-theme-border">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-theme-primary">{member.name}</span>
                          </div>
                        </td>
                        <td className="w-[280px] sm:w-[350px]">
                          {isAdmin ? (
                            <div className="flex p-1 bg-theme-surface-higher rounded-lg border border-theme-border overflow-hidden gap-1">
                              <button
                                onClick={() => handleStatusChange(member.id, 'Present')}
                                className={clsx(
                                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex items-center justify-center gap-1.5 border",
                                  currentStatus === 'Present' ? "bg-theme-present/20 text-theme-present shadow-[0_0_15px_rgba(52,211,153,0.2)] border-theme-present/50 scale-[1.02]" : "text-theme-muted border-transparent hover:text-theme-present hover:bg-theme-surface-elevated hover:-translate-y-[2px] hover:scale-[1.05] hover:shadow-[0_8px_20px_rgba(52,211,153,0.15)] hover:border-theme-present/30"
                                )}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Present
                              </button>
                              <button
                                onClick={() => handleStatusChange(member.id, 'Late')}
                                className={clsx(
                                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex items-center justify-center gap-1.5 border",
                                  currentStatus === 'Late' ? "bg-theme-late/20 text-theme-late shadow-[0_0_15px_rgba(251,191,36,0.2)] border-theme-late/50 scale-[1.02]" : "text-theme-muted border-transparent hover:text-theme-late hover:bg-theme-surface-elevated hover:-translate-y-[2px] hover:scale-[1.05] hover:shadow-[0_8px_20px_rgba(251,191,36,0.15)] hover:border-theme-late/30"
                                )}
                              >
                                <Clock className="w-3.5 h-3.5" /> Late
                              </button>
                              <button
                                onClick={() => handleStatusChange(member.id, 'Absent')}
                                className={clsx(
                                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex items-center justify-center gap-1.5 border",
                                  currentStatus === 'Absent' ? "bg-theme-absent/20 text-theme-absent shadow-[0_0_15px_rgba(251,113,133,0.2)] border-theme-absent/50 scale-[1.02]" : "text-theme-muted border-transparent hover:text-theme-absent hover:bg-theme-surface-elevated hover:-translate-y-[2px] hover:scale-[1.05] hover:shadow-[0_8px_20px_rgba(251,113,133,0.15)] hover:border-theme-absent/30"
                                )}
                              >
                                <XCircle className="w-3.5 h-3.5" /> Absent
                              </button>
                            </div>
                          ) : (
                            <span className={clsx(
                              "text-[11px] font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 w-fit uppercase tracking-wide",
                              currentStatus === 'Present' ? "bg-theme-present/10 text-theme-present border border-theme-present/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]" :
                              currentStatus === 'Late' ? "bg-theme-late/10 text-theme-late border border-theme-late/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]" :
                              currentStatus === 'Absent' ? "bg-theme-absent/10 text-theme-absent border border-theme-absent/20 shadow-[0_0_10px_rgba(251,113,133,0.1)]" :
                              "bg-theme-surface-higher text-theme-text-secondary border border-theme-border"
                            )}>
                              {currentStatus === 'Present' && <><CheckCircle2 className="w-3.5 h-3.5" /> Present</>}
                              {currentStatus === 'Late' && <><Clock className="w-3.5 h-3.5" /> Late</>}
                              {currentStatus === 'Absent' && <><XCircle className="w-3.5 h-3.5" /> Absent</>}
                              {!currentStatus && <><Minus className="w-3.5 h-3.5" /> Not Marked</>}
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
            <div className="card p-12 text-center flex flex-col items-center bg-theme-surface-elevated">
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
