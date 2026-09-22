import React, { useState, useEffect } from 'react';
import { fetchTeams } from '../../services/teamService';
import { Calendar, Users, Filter, RotateCcw, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Dropdown from './Dropdown';

const FilterBar = ({ filters, setFilters, availableTeams = [] }) => {
  const { isAdmin } = useAuth();
  const [teams, setTeams] = useState(availableTeams);

  useEffect(() => {
    if (isAdmin && availableTeams.length === 0) {
      fetchTeams().then(setTeams);
    } else {
      setTeams(availableTeams);
    }
  }, [isAdmin, availableTeams]);

  const resetFilters = () => {
    setFilters({ timePeriod: 'all', teamId: 'all', status: 'all', customStart: '', customEnd: '' });
  };

  const timeOptions = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'Custom Range', value: 'custom' },
  ];

  const teamOptions = [
    { label: 'All Teams', value: 'all' },
    ...teams.map(t => ({ label: t.name, value: t.id }))
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Present', value: 'Present' },
    { label: 'Late', value: 'Late' },
    { label: 'Absent', value: 'Absent' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2 bg-theme-surface p-2 rounded-[14px] border border-theme-border shadow-soft mb-6 relative z-40">
      <div className="flex items-center gap-2 pl-3 pr-1 text-theme-muted">
        <Filter className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Filters</span>
      </div>
      
      <div className="h-6 w-px bg-theme-border hidden sm:block mx-2"></div>

      {/* Time Period Filter */}
      <div className="flex-1 min-w-[140px] max-w-[200px]">
        <Dropdown 
          options={timeOptions} 
          value={filters.timePeriod || 'all'} 
          onChange={(val) => setFilters({ ...filters, timePeriod: val })} 
          icon={Calendar} 
        />
      </div>

      {filters.timePeriod === 'custom' && (
        <>
          <div className="h-6 w-px bg-theme-border hidden sm:block mx-1"></div>
          <div className="flex items-center gap-2 text-sm text-theme-text-secondary flex-wrap">
            <input 
              type="date" 
              className="bg-theme-bg border border-theme-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-theme-text"
              value={filters.customStart || ''}
              onChange={e => setFilters({ ...filters, customStart: e.target.value })}
            />
            <span className="text-xs">to</span>
            <input 
              type="date" 
              className="bg-theme-bg border border-theme-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-theme-text"
              value={filters.customEnd || ''}
              onChange={e => setFilters({ ...filters, customEnd: e.target.value })}
            />
          </div>
        </>
      )}

      {/* Team Filter (Admin Only) */}
      {isAdmin && (
        <>
          <div className="h-6 w-px bg-theme-border hidden sm:block mx-1"></div>
          <div className="flex-1 min-w-[140px] max-w-[220px]">
            <Dropdown 
              options={teamOptions} 
              value={filters.teamId} 
              onChange={(val) => setFilters({ ...filters, teamId: val })} 
              icon={Users} 
            />
          </div>
        </>
      )}

      <div className="h-6 w-px bg-theme-border hidden sm:block mx-1"></div>

      {/* Status Filter */}
      <div className="flex-1 min-w-[140px] max-w-[180px]">
        <Dropdown 
          options={statusOptions} 
          value={filters.status} 
          onChange={(val) => setFilters({ ...filters, status: val })} 
          icon={Activity} 
        />
      </div>

      <div className="flex-1"></div>

      {/* Reset Button */}
      <button 
        onClick={resetFilters}
        className="p-2 mr-1 text-theme-muted hover:text-theme-text hover:bg-theme-surface-secondary rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-theme-border"
        title="Reset Filters"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FilterBar;
