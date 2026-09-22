import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { checkAdminExists, setAdminExists } from '../../services/configService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExistsState] = useState(false);
  const [initError, setInitError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const initCheck = async () => {
      try {
        const exists = await checkAdminExists();
        if (exists) {
          setAdminExistsState(true);
        }
      } catch (err) {
        if (err.code === 'permission-denied') {
          // If we get a permission denied, it usually means the database is locked down because an admin already exists.
          setAdminExistsState(true);
        } else {
          setInitError('Could not verify database status. ' + err.message);
        }
      }
      setChecking(false);
    };
    initCheck();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (adminExists) return;
    setError('');
    setLoading(true);
    try {
      const userCredential = await register(formData.email, formData.password);
      
      // Batch creation: Create user doc and set adminExists
      // Note: firestore rules enforce that this only works if club/status does not exist!
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        role: 'Admin'
      });
      await setAdminExists();
      
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Failed to register');
    }
    setLoading(false);
  };

  if (checking) {
    return <div className="flex h-screen items-center justify-center bg-theme-bg text-theme-muted font-sans">Checking system status...</div>;
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-theme-bg font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-theme-accent mx-auto mb-6 shadow-sm">
          <svg className="text-theme-bg" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 22H22L12 2Z" fill="currentColor"/>
          </svg>
        </div>
        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-theme-primary">
          Admin Registration
        </h2>
        <p className="mt-1 text-center text-sm text-theme-text-secondary">Setup your club's primary account</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-theme-surface px-6 py-10 shadow-soft sm:rounded-2xl sm:px-12 border border-theme-border-subtle">
          {initError ? (
            <div className="text-center">
              <div className="bg-theme-absent-bg text-theme-absent p-4 rounded-xl mb-6 border border-theme-absent/20 text-sm">
                <strong>Connection Error:</strong> {initError}
              </div>
              <button onClick={() => window.location.reload()} className="flex w-full justify-center rounded-lg bg-theme-accent px-3 py-2 text-sm font-semibold text-theme-bg transition-colors hover:bg-theme-accent-hover">
                Retry Connection
              </button>
            </div>
          ) : adminExists ? (
            <div className="text-center">
              <div className="bg-theme-late-bg text-theme-late p-4 rounded-xl mb-6 border border-theme-late/20 text-sm font-medium">
                Registration is currently unavailable. Please contact the club administrator.
              </div>
              <Link to="/login" className="flex w-full justify-center rounded-lg bg-theme-accent px-3 py-2 text-sm font-semibold text-theme-bg transition-colors hover:bg-theme-accent-hover">
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-theme-absent-bg text-theme-absent p-3 rounded-xl text-sm border border-theme-absent/20">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium leading-6 text-theme-text">Full Name</label>
                  <div className="mt-2">
                    <input required type="text" className="block w-full rounded-lg border-0 py-2 text-theme-text shadow-sm ring-1 ring-inset ring-theme-border-subtle focus:ring-2 focus:ring-inset focus:ring-theme-text sm:text-sm sm:leading-6 px-3" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-theme-text">Email address</label>
                  <div className="mt-2">
                    <input required type="email" className="block w-full rounded-lg border-0 py-2 text-theme-text shadow-sm ring-1 ring-inset ring-theme-border-subtle focus:ring-2 focus:ring-inset focus:ring-theme-text sm:text-sm sm:leading-6 px-3" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-theme-text">Password</label>
                  <div className="mt-2">
                    <input required type="password" minLength="6" className="block w-full rounded-lg border-0 py-2 text-theme-text shadow-sm ring-1 ring-inset ring-theme-border-subtle focus:ring-2 focus:ring-inset focus:ring-theme-text sm:text-sm sm:leading-6 px-3" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                </div>

                <div className="pt-2">
                  <button disabled={loading} type="submit" className="flex w-full justify-center rounded-lg bg-theme-accent px-3 py-2.5 text-sm font-semibold text-theme-bg shadow-sm hover:bg-theme-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary transition-colors disabled:opacity-50">
                    {loading ? 'Registering...' : 'Register as Admin'}
                  </button>
                </div>
              </form>
              
              <p className="mt-10 text-center text-sm text-theme-text-secondary">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold leading-6 text-theme-accent hover:text-theme-primary transition-colors">
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
