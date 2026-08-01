'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('A connection error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div className="search-card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', background: 'rgba(5, 12, 6, 0.75)', border: '1px solid var(--border-light)' }}>
        <header style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem', textAlign: 'center' }}>
          <div className="logo-container" style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
            <div className="logo-circle" style={{ borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>🛡️</div>
          </div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--accent-gold)' }}>Admin Secure Access</h1>
          <p className="subtitle" style={{ fontSize: '0.85rem' }}>Internal seat plan & selection portal manager</p>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="input-group">
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Admin Email
            </label>
            <div style={{ position: 'relative' }}>
              <span className="material-icons" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                email
              </span>
              <input
                type="email"
                className="search-input"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                style={{ width: '100%', paddingLeft: '2.75rem', height: '3rem' }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Secret Password
            </label>
            <div style={{ position: 'relative' }}>
              <span className="material-icons" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                lock
              </span>
              <input
                type="password"
                className="search-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ width: '100%', paddingLeft: '2.75rem', height: '3rem' }}
                required
              />
            </div>
          </div>

          {error && (
            <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.75rem' }}>
              <span className="material-icons" style={{ fontSize: '1.2rem' }}>error_outline</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="search-button"
            disabled={loading}
            style={{ width: '100%', height: '3rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Secure Sign In</span>
                <span className="material-icons">vpn_key</span>
              </>
            )}
          </button>
        </form>
      </div>

      <footer style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p className="footer-credits" style={{ fontSize: '0.75rem' }}>
          Confidential System | Authorized Access Only | DUET Admissions 2026
        </p>
      </footer>
    </div>
  );
}
