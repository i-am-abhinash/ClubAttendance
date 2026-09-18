import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import FilterBar from '../../components/common/FilterBar';
import { TeamAnalytics } from '../../components/analytics/TeamAnalytics';
import { useAuth } from '../../context/AuthContext';
import { fetchMembers } from '../../services/memberService';
import { fetchAttendance } from '../../services/attendanceService';
import { applyFilters } from '../../utils/analyticsUtils';

const TeamAnalysisPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setTeamMembers] = useState([]);
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ timePeriod: 'all', teamId: user?.teamId, status: 'all' });

  useEffect(() => {
    const loadTeamData = async () => {
      if (!user?.teamId) return;
      setLoading(true);
      try {
        const m = await fetchMembers(user.teamId);
        setTeamMembers(m);
        const r = await fetchAttendance(user.teamId);
        setRecords(r);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadTeamData();
  }, [user]);

  if (loading) {
    return (
      <Layout title="Team Analytics" description="Analyze your team's attendance performance.">
        <div className="card h-64 animate-pulse bg-theme-bg/50"></div>
      </Layout>
    );
  }

  const effectiveFilters = { ...filters, teamId: user.teamId };
  const filteredRecords = applyFilters(records, effectiveFilters);

  return (
    <Layout title="Team Analytics" description="Analyze your team's attendance performance.">
      <FilterBar filters={filters} setFilters={setFilters} />
      
      {filteredRecords.length > 0 ? (
        <TeamAnalytics records={filteredRecords} members={members} />
      ) : (
        <div className="card p-12 text-center text-theme-text-secondary">
          No attendance data matches your filters.
        </div>
      )}
    </Layout>
  );
};

export default TeamAnalysisPage;
