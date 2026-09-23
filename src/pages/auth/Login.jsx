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
      if (
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-email'
      ) {
        setError('Invalid registration number or password. Please check your credentials and try again.');
      } else {
        setError('An error occurred during login. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-theme-bg font-sans relative overflow-hidden">
      
      {/* Decorative background glow (subtle) */}
      <div className="absolute inset-0 z-0 flex justify-center items-center pointer-events-none opacity-20 dark:opacity-10">
        <div className="w-[500px] h-[500px] bg-theme-text rounded-full blur-[100px] opacity-20"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 flex flex-col items-center">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm mb-6 flex items-center justify-center">
          <img 
            src="/mitra-logo.jpg" 
            alt="MITRA Logo" 
            className="h-14 w-auto object-contain rounded-xl"
          />
        </div>
        <h2 className="text-center text-3xl font-bold leading-9 tracking-tight text-theme-primary">
          Welcome to MITRA
        </h2>
        <p className="mt-2 text-center text-[8.5px] sm:text-[10px] md:text-xs font-bold text-theme-text uppercase tracking-wider whitespace-nowrap px-4">
          Machine Intelligence Technology Research & Advancement
        </p>
        <p className="mt-4 text-center text-sm text-theme-text-secondary">
          Log in to access your MITRA workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div 
          className="bg-theme-surface backdrop-blur-md px-6 py-10 shadow-soft sm:rounded-3xl sm:px-12 border transition-all"
          style={{ borderColor: 'var(--color-border-solid)' }}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-theme-absent-bg text-theme-absent p-3 rounded-xl text-sm border border-theme-absent/20 font-medium">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-semibold leading-6 text-theme-text">
                Email / Registration Number
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="Enter your registration number"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full rounded-xl border-0 py-2.5 text-theme-text shadow-sm ring-1 ring-inset ring-theme-border-solid focus:ring-2 focus:ring-inset focus:ring-theme-text sm:text-sm sm:leading-6 px-4 transition-shadow bg-theme-bg/80 outline-none placeholder:text-theme-muted"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold leading-6 text-theme-text">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full rounded-xl border-0 py-2.5 text-theme-text shadow-sm ring-1 ring-inset ring-theme-border-solid focus:ring-2 focus:ring-inset focus:ring-theme-text sm:text-sm sm:leading-6 px-4 transition-shadow bg-theme-bg/80 outline-none placeholder:text-theme-muted"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-xl bg-theme-accent px-4 py-3 text-sm font-bold text-theme-bg shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary transition-all disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>

          {!adminExists && (
            <p className="mt-10 text-center text-sm font-medium text-theme-text-secondary">
              Need an Admin account?{' '}
              <Link to="/register" className="font-bold leading-6 text-theme-text hover:text-theme-primary transition-colors">
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
