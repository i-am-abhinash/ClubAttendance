import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminExists, setAdminExists] = useState(false);
  const [checking, setChecking] = useState(true);
  const [initError, setInitError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Add a timeout to prevent infinite hanging if Firestore is not initialized
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Database connection timed out. Did you create the Firestore Database in the Firebase Console?")), 5000)
        );
        
        const q = query(collection(db, 'users'), where('role', '==', 'Admin'), limit(1));
        const snapshot = await Promise.race([getDocs(q), timeoutPromise]);
        
        setAdminExists(!snapshot.empty);
      } catch (err) {
        console.error("Error checking for admin:", err);
        setInitError(err.message);
      } finally {
        setChecking(false);
      }
    };
    checkAdmin();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (adminExists) {
      setError('An Admin is already registered for this club.');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Create the user profile in Firestore with the Admin role
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        role: 'Admin',
        teamId: '' // Admins don't strictly belong to one team
      });

      // The auth listener in AuthContext will automatically redirect to the dashboard
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Failed to register');
    }
    setLoading(false);
  };

  if (checking) {
    return <div className="flex h-screen items-center justify-center bg-transparent text-theme-ink">Checking system status...</div>;
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-transparent">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-theme-ink">
          Mitra Attendance
        </h2>
        <p className="mt-2 text-center text-sm text-theme-ink-muted font-medium">Admin Registration</p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="glass-panel px-6 py-8 shadow-2xl sm:rounded-2xl sm:px-12">
          {initError ? (
            <div className="text-center">
              <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 border border-red-500/20 text-sm">
                <strong>Connection Error:</strong> {initError}
                <br /><br />
                Please ensure you have created the Firestore Database in your Firebase Console and updated the Security Rules.
              </div>
              <button onClick={() => window.location.reload()} className="flex w-full justify-center rounded-full plasma-bg px-3 py-2 text-sm font-semibold leading-6 text-white shadow-glow hover:opacity-90 transition-opacity">
                Retry Connection
              </button>
            </div>
          ) : adminExists ? (
            <div className="text-center">
              <div className="bg-theme-accent-a/10 text-theme-accent-a p-4 rounded-xl mb-6 border border-theme-accent-a/20 text-sm">
                An Admin account has already been registered. Only one admin is allowed per club.
              </div>
              <Link to="/login" className="flex w-full justify-center rounded-full plasma-bg px-3 py-2 text-sm font-semibold leading-6 text-white shadow-glow hover:opacity-90 transition-opacity">
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-sm border border-red-500/20">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium leading-6 text-theme-ink">Full Name</label>
                  <div className="mt-2">
                    <input required type="text" className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 px-3" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-theme-ink">Email address</label>
                  <div className="mt-2">
                    <input required type="email" className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 px-3" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-theme-ink">Password</label>
                  <div className="mt-2">
                    <input required type="password" minLength="6" className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 px-3" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                </div>

                <div>
                  <button disabled={loading} type="submit" className="flex w-full justify-center rounded-full plasma-bg px-3 py-2 text-sm font-semibold leading-6 text-white shadow-glow hover:opacity-90 transition-opacity">
                    {loading ? 'Registering...' : 'Register as Admin'}
                  </button>
                </div>
              </form>
              
              <p className="mt-10 text-center text-sm text-theme-ink-muted">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold leading-6 text-theme-accent-a hover:text-theme-accent-b transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
