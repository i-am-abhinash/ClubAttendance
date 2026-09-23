const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../mitra-attandance-firebase-adminsdk-fbsvc-8123d6dce1.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const usersRef = db.collection('users');
  const teamsRef = db.collection('teams');
  
  const usersSnap = await usersRef.get();
  const users = usersSnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  const teamsSnap = await teamsRef.get();
  const teams = teamsSnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  console.log('--- Teams ---');
  let mgmtTeam = teams.find(t => t.name.toLowerCase() === 'management');
  console.log(teams.map(t => ({id: t.id, name: t.name})));
  
  if (!mgmtTeam) {
    console.log('Management team not found. Creating...');
    const newTeamRef = await teamsRef.add({ name: 'Management', createdAt: new Date().toISOString() });
    mgmtTeam = { id: newTeamRef.id, name: 'Management' };
  }
  console.log('Management Team ID:', mgmtTeam.id);

  console.log('\n--- Possible Management Users ---');
  const targetRoles = ['president', 'vice president 1', 'vice president 2'];
  const targetsFound = [];
  
  for (const t of targetRoles) {
    const user = users.find(u => (u.name && u.name.toLowerCase() === t));
    if (user) {
      console.log('Found:', user.name, user.email, 'Current Role:', user.role);
      targetsFound.push(user);
    } else {
      console.log('NOT FOUND exact match for:', t, ', doing partial match...');
      const partialUser = users.find(u => (u.name && u.name.toLowerCase().includes(t)));
      if (partialUser) {
        console.log('Found partial:', partialUser.name, partialUser.email);
        targetsFound.push(partialUser);
      } else {
        console.log('Still NOT FOUND:', t);
      }
    }
  }

  // Update them
  for (const u of targetsFound) {
    if (u.role !== 'Admin' || u.teamId !== mgmtTeam.id) {
      console.log('Updating ' + u.name + ' to Admin and team ' + mgmtTeam.id);
      await usersRef.doc(u.id).update({
        role: 'Admin',
        teamId: mgmtTeam.id
      });
    } else {
      console.log(u.name + ' already correctly configured.');
    }
  }
}

run().then(() => process.exit(0)).catch(console.error);

