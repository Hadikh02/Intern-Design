import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import ImgOne from '../assets/Home1.jpg';
import ImgTwo from '../assets/Home2.jpg';

const Home = () => {
    const navigate = useNavigate();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);


    return (
        <div className="home-container" id="home">
            <div className="content-wrapper">
                <div className="taska-text">
                    Welcome to Taska — where productivity meets simplicity and every task finds its perfect place.
                </div>
                <div className="main-content">
                    <div className="text-content">
                        <p className="description">
                            Transform your business meetings with our state-of-the-art online meeting rooms. Experience seamless collaboration and professional virtual environments that bring your team together from anywhere in the world. Our platform provides the tools you need for productive and engaging meetings.
                        </p>
                        <a
                            className="services-link"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('services').scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start'
                                });
                            }}
                        >
                            View Our Services →
                        </a>
                    </div>
                    <div className="image-container">
                        <img
                            src={ImgOne}
                            alt="Modern meeting room"
                            className="meeting-image"
                        />
                    </div>
                </div>

                {/* Services Section */}
                <div className="services-section" id="services">
                    <h2 className="services-title">Our Services</h2>
                    <div className="services-cards">
                        <div className="service-card">
                            <div className="card-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="card-title">Virtual Meetings</h3>
                            <p className="card-description">
                                High-quality video conferencing with advanced collaboration tools for seamless remote meetings.
                            </p>
                        </div>

                        <div className="service-card">
                            <div className="card-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </div>
                            <h3 className="card-title">Team Collaboration</h3>
                            <p className="card-description">
                                Real-time collaboration tools including screen sharing, whiteboard, and file sharing capabilities.
                            </p>
                        </div>

                        <div className="service-card">
                            <div className="card-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                                    <path d="M2 12H22" stroke="currentColor" strokeWidth="2" />
                                    <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2V2Z" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </div>
                            <h3 className="card-title">Global Access</h3>
                            <p className="card-description">
                                24/7 availability with secure cloud infrastructure ensuring reliable access from anywhere worldwide.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Rooms Section */}
                <div className="rooms-section" id="rooms">
                    <h2 className="rooms-title">Our Meeting Rooms</h2>
                    <div className="rooms-content">
                        <div className="rooms-image-container">
                            <img
                                src={ImgTwo}
                                alt="Professional meeting rooms"
                                className="rooms-image"
                            />
                        </div>
                        <div className="rooms-text-content">
                            <p className="rooms-description">
                                Premium virtual meeting rooms with cutting-edge tech and professional setups.
                                Enjoy 4K video, studio-grade audio, and customizable layouts.
                                Includes real-time collaboration tools, secure encryption, and 24/7 support.
                            </p>
                            <button
                                className="rooms-button"
                                onClick={() => {
                                    navigate('/Rooms');
                                }}
                            >
                                View Our Rooms →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <footer className="modern-footer">
                    <div className="footer-content">
                        <div className="footer-logo">
                            <h3>Taska</h3>
                            <p>Where productivity meets simplicity</p>
                        </div>
                        <div className="footer-links">
                            <h4>Quick Links</h4>
                            <ul>
                                <li><a href="#" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</a></li>
                                <li><a href="#services">Services</a></li>
                                <li><a href="#rooms">Rooms</a></li>
                                <li><a href="/login">Login</a></li>
                            </ul>
                        </div>
                        <div className="footer-contact">
                            <h4>Contact Us</h4>
                            <p>
                                <svg
                                    className="icon"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    style={{ marginRight: '8px' }}
                                >
                                    <path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                </svg>
                                info@taska.com
                            </p>
                            <p>
                                <svg
                                    className="icon"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    style={{ marginRight: '8px' }}
                                >
                                    <path fill="currentColor" d="M20 15.5c-1.2 0-2.5-.2-3.6-.6h-.3c-.3 0-.5.1-.7.3l-2.2 2.2c-2.8-1.5-5.2-3.8-6.6-6.6l2.2-2.2c.4-.4.6-1 .3-1.5-.4-1.1-.6-2.4-.6-3.6 0-.5-.5-1-1-1H4c-.5 0-1 .5-1 1 0 9.4 7.6 17 17 17 .5 0 1-.5 1-1v-3.5c0-.5-.5-1-1-1z" />
                                </svg>
                                +961 12-345-678
                            </p>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} Taska. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Home;