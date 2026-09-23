import React, { useState, useEffect } from 'react';
import { MemberDetailsModal } from "../../components/members/MemberDetailsModal";
import { exportAttendanceToExcel } from '../../utils/exportUtils';
import { formatPercentage, calculateAttendanceStats } from '../../utils/analyticsUtils';

import Layout from '../../components/common/Layout';
import { useClubData } from '../../context/ClubDataContext';
import { fetchMembers, updateMember, deleteMember } from '../../services/memberService';
import { registerUser } from '../../services/authService';
import { fetchTeams } from '../../services/teamService';
import { fetchAttendance } from '../../services/attendanceService';

import { IndividualAnalytics } from '../../components/analytics/IndividualAnalytics';
import { Users, Plus, Trash2, X, ShieldAlert, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Dropdown from '../../components/common/Dropdown';

const ManageMembers = () => {
  const { user } = useAuth();
  const { members, teams, loading: contextLoading, refreshClubData } = useClubData();
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
      const rData = await fetchAttendance();
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

  const handleSaveMember = async (newRole, newTeam) => {
    if (!selectedMember) return;
    setIsSaving(true);
    try {
      let newTeamId = newTeam === '' ? null : newTeam;

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
            <button 
              onClick={() => exportAttendanceToExcel(filteredMembers, records, 'Members_Attendance_Report')}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
          <div className="w-64 relative hidden sm:block">
            <input 
              type="text" 
              placeholder="Search directory..." 
              className="w-full bg-theme-surface border border-theme-border rounded-lg py-2 px-4 text-sm text-theme-text focus:outline-none focus:border-theme-text"
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
              <input required type="text" className="w-full bg-theme-surface border border-theme-border rounded-lg py-2 px-3 text-sm text-theme-text focus:outline-none focus:border-theme-text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">Email</label>
              <input required type="email" className="w-full bg-theme-surface border border-theme-border rounded-lg py-2 px-3 text-sm text-theme-text focus:outline-none focus:border-theme-text" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">Temporary Password</label>
              <input required type="password" minLength={6} className="w-full bg-theme-surface border border-theme-border rounded-lg py-2 px-3 text-sm text-theme-text focus:outline-none focus:border-theme-text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
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
                          <div className="w-9 h-9 rounded-full bg-theme-surface-elevated flex items-center justify-center text-theme-text font-bold text-sm border border-theme-border group-hover:border-theme-accent/50 transition-colors">
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
                          member.role === 'Team Leader' ? 'bg-theme-surface-secondary text-theme-text' : 
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
      <MemberDetailsModal 
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        records={records}
        teams={teams}
        isAdmin={true}
        isSaving={isSaving}
        onSaveMember={handleSaveMember}
        currentUserId={user.uid}
      />
    </Layout>
  );
};

export default ManageMembers;
