import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import '../styles/Rooms.css';

const Rooms = () => {
    const navigate = useNavigate(); 
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);


    const roomsData = [
        { id: 1, number: '101', location: 'Floor 1', capacity: 4, video: true, projector: true },
        { id: 2, number: '201', location: 'Floor 2', capacity: 6, video: true, projector: false },
        { id: 3, number: '102', location: 'Floor 1', capacity: 2, video: false, projector: true },
        { id: 4, number: '202', location: 'Floor 2', capacity: 8, video: true, projector: true },
        { id: 5, number: '103', location: 'Floor 1', capacity: 4, video: false, projector: false },
        { id: 6, number: '203', location: 'Floor 2', capacity: 10, video: true, projector: true },
    ];

    const [capacityFilter, setCapacityFilter] = useState('all');

    const filteredRooms = roomsData.filter(room => {
        return capacityFilter === 'all' || room.capacity >= parseInt(capacityFilter);
    });


    const handleBookNow = (roomNumber) => {

        navigate('/Calendar', { state: { roomNumber } });
    };

    return (
        <div className="rooms-container">
            <div className="rooms-header">
                <h1>Meeting Rooms</h1>
                <div className="filters">
                    <div className="filter-group">
                        <label>Capacity:</label>
                        <select
                            value={capacityFilter}
                            onChange={(e) => setCapacityFilter(e.target.value)}
                        >
                            <option value="all">All Sizes</option>
                            <option value="2">2+ people</option>
                            <option value="4">4+ people</option>
                            <option value="6">6+ people</option>
                            <option value="8">8+ people</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="rooms-grid">
                {filteredRooms.map(room => (
                    <div key={room.id} className="room-card">
                        <div className="room-header">
                            <h3>Room {room.number}</h3>
                        </div>

                        <div className="room-details">
                            <p><strong>Location:</strong> {room.location}</p>
                            <p><strong>Capacity:</strong> {room.capacity} people</p>

                            <div className="room-features">
                                <span className={room.video ? 'feature' : 'feature unavailable'}>
                                    {room.video ? 'Video Conference' : 'No Video'}
                                </span>
                                <span className={room.projector ? 'feature' : 'feature unavailable'}>
                                    {room.projector ? 'Projector' : 'No Projector'}
                                </span>
                            </div>
                        </div>

                        <button
                            className="book-btn"
                            onClick={() => handleBookNow(room.number)}
                        >
                            Book Now
                        </button>
                    </div>
                ))}
            </div>

            <footer className="modern-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <h3>Taska</h3>
                        <p>Your premium meeting room solution</p>
                    </div>
                    <div className="footer-links">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="#" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</a></li>
                            <li><a href="#services">Services</a></li>
                            <li><a href="#schedule">Schedule</a></li>
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
    );
};

export default Rooms;
