import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { fetchTeams, createTeam, deleteTeam } from '../../services/teamService';
import { fetchMembers, updateMember } from '../../services/memberService';
import { Plus, Trash2, Users } from 'lucide-react';

const ManageTeams = () => {
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [teamStats, setTeamStats] = useState({});
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const tData = await fetchTeams();
      const mData = await fetchMembers();
      
      const stats = {};
      tData.forEach(t => {
        const teamMembers = mData.filter(m => m.teamId === t.id);
        const leaders = teamMembers.filter(m => m.role === 'Team Leader');
        stats[t.id] = {
          memberCount: teamMembers.length,
          leaders: leaders.map(l => l.name).join(', ') || 'None',
          leaderId: leaders.length > 0 ? leaders[0].id : ''
        };
      });
      
      setTeams(tData);
      setMembers(mData);
      setTeamStats(stats);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await createTeam({ name: newTeamName });
      setNewTeamName('');
      setIsAdding(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to create team.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
    try {
      await deleteTeam(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete team.");
    }
  };

  const handleAssignLeader = async (teamId, leaderId) => {
    try {
      // Find the old leader and remove them from the team
      const oldLeader = members.find(m => m.teamId === teamId && m.role === 'Team Leader');
      if (oldLeader && oldLeader.id !== leaderId) {
        await updateMember(oldLeader.id, { teamId: null });
      }

      // Assign the new leader
      if (leaderId) {
        await updateMember(leaderId, { teamId: teamId });
      }

      loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to assign team leader.");
    }
  };

  const availableLeaders = members.filter(m => m.role === 'Team Leader');

  return (
    <Layout title="Teams" description="Organize members and monitor team structure.">
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-theme-primary">All Teams</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> {isAdding ? 'Cancel' : 'Create Team'}
        </button>
      </div>

      {isAdding && (
        <div className="card p-6 mb-8 border-theme-accent border-l-4">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-theme-text mb-1">New Team Name</label>
              <input 
                type="text" 
                required
                className="w-full border border-theme-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-theme-accent"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="e.g. AI Research Group"
              />
            </div>
            <button type="submit" className="btn-primary w-full sm:w-auto">
              Save Team
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-6 h-6 border-2 border-theme-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-theme-text-secondary">Loading teams...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <Users className="w-10 h-10 text-theme-muted mb-4" />
          <p className="text-theme-text font-medium">No teams found</p>
          <p className="text-sm text-theme-text-secondary">Get started by creating your first team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <div key={team.id} className="card p-6 flex flex-col hover:border-theme-border transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-theme-bg flex items-center justify-center text-theme-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-theme-primary">{team.name}</h4>
                    <span className="text-xs text-theme-text-secondary font-medium">
                      {teamStats[team.id]?.memberCount || 0} Members
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(team.id)} 
                  className="text-theme-muted hover:text-theme-absent p-1.5 rounded-lg hover:bg-theme-absent-bg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mt-auto pt-4 border-t border-theme-border-subtle">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-theme-muted uppercase">Team Leader</label>
                  <select
                    className="w-full text-sm border border-theme-border rounded py-1 px-2 focus:outline-none focus:border-theme-accent"
                    value={teamStats[team.id]?.leaderId || ''}
                    onChange={(e) => handleAssignLeader(team.id, e.target.value)}
                  >
                    <option value="">[ Select Team Leader ]</option>
                    {availableLeaders.map(leader => (
                      <option key={leader.id} value={leader.id}>
                        {leader.name} {leader.teamId && leader.teamId !== team.id ? '(Reassign)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default ManageTeams;
