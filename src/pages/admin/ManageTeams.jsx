import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { fetchTeams, createTeam, deleteTeam } from '../../services/teamService';
import { fetchMembers } from '../../services/memberService';
import { Plus, Trash2, Users, ArrowRight } from 'lucide-react';

const ManageTeams = () => {
  const [teams, setTeams] = useState([]);
  const [teamStats, setTeamStats] = useState({});
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const navigate = useNavigate();

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
          leaderName: leaders.length > 0 ? leaders[0].name : 'Unassigned'
        };
      });
      
      setTeams(tData);
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

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Prevent opening team details
    if (!window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
    try {
      await deleteTeam(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete team.");
    }
  };

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
        <div className="card p-6 mb-8 border-theme-accent border-l-4 bg-theme-surface-elevated">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-theme-text mb-1">New Team Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-theme-surface border border-theme-border rounded-lg py-2 px-3 text-sm text-theme-text focus:outline-none focus:border-theme-accent placeholder-theme-muted"
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
            <div 
              key={team.id} 
              onClick={() => navigate(`/admin/teams/${team.id}`)}
              className="card p-6 flex flex-col hover:border-theme-accent/30 hover:shadow-[0_8px_30px_rgba(109,124,255,0.1)] transition-all cursor-pointer group relative bg-gradient-to-br from-theme-surface to-[#0B111D]"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-theme-surface-elevated border border-theme-border flex items-center justify-center text-theme-accent group-hover:bg-theme-accent-light transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-theme-primary text-lg">{team.name}</h4>
                    <span className="text-xs text-theme-text-secondary font-medium">
                      {teamStats[team.id]?.memberCount || 0} Members
                    </span>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDelete(team.id, e)} 
                  className="text-theme-muted hover:text-theme-absent p-1.5 rounded-lg hover:bg-theme-absent-bg transition-colors"
                  title="Delete Team"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mt-auto pt-4 border-t border-theme-border flex items-end justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Team Leader</span>
                  <span className="text-sm font-medium text-theme-primary">{teamStats[team.id]?.leaderName}</span>
                </div>
                
                <div className="flex items-center text-xs font-semibold text-theme-accent opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">
                  View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
