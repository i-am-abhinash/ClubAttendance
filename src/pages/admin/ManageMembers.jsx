import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { fetchMembers, updateMember, deleteMember } from '../../services/memberService';
import { registerUser } from '../../services/authService';
import { fetchTeams } from '../../services/teamService';
import { fetchAttendance } from '../../services/attendanceService';
import { calculateAttendanceStats } from '../../utils/analyticsUtils';
import { IndividualAnalytics } from '../../components/analytics/IndividualAnalytics';
import { Users, Plus, Trash2, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Dropdown from '../../components/common/Dropdown';

const ManageMembers = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Member', teamId: '' });

  const [selectedMember, setSelectedMember] = useState(null);
  
  // Edit State
  const [editRole, setEditRole] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mData, tData, rData] = await Promise.all([
        fetchMembers(), fetchTeams(), fetchAttendance()
      ]);
      setMembers(mData);
      setTeams(tData);
      setRecords(rData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        teamId: formData.teamId || null
      };
      
      const { adminCreateUser } = await import('../../services/authService');
      await adminCreateUser(formData.email, formData.password, data);
      
      setIsAdding(false);
      setFormData({ name: '', email: '', password: '', role: 'Member', teamId: '' });
      loadData();
    } catch (err) {
      console.error(err);
      alert(`Failed to create member: ${err.message}`);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently remove this member?")) return;
    try {
      await deleteMember(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete member.");
    }
  };

  const handleOpenMember = (member) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setEditTeam(member.teamId || '');
  };

  const handleSaveMember = async () => {
    if (!selectedMember) return;
    setIsSaving(true);
    try {
      const newRole = editRole;
      let newTeamId = editTeam === '' ? null : editTeam;

      // Check for uniqueness if promoting to Team Leader and assigning a team
      if (newRole === 'Team Leader' && newTeamId) {
        const existingLeader = members.find(m => m.teamId === newTeamId && m.role === 'Team Leader' && m.id !== selectedMember.id);
        if (existingLeader) {
          const confirmReplace = window.confirm(`This team already has a Team Leader (${existingLeader.name}). Replace the current Team Leader?`);
          if (!confirmReplace) {
            setIsSaving(false);
            return;
          }
          // Downgrade old leader
          await updateMember(existingLeader.id, { teamId: null });
        }
      }

      await updateMember(selectedMember.id, {
        role: newRole,
        teamId: newTeamId
      });
      
      setSelectedMember(null);
      loadData();
    } catch (error) {
      console.error("Failed to update member", error);
      alert("Failed to update member. Check your permissions.");
    }
    setIsSaving(false);
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Member Directory" description="Manage roles, teams, and view individual analytics.">
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-theme-primary">All Members</h3>
        <div className="flex items-center gap-4">
          <div className="w-64 relative hidden sm:block">
            <input 
              type="text" 
              placeholder="Search directory..." 
              className="w-full bg-theme-surface border border-theme-border rounded-lg py-2 px-4 text-sm text-theme-text focus:outline-none focus:border-theme-accent"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> {isAdding ? 'Cancel' : 'Add Member'}
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="card p-6 mb-8 border-theme-accent border-l-4 bg-theme-surface-elevated">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">Full Name</label>
              <input required type="text" className="w-full bg-theme-surface border border-theme-border rounded-lg py-2 px-3 text-sm text-theme-text focus:outline-none focus:border-theme-accent" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">Email</label>
              <input required type="email" className="w-full bg-theme-surface border border-theme-border rounded-lg py-2 px-3 text-sm text-theme-text focus:outline-none focus:border-theme-accent" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">Temporary Password</label>
              <input required type="password" minLength={6} className="w-full bg-theme-surface border border-theme-border rounded-lg py-2 px-3 text-sm text-theme-text focus:outline-none focus:border-theme-accent" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">Role</label>
              <Dropdown 
                options={[
                  { label: 'Member', value: 'Member' },
                  { label: 'Team Leader', value: 'Team Leader' }
                ]}
                value={formData.role}
                onChange={(val) => setFormData({...formData, role: val})}
              />
            </div>
            
            <div className="md:col-span-2 mt-4 flex gap-3">
              <button type="submit" className="btn-primary">
                Create Account
              </button>
              <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-theme-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-theme-text-secondary">Loading directory...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Users className="w-10 h-10 text-theme-muted mb-4" />
            <p className="text-theme-text font-medium">No members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Team</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => {
                  const teamName = teams.find(t => t.id === member.teamId)?.name;
                  return (
                    <tr 
                      key={member.id} 
                      onClick={() => handleOpenMember(member)}
                      className="cursor-pointer group"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-theme-surface-elevated flex items-center justify-center text-theme-cyan font-bold text-sm border border-theme-border group-hover:border-theme-accent/50 transition-colors">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-theme-primary group-hover:text-theme-accent transition-colors">{member.name}</div>
                            <div className="text-xs text-theme-text-secondary">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded-md ${
                          member.role === 'Admin' ? 'bg-theme-accent/20 text-theme-accent' : 
                          member.role === 'Team Leader' ? 'bg-theme-cyan/20 text-theme-cyan' : 
                          'bg-theme-surface-higher text-theme-text-secondary'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-theme-text">{!member.teamId && member.role === 'Member' ? 'External Member' : 'Team Member'}</span>
                      </td>
                      <td>
                        <span className="text-sm text-theme-text-secondary">{teamName || 'Not Assigned'}</span>
                      </td>
                      <td className="text-right">
                        <button 
                          onClick={(e) => handleDelete(member.id, e)} 
                          className="text-theme-muted hover:text-theme-absent transition-colors p-2 rounded-lg hover:bg-theme-absent-bg"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Analytics & Management Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-[#070B12]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-theme-surface border border-theme-border w-full max-w-4xl rounded-2xl shadow-nav overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-theme-border flex justify-between items-start shrink-0 bg-theme-surface-elevated">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-theme-surface flex items-center justify-center text-theme-cyan font-bold text-xl border-2 border-theme-border">
                  {selectedMember.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-theme-primary">{selectedMember.name}</h2>
                  <p className="text-sm text-theme-text-secondary">{selectedMember.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMember(null)}
                className="p-2 bg-theme-surface rounded-full text-theme-text-secondary hover:text-theme-primary hover:bg-theme-border transition-colors border border-theme-border"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-8">
              
              {/* Management Section (Only Admin can manage, but they shouldn't change another Admin) */}
              {selectedMember.role !== 'Admin' && (
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
                      onClick={handleSaveMember} 
                      disabled={isSaving || (editRole === selectedMember.role && editTeam === (selectedMember.teamId || ''))}
                      className="btn-primary w-full md:w-auto h-[42px]"
                    >
                      {isSaving ? 'Saving...' : 'Update Member'}
                    </button>
                  </div>
                </div>
              )}
              
              {selectedMember.role === 'Admin' && selectedMember.id !== user.uid && (
                <div className="p-4 rounded-lg bg-theme-accent/10 border border-theme-accent/20 flex items-center gap-3 text-theme-accent text-sm font-medium">
                  <ShieldAlert className="w-5 h-5" /> You cannot modify another Admin's role.
                </div>
              )}

              {/* Analytics Section */}
              <div>
                <h3 className="text-sm font-bold text-theme-muted uppercase tracking-wider mb-4">Attendance Analytics</h3>
                {(() => {
                  const memberRecords = records.filter(r => r.userId === selectedMember.id);
                  const stats = calculateAttendanceStats(memberRecords, [selectedMember]);
                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="card p-4 text-center border-theme-border-subtle bg-theme-surface-elevated">
                          <div className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Attendance</div>
                          <div className="text-2xl font-bold text-theme-accent">{stats.percentage}%</div>
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
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageMembers;
