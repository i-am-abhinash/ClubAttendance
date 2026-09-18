import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { fetchExternalMembers, updateMember } from '../../services/memberService';
import { useAuth } from '../../context/AuthContext';
import { Users, Search, UserMinus, UserPlus } from 'lucide-react';

const ExternalMembers = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchExternalMembers();
      setMembers(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddToTeam = async (memberId) => {
    try {
      // Leader updates member teamId to their own teamId
      await updateMember(memberId, { teamId: user.teamId });
      // Remove from UI
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      console.error(err);
      alert("Failed to assign member to your team.");
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="External Members" description="Recruit members who have not yet been assigned to a team.">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search external members..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-theme-border rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent shadow-soft"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-theme-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-theme-text-secondary">Loading external members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <UserMinus className="w-10 h-10 text-theme-muted mb-4" />
            <p className="text-theme-text font-medium">No External Members</p>
            <p className="text-sm text-theme-text-secondary">All regular members are currently assigned to teams.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => (
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
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-theme-bg text-theme-text-secondary">
                        {member.role}
                      </span>
                    </td>
                    <td className="text-right">
                      <button 
                        onClick={() => handleAddToTeam(member.id)}
                        className="btn-primary py-1.5 text-xs inline-flex items-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Add to My Team
                      </button>
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

export default ExternalMembers;
