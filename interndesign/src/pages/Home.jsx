import React from 'react';
import '../styles/Home.css';
import ImgOne from '../assets/Home1.jpg';

const Home = () => {
    return (
        <div className="home-container">
            <div className="content-wrapper">
                <div className="taska-text">
                    Welcome to Taska — where productivity meets simplicity and every task finds its perfect place.
                </div>

                <div className="main-content">
                    <div className="text-content">
                        <p className="description">
                            Transform your business meetings with our state-of-the-art online meeting rooms. Experience seamless collaboration and professional virtual environments that bring your team together from anywhere in the world. Our platform provides the tools you need for productive and engaging meetings.
                        </p>

                        <a href="/services" className="services-link">
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
            </div>
        </div>

    );
};

export default Home;