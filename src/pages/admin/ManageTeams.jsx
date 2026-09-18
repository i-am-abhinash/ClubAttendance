import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { fetchTeams, createTeam, deleteTeam } from '../../services/teamService';

const ManageTeams = () => {
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    const data = await fetchTeams();
    setTeams(data);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await createTeam({ name: newTeamName });
      setNewTeamName('');
      loadTeams();
    } catch (err) {
      console.error(err);
      alert("Failed to create team.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      await deleteTeam(id);
      loadTeams();
    } catch (err) {
      console.error(err);
      alert("Failed to delete team.");
    }
  };

  return (
    <Layout title="Manage Teams">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleCreate} className="mb-6 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">New Team Name</label>
            <input 
              type="text" 
              required
              className="w-full border border-slate-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              placeholder="e.g. Vibe Coding"
            />
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 text-sm">
            Add Team
          </button>
        </form>

        {loading ? <p>Loading...</p> : (
          <table className="min-w-full divide-y divide-slate-200 mt-4">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Team Name</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {teams.map(team => (
                <tr key={team.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">{team.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(team.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr><td colSpan="2" className="px-6 py-4 text-center text-sm text-slate-500">No teams found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default ManageTeams;
