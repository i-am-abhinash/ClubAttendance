import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { fetchMembers, createMember, deleteMember } from '../../services/memberService';
import { fetchTeams } from '../../services/teamService';
import { fetchAttendance } from '../../services/attendanceService';
import { IndividualAnalytics } from '../../components/analytics/IndividualAnalytics';
import { calculateAttendanceStats } from '../../utils/analyticsUtils';
import { Plus, Users, Search, Trash2, X } from 'lucide-react';

const ManageMembers = () => {
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Member' });
  const [isAdding, setIsAdding] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const mData = await fetchMembers();
      const tData = await fetchTeams();
      const rData = await fetchAttendance();
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
      await createMember(formData);
      setFormData({ name: '', email: '', password: '', role: 'Member' });
      setIsAdding(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to create member. " + err.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await deleteMember(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete member.");
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Members" description="Manage all club members globally.">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search members..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-theme-border rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent shadow-soft"
          />
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> {isAdding ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      {isAdding && (
        <div className="card p-6 mb-6 border-theme-accent border-l-4">
          <h4 className="font-semibold text-theme-primary mb-4">Add New Member</h4>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">Full Name</label>
              <input required type="text" className="w-full border border-theme-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-theme-accent" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">Email Address</label>
              <input required type="email" className="w-full border border-theme-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-theme-accent" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">Temporary Password</label>
              <input required type="password" minLength="6" className="w-full border border-theme-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-theme-accent" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-text mb-1">Role</label>
              <select required className="w-full border border-theme-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-theme-accent" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="Member">Member</option>
                <option value="Team Leader">Team Leader</option>
              </select>
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
                      onClick={() => setSelectedMember(member)}
                      className="cursor-pointer hover:bg-theme-accent/5 transition-colors"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-theme-bg flex items-center justify-center text-theme-primary font-bold text-sm border border-theme-border-subtle">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-theme-primary">{member.name}</div>
                            <div className="text-xs text-theme-text-secondary">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                          member.role === 'Admin' ? 'bg-theme-accent/10 text-theme-accent' : 
                          member.role === 'Team Leader' ? 'bg-[#2A9D8F]/10 text-[#2A9D8F]' : 
                          'bg-theme-bg text-theme-text-secondary'
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

      {/* Member Analytics Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-theme-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-theme-bg w-full max-w-4xl rounded-2xl shadow-float overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-theme-border-subtle bg-white flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-xl font-bold text-theme-primary">{selectedMember.name}</h2>
                <p className="text-sm text-theme-text-secondary">
                  {selectedMember.role} &bull; {teams.find(t => t.id === selectedMember.teamId)?.name || 'External Member'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedMember(null)}
                className="p-2 bg-theme-bg rounded-full text-theme-text-secondary hover:text-theme-primary hover:bg-theme-border-subtle transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {(() => {
                const memberRecords = records.filter(r => r.userId === selectedMember.id);
                const stats = calculateAttendanceStats(memberRecords, [selectedMember]);
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                      <div className="card p-4 text-center">
                        <div className="text-[10px] font-bold text-theme-muted uppercase mb-1">Attendance</div>
                        <div className="text-2xl font-bold text-theme-accent">{stats.percentage}%</div>
                      </div>
                      <div className="card p-4 text-center">
                        <div className="text-[10px] font-bold text-theme-muted uppercase mb-1">Present</div>
                        <div className="text-2xl font-bold text-theme-present">{stats.present}</div>
                      </div>
                      <div className="card p-4 text-center">
                        <div className="text-[10px] font-bold text-theme-muted uppercase mb-1">Late</div>
                        <div className="text-2xl font-bold text-theme-late">{stats.late}</div>
                      </div>
                      <div className="card p-4 text-center">
                        <div className="text-[10px] font-bold text-theme-muted uppercase mb-1">Absent</div>
                        <div className="text-2xl font-bold text-theme-absent">{stats.absent}</div>
                      </div>
                    </div>
                    
                    {memberRecords.length > 0 ? (
                      <IndividualAnalytics records={memberRecords} />
                    ) : (
                      <div className="text-center py-12 text-theme-text-secondary">
                        No attendance history for this member.
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageMembers;
