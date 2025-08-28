import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import heroReset from '../../assets/heroes/reset.svg';
import { PasswordInput } from '../components/Inputs';
import styles from '../AuthPage.module.css';
import { apiResetPassword } from '../../api/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const otp = location.state?.otp || '';

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!email || !otp) {
      setError('Missing email/OTP. Start from Forgot Password.');
      return;
    }
    if (!password || password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await apiResetPassword({ email, otp, newPassword: password });
      navigate('/auth/login');
    } catch (err) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle={(
        <>
          Today is a new day. It's your day. You shape it.<br />
          Sign in to start managing your projects.
        </>
      )}
      heroSrc={heroReset}
      footer={(
        <>
          Back to <a className={styles.linkButton} href="/auth/login">Sign in</a>
        </>
      )}
    >
      <form onSubmit={submit}>
        <PasswordInput id="password" label="New Password" placeholder="at least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <PasswordInput id="confirmPassword" label="Confirm Password" placeholder="at least 8 characters" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
        {error ? <div style={{ color: '#dc3545', fontSize: 12, marginTop: 6 }}>{error}</div> : null}
        <button className={styles.primaryButton} type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
      </form>
    </AuthLayout>
  );
}


