import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import FilterBar from '../../components/common/FilterBar';
import { ClubAnalytics } from '../../components/analytics/ClubAnalytics';
import { fetchMembers } from '../../services/memberService';
import { fetchTeams } from '../../services/teamService';
import { fetchAttendance } from '../../services/attendanceService';
import { applyFilters } from '../../utils/analyticsUtils';

const ClubAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ timePeriod: 'all', teamId: 'all', status: 'all' });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const m = await fetchMembers();
        const t = await fetchTeams();
        const r = await fetchAttendance();
        setMembers(m);
        setTeams(t);
        setRecords(r);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <Layout title="Analytics" description="Deep dive into club attendance patterns.">
        <div className="card h-64 animate-pulse bg-theme-bg/50"></div>
      </Layout>
    );
  }

  const filteredRecords = applyFilters(records, filters);

  return (
    <Layout title="Analytics" description="Deep dive into club attendance patterns.">
      <FilterBar filters={filters} setFilters={setFilters} availableTeams={teams} />
      
      {filteredRecords.length > 0 ? (
        <ClubAnalytics records={filteredRecords} teams={teams} />
      ) : (
        <div className="card p-12 text-center text-theme-text-secondary">
          No attendance data matches your filters.
        </div>
      )}
    </Layout>
  );
};

export default ClubAnalysis;
