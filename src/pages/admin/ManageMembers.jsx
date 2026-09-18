import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { fetchMembers, createMember, deleteMember } from '../../services/memberService';
import { fetchTeams } from '../../services/teamService';
import { Plus, Users, Search, Trash2 } from 'lucide-react';

const ManageMembers = () => {
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Member' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const mData = await fetchMembers();
      const tData = await fetchTeams();
      setMembers(mData);
      setTeams(tData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Admins just create members. By default they get teamId = null (handled in service)
      await createMember(formData);
      setFormData({ name: '', email: '', password: '', role: 'Member' });
      setIsAdding(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to create member. " + err.message);
    }
  };

  const handleDelete = async (id) => {
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
          className="btn-primary flex items-center gap-2"
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
                <option value="Admin">Admin</option>
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
            <p className="text-sm text-theme-text-secondary">Try adjusting your search criteria or add a new member.</p>
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
                    <tr key={member.id}>
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
                          member.role === 'Team Leader' ? 'bg-theme-secondary-accent/10 text-theme-secondary-accent' : 
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
                          onClick={() => handleDelete(member.id)} 
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
    </Layout>
  );
};

export default ManageMembers;
