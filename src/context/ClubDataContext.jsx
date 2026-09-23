/**
 * ClubDataContext
 * ──────────────────────────────────────────────────────────────────────────
 * Single cache for club-wide reference data (members, teams).
 *
 * WHY THIS EXISTS:
 *   Previously, every page component (AdminDashboard, ManageMembers,
 *   ManageTeams, FilterBar, Layout) independently called fetchMembers()
 *   and fetchTeams() on mount. Because Layout wraps every page and
 *   remounts on navigation, this caused the same data to be downloaded
 *   from Firestore 3-5 times per page transition.
 *
 * WHAT IT DOES:
 *   - Fetches all users and all teams exactly once per login session.
 *   - Re-fetches only when the logged-in user changes (login/logout).
 *   - Exposes a `refreshClubData()` function for pages that mutate
 *     members or teams (e.g., after creating/deleting a member).
 *   - Only activates for Admin users; other roles get empty arrays.
 *
 * WHAT IT DOES NOT DO:
 *   - It does NOT cache attendance records (those are page-specific and
 *     filtered differently on each page, so each page fetches its own).
 *   - It does NOT restrict Admin access to any data.
 *   - It does NOT change Firestore security rules.
 *   - It does NOT change the permission model.
 *
 * ADMIN PERMISSIONS ARE FULLY PRESERVED.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchMembers } from '../services/memberService';
import { fetchTeams } from '../services/teamService';

const ClubDataContext = createContext({
  members: [],
  teams: [],
  loading: false,
  refreshClubData: () => {}
});

export const useClubData = () => useContext(ClubDataContext);

export const ClubDataProvider = ({ children }) => {
  const { user } = useAuth();

  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadClubData = useCallback(async () => {
    // Only Admin needs club-wide user/team data pre-loaded.
    // Team Leaders and Members fetch their scoped data directly.
    if (user?.role !== 'Admin') {
      setMembers([]);
      setTeams([]);
      return;
    }

    setLoading(true);
    try {
      const [m, t] = await Promise.all([fetchMembers(), fetchTeams()]);
      setMembers(m);
      setTeams(t);
    } catch (err) {
      console.error('[ClubDataContext] Failed to load club data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, user?.role]); // Re-run only if UID or role changes (i.e. login/logout)

  useEffect(() => {
    loadClubData();
  }, [loadClubData]);

  /**
   * Call this after any operation that mutates members or teams
   * (create member, delete member, assign team, etc.) to keep the
   * context cache fresh without a full page reload.
   */
  const refreshClubData = useCallback(() => {
    loadClubData();
  }, [loadClubData]);

  return (
    <ClubDataContext.Provider value={{ members, teams, loading, refreshClubData }}>
      {children}
    </ClubDataContext.Provider>
  );
};
