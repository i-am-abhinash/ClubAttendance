import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { checkAdminExists } from '../../services/configService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminExists, setAdminExists] = useState(true); // default true to avoid flicker
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const initCheck = async () => {
      try {
        const exists = await checkAdminExists();
        setAdminExists(exists);
      } catch (err) {
        if (err.code !== 'permission-denied') {
          console.error("Initialization check failed:", err);
        }
      }
    };
    initCheck();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to login');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-theme-bg font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-theme-accent mx-auto mb-6 shadow-sm">
          <svg className="text-theme-bg" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 22H22L12 2Z" fill="currentColor"/>
          </svg>
        </div>
        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-theme-primary">
          Log in to ClubAttendance
        </h2>
        <p className="mt-1 text-center text-sm text-theme-text-secondary">Welcome back! Please enter your details.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-theme-surface px-6 py-10 shadow-soft sm:rounded-2xl sm:px-12 border border-theme-border-subtle">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-theme-absent-bg text-theme-absent p-3 rounded-lg text-sm border border-theme-absent/20">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-theme-text">
                Email
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full rounded-lg border-0 py-2 text-theme-text shadow-sm ring-1 ring-inset ring-theme-border-subtle focus:ring-2 focus:ring-inset focus:ring-theme-text sm:text-sm sm:leading-6 px-3 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-theme-text">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full rounded-lg border-0 py-2 text-theme-text shadow-sm ring-1 ring-inset ring-theme-border-subtle focus:ring-2 focus:ring-inset focus:ring-theme-text sm:text-sm sm:leading-6 px-3 transition-shadow"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-theme-accent px-3 py-2.5 text-sm font-semibold text-theme-bg shadow-sm hover:bg-theme-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          {!adminExists && (
            <p className="mt-10 text-center text-sm text-theme-text-secondary">
              Need an Admin account?{' '}
              <Link to="/register" className="font-semibold leading-6 text-theme-accent hover:text-theme-primary transition-colors">
                Register here
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
