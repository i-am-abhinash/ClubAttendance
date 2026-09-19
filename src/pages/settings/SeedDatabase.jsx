import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';

const generateMockMembers = () => {
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Melissa', 'George', 'Deborah', 'Timothy', 'Stephanie'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
  
  const members = [];
  const timestamp = Date.now().toString().slice(-4);
  for(let i = 0; i < 50; i++) {
    const f = firstNames[i % firstNames.length];
    const l = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${f} ${l}`;
    const email = `${f.toLowerCase()}.${l.toLowerCase()}${i}_${timestamp}@example.com`;
    members.push({ name, email });
  }
  return members;
};

const SeedDatabase = () => {
  const [status, setStatus] = useState('Idle');
  const [progress, setProgress] = useState(0);

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

  const handleSeed = async () => {
    if (!window.confirm("WARNING: This will delete ALL non-admin members and ALL attendance records! Continue?")) return;
    
    try {
      setStatus('Fetching teams...');
      const teamsSnap = await getDocs(collection(db, 'teams'));
      const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (teams.length < 3) {
        setStatus('Error: Please ensure you have at least 3 teams created before seeding.');
        return;
      }
      const targetTeams = teams.slice(0, 3);
      
      try {
        setStatus('Deleting existing attendance records...');
        const attSnap = await getDocs(collection(db, 'attendance'));
        for (const d of attSnap.docs) {
          await deleteDoc(d.ref);
        }
      } catch(e) {
        console.warn("Failed to delete attendance (maybe empty or restricted)", e);
      }
      
      try {
        setStatus('Deleting existing members...');
        const usersSnap = await getDocs(collection(db, 'users'));
        for (const d of usersSnap.docs) {
          if (d.data().role !== 'Admin') {
            await deleteDoc(d.ref);
          }
        }
      } catch(e) {
        console.warn("Failed to delete some users (maybe restricted)", e);
      }
      
      setStatus('Generating 50 new members...');
      const newUsers = generateMockMembers(); // 50 users
      
      // Divide into roles
      // 3 Team Leaders (1 for each team)
      // 33 Team Members (11 for each team)
      // 14 External Members
      
      let created = 0;
      
      for (let i = 0; i < 50; i++) {
        const u = newUsers[i];
        let role = 'Member';
        let teamId = null;
        
        if (i < 3) {
          role = 'Team Leader';
          teamId = targetTeams[i].id;
        } else if (i < 36) {
          role = 'Member';
          teamId = targetTeams[(i - 3) % 3].id;
        } else {
          role = 'Member';
          teamId = null; // External
        }
        
        // Create in Firebase Auth via REST API to avoid kicking Admin out
        const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: u.email,
            password: 'password123',
            returnSecureToken: true
          })
        });
        
        const data = await res.json();
        
        if (!data.localId) {
          console.error("Failed to create auth user:", data);
          continue;
        }
        
        // Write to Firestore
        await setDoc(doc(db, 'users', data.localId), {
          name: u.name,
          email: u.email,
          role: role,
          teamId: teamId
        });
        
        created++;
        setProgress(Math.floor((created / 50) * 100));
        setStatus(`Created ${created}/50 members...`);
      }
      
      setStatus('Seeding complete! You can refresh the dashboard.');
      
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleSeedAttendance = async () => {
    try {
      setStatus('Fetching members for attendance generation...');
      const usersSnap = await getDocs(collection(db, 'users'));
      const members = usersSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.teamId && m.role !== 'Admin');
      
      if (members.length === 0) {
        setStatus('Error: No assigned members found to generate attendance for.');
        return;
      }

      setStatus('Generating 90 days of attendance data...');
      
      const statuses = ['Present', 'Present', 'Present', 'Late', 'Absent']; // Weighted random
      const today = new Date();
      let created = 0;
      const totalToCreate = members.length * 90;

      for (let i = 0; i < 90; i++) {
        // Go back up to 90 days
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - i);
        
        // Format to YYYY-MM-DD in local time
        const offset = targetDate.getTimezoneOffset();
        const localDate = new Date(targetDate.getTime() - (offset*60*1000));
        const dateStr = localDate.toISOString().split('T')[0];
        
        for (const member of members) {
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          const recordId = `${member.id}_${dateStr}`;
          
          await setDoc(doc(db, 'attendance', recordId), {
            userId: member.id,
            teamId: member.teamId,
            date: dateStr,
            status: randomStatus,
            markedBy: 'Admin_Seeder',
            markedAt: new Date()
          }, { merge: true });
          
          created++;
          if (created % 10 === 0) {
            setProgress(Math.floor((created / totalToCreate) * 100));
            setStatus(`Generated ${created}/${totalToCreate} records...`);
          }
        }
      }
      
      setProgress(100);
      setStatus('Attendance seeding complete! Check your dashboard.');
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="card p-6 mt-6 border-theme-absent/50">
      <h3 className="text-lg font-bold text-theme-absent mb-2">Danger Zone: Database Seeder</h3>
      <p className="text-sm text-theme-text-secondary mb-4">
        The User Seeder will wipe all existing members and generate 50 new members. <br/>
        The Attendance Seeder will generate 90 days (3 months) of realistic random attendance for all assigned members.
      </p>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button 
          onClick={handleSeed}
          className="bg-theme-absent text-white px-4 py-2 rounded-lg font-medium hover:bg-theme-absent/80 transition-colors"
        >
          Execute User Seed
        </button>
        <button 
          onClick={handleSeedAttendance}
          className="bg-theme-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-theme-accent/80 transition-colors"
        >
          Generate Dummy Attendance
        </button>
        <span className="text-sm font-semibold text-theme-cyan">{status} {progress > 0 && progress < 100 ? `${progress}%` : ''}</span>
      </div>
    </div>
  );
};

export default SeedDatabase;
