import React, { useState, useEffect } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import Dropdown from '../common/Dropdown';
import { IndividualAnalytics } from '../analytics/IndividualAnalytics';
import { calculateAttendanceStats, formatPercentage } from '../../utils/analyticsUtils';
import { fetchAttendance } from '../../services/attendanceService';

export const MemberDetailsModal = ({ 
  member, 
  onClose, 
  records, 
  teams = [], 
  isAdmin = false, 
  isSaving = false,
  onSaveMember = null,
  currentUserId
}) => {
  const [editRole, setEditRole] = useState(member?.role || 'Member');
  const [editTeam, setEditTeam] = useState(member?.teamId || '');
  const [localRecords, setLocalRecords] = useState(null);

  useEffect(() => {
    if (member) {
      setEditRole(member.role || 'Member');
      setEditTeam(member.teamId || '');
      
      if (!records) {
        setLocalRecords(null);
        fetchAttendance(null, member.id).then(res => {
          setLocalRecords(res);
        }).catch(err => {
          console.error(err);
          setLocalRecords([]);
        });
      }
    }
  }, [member, records]);

  if (!member) return null;

  const activeRecords = records || localRecords;
  
  if (!activeRecords) {
    return (
      <div className="fixed inset-0 bg-theme-bg/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const memberRecords = activeRecords.filter(r => r.userId === member.id);
  const stats = calculateAttendanceStats(memberRecords, [member]);

  return (
    <div className="fixed inset-0 bg-theme-bg/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-theme-surface border border-theme-border w-full max-w-4xl rounded-2xl shadow-nav overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-theme-border flex justify-between items-start shrink-0 bg-theme-surface-elevated">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-theme-surface flex items-center justify-center text-theme-text font-bold text-xl border-2 border-theme-border">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-theme-primary">{member.name}</h2>
              <p className="text-sm text-theme-text-secondary">{member.email}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-theme-surface rounded-full text-theme-text-secondary hover:text-theme-primary hover:bg-theme-border transition-colors border border-theme-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-8">
          
          {/* Management Section (Only Admin can manage, but they shouldn't change another Admin) */}
          {isAdmin && onSaveMember && member.role !== 'Admin' && (
            <div className="p-5 border border-theme-border rounded-xl bg-theme-surface-elevated flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Role</label>
                <Dropdown 
                  options={[
                    { label: 'Member', value: 'Member' },
                    { label: 'Team Leader', value: 'Team Leader' }
                  ]}
                  value={editRole}
                  onChange={(val) => setEditRole(val)}
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Team Assignment</label>
                <Dropdown 
                  options={[
                    { label: '[ External / Unassigned ]', value: '' },
                    ...teams.map(t => ({ label: t.name, value: t.id }))
                  ]}
                  value={editTeam}
                  onChange={(val) => setEditTeam(val)}
                />
              </div>
              
              <div className="flex items-end">
                <button 
                  onClick={() => onSaveMember(editRole, editTeam)} 
                  disabled={isSaving || (editRole === member.role && editTeam === (member.teamId || ''))}
                  className="btn-primary w-full md:w-auto h-[42px]"
                >
                  {isSaving ? 'Saving...' : 'Update Member'}
                </button>
              </div>
            </div>
          )}
          
          {isAdmin && member.role === 'Admin' && member.id !== currentUserId && (
            <div className="p-4 rounded-lg bg-theme-accent/10 border border-theme-accent/20 flex items-center gap-3 text-theme-accent text-sm font-medium">
              <ShieldAlert className="w-5 h-5" /> You cannot modify another Admin's role.
            </div>
          )}

          {/* Analytics Section */}
          <div>
            <h3 className="text-sm font-bold text-theme-muted uppercase tracking-wider mb-4">Attendance Analytics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="card p-4 text-center border-theme-border-subtle bg-theme-surface-elevated">
                <div className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Attendance</div>
                <div className="text-2xl font-bold text-theme-accent">{formatPercentage(stats.percentage)}%</div>
              </div>
              <div className="card p-4 text-center border-theme-border-subtle bg-theme-surface-elevated">
                <div className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Present</div>
                <div className="text-2xl font-bold text-theme-present">{stats.present}</div>
              </div>
              <div className="card p-4 text-center border-theme-border-subtle bg-theme-surface-elevated">
                <div className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Late</div>
                <div className="text-2xl font-bold text-theme-late">{stats.late}</div>
              </div>
              <div className="card p-4 text-center border-theme-border-subtle bg-theme-surface-elevated">
                <div className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Absent</div>
                <div className="text-2xl font-bold text-theme-absent">{stats.absent}</div>
              </div>
            </div>
            
            {memberRecords.length > 0 ? (
              <IndividualAnalytics records={memberRecords} />
            ) : (
              <div className="text-center py-12 text-theme-text-secondary border border-dashed border-theme-border rounded-xl">
                No attendance history for this member.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
