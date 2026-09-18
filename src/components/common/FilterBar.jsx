import React, { useState, useEffect } from 'react';
import { fetchTeams } from '../../services/teamService';
import { Calendar, Users, Filter, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
    setFilters({ timePeriod: 'all', teamId: 'all', status: 'all' });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-[14px] border border-theme-border shadow-sm mb-6">
      <div className="flex items-center gap-2 pl-2 text-theme-muted">
        <Filter className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">Filters</span>
      </div>
      
      <div className="h-6 w-px bg-theme-border hidden sm:block mx-1"></div>

      {/* Time Period Filter */}
      <div className="relative flex-1 min-w-[140px] max-w-[200px]">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Calendar className="w-4 h-4 text-theme-muted" />
        </div>
        <select 
          className="w-full appearance-none bg-transparent py-2 pl-9 pr-8 text-sm font-medium text-theme-primary focus:outline-none cursor-pointer"
          value={filters.timePeriod}
          onChange={e => setFilters({ ...filters, timePeriod: e.target.value })}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {/* Team Filter (Admin Only) */}
      {isAdmin && (
        <>
          <div className="h-6 w-px bg-theme-border hidden sm:block mx-1"></div>
          <div className="relative flex-1 min-w-[140px] max-w-[200px]">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Users className="w-4 h-4 text-theme-muted" />
            </div>
            <select 
              className="w-full appearance-none bg-transparent py-2 pl-9 pr-8 text-sm font-medium text-theme-primary focus:outline-none cursor-pointer"
              value={filters.teamId}
              onChange={e => setFilters({ ...filters, teamId: e.target.value })}
            >
              <option value="all">All Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </>
      )}

      <div className="h-6 w-px bg-theme-border hidden sm:block mx-1"></div>

      {/* Status Filter */}
      <div className="relative flex-1 min-w-[130px] max-w-[160px]">
        <select 
          className="w-full appearance-none bg-transparent py-2 pl-4 pr-8 text-sm font-medium text-theme-primary focus:outline-none cursor-pointer"
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="all">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Late">Late</option>
          <option value="Absent">Absent</option>
        </select>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      <div className="flex-1"></div>

      {/* Reset Button */}
      <button 
        onClick={resetFilters}
        className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-bg rounded-lg transition-colors flex items-center justify-center mr-1"
        title="Reset Filters"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FilterBar;
