import React, { useState } from 'react';
import LoginImg from "../assets/Login.png";
import "../styles/LoginForm.css";
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            console.log('Sending login request...');
            const response = await fetch("https://localhost:7175/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            console.log('Received response:', response);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();
            console.log('Login successful:', data);

            // Store tokens
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);

            // Store userId from response (adjust property name accordingly)
            // Example: if backend returns user info like { userId: 123, ... }
            if (data.userId) {
                localStorage.setItem("userId", data.userId);
            } else if (data.user && data.user.id) {
                // If user object inside data
                localStorage.setItem("userId", data.user.id);
            } else {
                console.warn("User ID not found in login response");
            }

            // Redirect after login
            navigate("/");

        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please try again.');
        }
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

                            {error && <p className="error-message">{error}</p>}

                            <button type="submit" className="login-button">
                                Login
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
