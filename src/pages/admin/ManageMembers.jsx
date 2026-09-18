import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { fetchMembers, createMember, deleteMember } from '../../services/memberService';
import { fetchTeams } from '../../services/teamService';

const ManageMembers = () => {
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Member', teamId: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const mData = await fetchMembers();
    const tData = await fetchTeams();
    setMembers(mData);
    setTeams(tData);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createMember(formData);
      setFormData({ name: '', email: '', password: '', role: 'Member', teamId: '' });
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to create member. " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteMember(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete member.");
    }
  };

  return (
    <Layout title="Manage Members">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
        <h4 className="font-medium text-slate-900 mb-4">Add New Member</h4>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input required type="text" className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input required type="email" className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input required type="password" minLength="6" className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select required className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="Member">Member</option>
              <option value="Team Leader">Team Leader</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          {formData.role !== 'Admin' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Team</label>
              <select required className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm" value={formData.teamId} onChange={e => setFormData({...formData, teamId: e.target.value})}>
                <option value="">Select Team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          <div className="md:col-span-2 mt-2">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 text-sm w-full md:w-auto">
              Create Member
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h4 className="font-medium text-slate-900 mb-4">Member Directory</h4>
        {loading ? <p>Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Team</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {members.map(member => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">{member.name} <br/><span className="text-slate-500 font-normal text-xs">{member.email}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{member.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{teams.find(t => t.id === member.teamId)?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDelete(member.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManageMembers;
