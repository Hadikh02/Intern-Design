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
            const response = await fetch("https://localhost:7175/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();

            // ✅ Store tokens
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);

            // ✅ Fetch user profile after login
            try {
                const userProfileRes = await fetch("https://localhost:7175/api/Users/me", {
                    headers: {
                        Authorization: `Bearer ${data.accessToken}`,
                        "Content-Type": "application/json"
                    }
                });

                if (userProfileRes.ok) {
                    const user = await userProfileRes.json();

                    // ✅ Save user details to localStorage
                    localStorage.setItem("userId", user.id);
                    localStorage.setItem("userEmail", user.email);
                    localStorage.setItem("userFirstName", user.firstName);
                    localStorage.setItem("userLastName", user.lastName);
                    localStorage.setItem("userType", user.userType);
                } else {
                    console.warn("Failed to fetch user profile");
                }
            } catch (err) {
                console.error("Error fetching user profile:", err);
            }

            // ✅ Redirect after login
            navigate("/");

        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="login-container login-with-sidebar">
            <div className="login-card">
                <div className="left-section">
                    <div className="left-content">
                        <img src={LoginImg} alt="Login" className="login-image" />
                        <h2 className="left-title">Be verified</h2>
                        <p className="left-subtext">Secure your identity with confidence</p>
                    </div>
                </div>

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
                                <span
                                    className="forgot-password"
                                    style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
                                    onClick={() => navigate('/ForgetPassword')}
                                >
                                    Forgot Password?
                                </span>
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
