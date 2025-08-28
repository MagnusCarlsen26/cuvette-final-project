import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import heroLogin from '../../assets/heroes/login.svg';
import { TextInput, PasswordInput } from '../components/Inputs';
import styles from '../AuthPage.module.css';
import { apiLogin, setToken } from '../../api/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await apiLogin({ email, password });
      if (res && res.token) setToken(res.token);
      navigate('/dashboard/home');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Log in to your account"
      subtitle="Welcome back! Please enter your details."
      heroSrc={heroLogin}
      footer={(
        <>
          Don't you have an account? <a className={styles.linkButton} href="/auth/signup">Sign up</a>
        </>
      )}
    >
      <form onSubmit={submit}>
        <TextInput id="email" label="Email" type="email" placeholder="Example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <PasswordInput id="password" label="Password" placeholder="at least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        {error ? <div style={{ color: '#dc3545', fontSize: 12, marginTop: 6 }}>{error}</div> : null}
        <div style={{ textAlign: 'right', marginTop: 4 }}>
          <a className={styles.linkButton} href="/auth/forgot-password">Forgot Password?</a>
        </div>
        <button className={styles.primaryButton} type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </AuthLayout>
  );
}


