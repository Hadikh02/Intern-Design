import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import LoginImg from "../assets/Login.png";
import "../styles/LoginForm.css";

const ForgetPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('https://localhost:7175/api/auth/send-reset-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                Swal.fire('Error', data.message || 'Email not found. Try another.', 'error');
                return;
            }

            Swal.fire('Success', 'A verification code has been sent to your email.', 'success');
            localStorage.setItem('resetEmail', email);
            navigate('/VerificationCode');
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Try again.');
        }
    };

    return (
        <div className="login-container login-with-sidebar">
            <div className="login-card">
                <div className="left-section">
                    <div className="left-content">
                        <img src={LoginImg} alt="Login" className="login-image" />
                        <h2 className="left-title">Reset Password</h2>
                        <p className="left-subtext">Secure your account with confidence</p>
                    </div>
                </div>

                <div className="right-section">
                    <div className="login-form-wrapper">
                        <h1 className="welcome-title">Forgot Password?</h1>
                        <p className="welcome-subtitle">Enter your email to receive a verification code</p>

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="input-group">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>
                            {error && <p className="error-message">{error}</p>}
                            <button type="submit" className="login-button">
                                Send Verification Code
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgetPassword;