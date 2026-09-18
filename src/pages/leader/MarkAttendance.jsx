import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { fetchTeams } from '../../services/teamService';
import { fetchMembers } from '../../services/memberService';
import { fetchDailyAttendance, markAttendance, editAttendance } from '../../services/attendanceService';
import { format, isSameDay } from 'date-fns';

const MarkAttendance = () => {
  const { user, isAdmin, isLeader } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(isLeader ? user.teamId : '');
  const [members, setMembers] = useState([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load teams if admin
  useEffect(() => {
    if (isAdmin) {
      fetchTeams().then(setTeams);
    }
  }, [isAdmin]);

  // Load members and existing attendance
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
    
    try {
      if (existingRecord) {
        // Edit existing
        if (!isAdmin) {
          setMessage('Error: Only Admins can edit attendance.');
          return;
        }
        await editAttendance(existingRecord.id, status, existingRecord.date);
        setAttendanceRecords(prev => ({
          ...prev,
          [memberId]: { ...existingRecord, status }
        }));
        setMessage('Attendance updated successfully.');
      } else {
        // Mark new
        const newRecordData = {
          userId: memberId,
          teamId: selectedTeam,
          date: date,
          status,
          markedBy: user.uid
        };
        const newRecord = await markAttendance(newRecordData);
        setAttendanceRecords(prev => ({
          ...prev,
          [memberId]: newRecord
        }));
        setMessage('Attendance marked successfully.');
      }
    } catch (err) {
      setMessage(err.message || 'Error saving attendance');
    }
    
    setTimeout(() => setMessage(''), 3000);
  };

  const isEditingAllowed = () => {
    if (!isAdmin) return false;
    // Check if the selected date is today (server-side check is also in rules/service)
    const [year, month, day] = date.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    return isSameDay(new Date(), selectedDateObj);
  };

  return (
    <Layout title="Mark Attendance">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        
        <div className="flex flex-col md:flex-row gap-4 mb-6 pb-6 border-b border-slate-100">
          {isAdmin && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Team</label>
              <select 
                className="w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedTeam}
                onChange={e => setSelectedTeam(e.target.value)}
              >
                <option value="">-- Select a Team --</option>
                {teams?.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input 
              type="date"
              className="w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-md text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}

        {!selectedTeam ? (
          <p className="text-slate-500 italic">Please select a team to view members.</p>
        ) : loading ? (
          <p className="text-slate-500">Loading members...</p>
        ) : members.length === 0 ? (
          <p className="text-slate-500">No members found in this team.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Member Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {members.map(member => {
                  const record = attendanceRecords[member.id];
                  const hasRecord = !!record;
                  // Leader can't edit at all. Admin can edit if it's the same day.
                  const canEdit = !hasRecord || (hasRecord && isEditingAllowed());
                  
                  return (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {member.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {hasRecord ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'Present' ? 'bg-green-100 text-green-800' :
                            record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {record.status}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not marked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            disabled={!canEdit}
                            onClick={() => handleStatusChange(member.id, 'Present')}
                            className={`px-3 py-1 rounded border text-xs font-medium ${!canEdit ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:bg-green-50 border-green-200 text-green-700'}`}
                          >
                            Present
                          </button>
                          <button
                            disabled={!canEdit}
                            onClick={() => handleStatusChange(member.id, 'Absent')}
                            className={`px-3 py-1 rounded border text-xs font-medium ${!canEdit ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:bg-red-50 border-red-200 text-red-700'}`}
                          >
                            Absent
                          </button>
                          <button
                            disabled={!canEdit}
                            onClick={() => handleStatusChange(member.id, 'Late')}
                            className={`px-3 py-1 rounded border text-xs font-medium ${!canEdit ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:bg-amber-50 border-amber-200 text-amber-700'}`}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MarkAttendance;
