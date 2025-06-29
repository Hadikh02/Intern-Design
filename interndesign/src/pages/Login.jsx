import React, { useState } from 'react';
import LoginImg from "../assets/Login.png";
import "../styles/LoginForm.css";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Login attempt:', { email, password });
    };

    return (
        <div className="login-container login-with-sidebar">
            <div className="login-card">
                {/* Left Section */}
                <div className="left-section">
                    <div className="left-content">
                        <img src={LoginImg} alt="Login" className="login-image" />
                        <h2 className="left-title">Be verified</h2>
                        <p className="left-subtext">Secure your identity with confidence</p>
                    </div>
                </div>

                {/* Right Section */}
                <div className="right-section">
                    <div className="login-form-wrapper">
                        <h1 className="welcome-title">Hello, Again</h1>
                        <p className="welcome-subtitle">We are happy to have you back.</p>

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

                            <div className="input-group">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="forgot-password-wrapper">
                                <a href="#" className="forgot-password">
                                    Forgot Password?
                                </a>
                            </div>

                            <button type="submit" className="login-button">
                                Login
                            </button>
                            <div className="signup-link">
                                Don't have account?{' '}
                                <a href="#" className="signup-text">
                                    Sign Up
                                </a>
                            </div>

                        </form>

                      
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
