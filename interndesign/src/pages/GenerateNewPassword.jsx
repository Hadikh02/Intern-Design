import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import LoginImg from "../assets/Login.png";
import "../styles/LoginForm.css";

const GenerateNewPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const email = localStorage.getItem('resetEmail');
    const navigate = useNavigate();

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const res = await fetch('https://localhost:7175/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to reset password.');
            }

            Swal.fire('Success', 'Password changed successfully', 'success');
            localStorage.removeItem('resetEmail');
            navigate('/login');
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    return (
        <div className="login-container login-with-sidebar">
            <div className="login-card">
                <div className="left-section">
                    <div className="left-content">
                        <img src={LoginImg} alt="Login" className="login-image" />
                        <h2 className="left-title">New Password</h2>
                        <p className="left-subtext">Secure your account with confidence</p>
                    </div>
                </div>

                <div className="right-section">
                    <div className="login-form-wrapper">
                        <h1 className="welcome-title">Reset Password</h1>
                        <p className="welcome-subtitle">Create a new secure password</p>

                        <form onSubmit={handleReset} className="login-form">
                            <div className="input-group">
                                <input
                                    type="password"
                                    placeholder="New password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <input
                                    type="password"
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>
                            {error && <p className="error-message">{error}</p>}
                            <button type="submit" className="login-button">
                                Reset Password
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GenerateNewPassword;