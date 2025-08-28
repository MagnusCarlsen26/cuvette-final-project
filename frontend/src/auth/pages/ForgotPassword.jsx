import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import heroForgot from '../../assets/heroes/forgot.svg';
import { TextInput } from '../components/Inputs';
import styles from '../AuthPage.module.css';
import { apiForgotPassword } from '../../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await apiForgotPassword({ email });
      navigate('/auth/otp', { state: { email } });
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Company name"
      subtitle="Please enter your registered email ID to receive an OTP"
      heroSrc={heroForgot}
      footer={(
        <>
          Remembered it? <a className={styles.linkButton} href="/auth/login">Sign in</a>
        </>
      )}
    >
      <form onSubmit={submit}>
        <TextInput id="email" label="Email" type="email" placeholder="Example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        {error ? <div style={{ color: '#dc3545', fontSize: 12, marginTop: 6 }}>{error}</div> : null}
        <button className={styles.primaryButton} type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Mail'}</button>
      </form>
    </AuthLayout>
  );
}


