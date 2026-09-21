import dotenv from 'dotenv';
dotenv.config();
fetch(`https://firestore.googleapis.com/v1/projects/${process.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/users`)
  .then(r => r.json())
  .then(d => {
    if (d.error) console.log(d.error.message);
    else {
      const admins = d.documents.filter(doc => doc.fields.role && doc.fields.role.stringValue === 'Admin');
      console.log(admins.map(a => a.fields.email.stringValue));
    }
  });
