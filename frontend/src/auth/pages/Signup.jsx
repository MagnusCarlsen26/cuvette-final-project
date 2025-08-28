import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import heroSignup from '../../assets/heroes/signup.svg';
import { TextInput, PasswordInput } from '../components/Inputs';
import styles from '../AuthPage.module.css';
import { apiSignup, setToken } from '../../api/client';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await apiSignup({ name, email, password });
      if (res && res.token) setToken(res.token);
      navigate('/dashboard/home');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Start inventory management."
      heroSrc={heroSignup}
      footer={(
        <>
          Do you have an account? <a className={styles.linkButton} href="/auth/login">Sign in</a>
        </>
      )}
    >
      <form onSubmit={submit}>
        <TextInput id="name" label="Name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <TextInput id="email" label="Email" type="email" placeholder="Example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <PasswordInput id="password" label="Create Password" placeholder="at least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <PasswordInput id="confirmPassword" label="Confirm Password" placeholder="at least 8 characters" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
        {error ? <div style={{ color: '#dc3545', fontSize: 12, marginTop: 6 }}>{error}</div> : null}
        <button className={styles.primaryButton} type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign up'}</button>
      </form>
    </AuthLayout>
  );
}


