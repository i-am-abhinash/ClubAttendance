import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { fetchTeams } from '../../services/teamService';
import { fetchMembers } from '../../services/memberService';
import { markAttendance, fetchDailyAttendance } from '../../services/attendanceService';
import { Search, Filter, Users } from 'lucide-react';
import clsx from 'clsx';

const MarkAttendance = () => {
  const { user } = useAuth();
  
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [members, setMembers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTeams().then(setTeams);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedTeam) return;
      setLoading(true);
      try {
        const teamMembers = await fetchMembers(selectedTeam);
        setMembers(teamMembers);

        const dailyRecords = await fetchDailyAttendance(selectedTeam, date);
        const recordMap = {};
        dailyRecords.forEach(record => {
          recordMap[record.userId] = record;
        });
        setAttendanceRecords(recordMap);
      } catch (err) {
        console.error("Error loading data", err);
      }
      setLoading(false);
    };

    loadData();
  }, [selectedTeam, date]);

  const handleStatusChange = async (memberId, status) => {
    setMessage('');
    const existingRecord = attendanceRecords[memberId];
    
    // Optimistic update
    setAttendanceRecords(prev => ({
      ...prev,
      [memberId]: { ...existingRecord, status, _optimistic: true }
    }));

    try {
      const newRecordData = {
        userId: memberId,
        teamId: selectedTeam,
        date: date,
        status,
        markedBy: user.uid
      };
      // markAttendance handles both create and deterministic update using setDoc
      const newRecord = await markAttendance(newRecordData);
      
      setAttendanceRecords(prev => ({
        ...prev,
        [memberId]: newRecord
      }));
    } catch (err) {
      setMessage(err.message || 'Error saving attendance');
      // Revert on error
      if (existingRecord) {
        setAttendanceRecords(prev => ({ ...prev, [memberId]: existingRecord }));
      } else {
        setAttendanceRecords(prev => {
          const newState = { ...prev };
          delete newState[memberId];
          return newState;
        });
      }
    }
  };

  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout title="Mark Attendance" description="Record attendance for any team (Admin Only).">
      <div className="card overflow-hidden">
        
        {/* Top Controls */}
        <div className="p-6 border-b border-theme-border-subtle bg-theme-bg/30">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="flex-1 max-w-xs">
                <label className="block text-xs font-semibold text-theme-text-secondary uppercase tracking-wider mb-2">Team</label>
                <div className="relative">
                  <select 
                    className="w-full appearance-none bg-white border border-theme-border rounded-lg py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent shadow-sm"
                    value={selectedTeam}
                    onChange={e => setSelectedTeam(e.target.value)}
                  >
                    <option value="">Select team...</option>
                    {teams?.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <Filter className="w-4 h-4 text-theme-muted absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
              
              <div className="flex-1 max-w-xs">
                <label className="block text-xs font-semibold text-theme-text-secondary uppercase tracking-wider mb-2">Date</label>
                <div className="relative">
                  <input 
                    type="date"
                    className="w-full bg-white border border-theme-border rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent shadow-sm"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {selectedTeam && members.length > 0 && (
              <div className="flex-1 max-w-xs md:self-end">
                <div className="relative">
                  <Search className="w-4 h-4 text-theme-muted absolute left-3 top-3" />
                  <input 
                    type="text" 
                    placeholder="Search members..." 
                    className="w-full bg-white border border-theme-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent shadow-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className="px-6 py-3 bg-theme-absent-bg text-theme-absent text-sm font-medium border-b border-theme-absent/20">
            {message}
          </div>
        )}

        {/* Content Area */}
        <div className="p-0">
          {!selectedTeam ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Users className="w-10 h-10 text-theme-muted mb-4" />
              <p className="text-theme-text font-medium">Select a team to begin</p>
              <p className="text-sm text-theme-text-secondary">Choose a team from the dropdown above to mark attendance.</p>
            </div>
          ) : loading ? (
            <div className="p-12 text-center">
              <div className="w-6 h-6 border-2 border-theme-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-theme-text-secondary">Loading roster...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Users className="w-10 h-10 text-theme-muted mb-4" />
              <p className="text-theme-text font-medium">No members found</p>
              <p className="text-sm text-theme-text-secondary">This team currently has no members assigned.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => {
                    const record = attendanceRecords[member.id];
                    const currentStatus = record?.status;
                    
                    return (
                      <tr key={member.id} className={clsx(record?._optimistic && "opacity-60")}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-theme-accent-light text-theme-accent flex items-center justify-center font-bold text-xs">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-theme-primary">{member.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="text-xs text-theme-text-secondary font-medium px-2 py-1 bg-theme-bg rounded-md">
                            {member.role}
                          </span>
                        </td>
                        <td className="w-[300px]">
                          <div className="flex p-1 bg-theme-bg rounded-lg border border-theme-border-subtle overflow-hidden">
                            <button
                              onClick={() => handleStatusChange(member.id, 'Present')}
                              className={clsx(
                                "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                                currentStatus === 'Present' 
                                  ? "bg-theme-present-bg text-theme-present shadow-sm border border-theme-present/20" 
                                  : "text-theme-muted hover:text-theme-text"
                              )}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleStatusChange(member.id, 'Late')}
                              className={clsx(
                                "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                                currentStatus === 'Late' 
                                  ? "bg-theme-late-bg text-theme-late shadow-sm border border-theme-late/20" 
                                  : "text-theme-muted hover:text-theme-text"
                              )}
                            >
                              Late
                            </button>
                            <button
                              onClick={() => handleStatusChange(member.id, 'Absent')}
                              className={clsx(
                                "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                                currentStatus === 'Absent' 
                                  ? "bg-theme-absent-bg text-theme-absent shadow-sm border border-theme-absent/20" 
                                  : "text-theme-muted hover:text-theme-text"
                              )}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center py-8 text-theme-text-secondary">No members match your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MarkAttendance;
