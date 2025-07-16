import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import LoginImg from "../assets/Login.png";
import "../styles/LoginForm.css";

const VerificationCode = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const email = localStorage.getItem('resetEmail');

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('https://localhost:7175/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Invalid code.');
            }

            Swal.fire('Verified', 'Code matched. Proceed to reset password.', 'success');
            navigate('/GenerateNewPassword');
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
                        <h2 className="left-title">Verify Identity</h2>
                        <p className="left-subtext">Secure your account with confidence</p>
                    </div>
                </div>

                <div className="right-section">
                    <div className="login-form-wrapper">
                        <h1 className="welcome-title">Verification Code</h1>
                        <p className="welcome-subtitle">Enter the 6-digit code sent to your email</p>

                        <form onSubmit={handleVerify} className="login-form">
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="6-digit code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>
                            {error && <p className="error-message">{error}</p>}
                            <button type="submit" className="login-button">
                                Verify Code
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationCode;