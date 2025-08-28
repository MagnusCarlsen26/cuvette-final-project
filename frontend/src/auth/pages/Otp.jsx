import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import heroOtp from '../../assets/heroes/otp.svg';
import { TextInput } from '../components/Inputs';
import styles from '../AuthPage.module.css';

export default function OtpPage() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const submit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Missing email. Start from Forgot Password.');
      return;
    }
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    navigate('/auth/reset-password', { state: { email, otp } });
  };

  return (
    <AuthLayout
      title="Enter Your OTP"
      subtitle={(
        <>
          We’ve sent a 6-digit OTP to your registered mail.<br />
          Please enter it below to sign in.
        </>
      )}
      heroSrc={heroOtp}
      footer={(
        <>
          Didn't receive it? <button type="button" className={styles.linkButton} onClick={() => alert('Resend OTP')}>Resend</button>
        </>
      )}
    >
      <form onSubmit={submit}>
        <TextInput id="otp" label="OTP" type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} autoComplete="one-time-code" />
        {error ? <div style={{ color: '#dc3545', fontSize: 12, marginTop: 6 }}>{error}</div> : null}
        <button className={styles.primaryButton} type="submit">Confirm</button>
      </form>
    </AuthLayout>
  );
}


