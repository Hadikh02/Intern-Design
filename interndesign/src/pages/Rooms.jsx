import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Rooms.css';

const Rooms = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [capacityFilter, setCapacityFilter] = useState('all');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('No access token found. Please log in.');
            setLoading(false);
            navigate("/Login");
            return; 
        }

        const fetchRooms = async () => {
            try {
                const response = await fetch("https://localhost:7175/api/Room", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Unauthorized. Please log in again.');
                    }
                    throw new Error(`Error: ${response.statusText}`);
                }

                const data = await response.json();
                setRooms(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, []);

    const filteredRooms = rooms.filter(room => {
        return capacityFilter === 'all' || room.capacity >= parseInt(capacityFilter);
    });

    const handleBookNow = (roomId) => {
        navigate('/Calendar', { state: { roomId } });
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

            {loading && <p>Loading rooms...</p>}
            {error && <p className="error">{error}</p>}

            <div className="rooms-grid">
                {!loading && !error && filteredRooms.map(room => (
                    <div key={room.id} className="room-card">
                        <div className="room-header">
                            <h3>Room {room.roomNumber}</h3>
                        </div>
                        <div className="room-details">
                            <p><strong>Location:</strong> {room.location}</p>
                            <p><strong>Capacity:</strong> {room.capacity} people</p>
                            <div className="room-features">
                                <span className={room.hasVideo ? 'feature' : 'feature unavailable'}>
                                    {room.hasVideo ? 'Video Conference' : 'No Video'}
                                </span>
                                <span className={room.hasProjector ? 'feature' : 'feature unavailable'}>
                                    {room.hasProjector ? 'Projector' : 'No Projector'}
                                </span>
                            </div>
                        </div>
                        <button
                            className="book-btn"
                            onClick={() => handleBookNow(room.id)}
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
                            <li><a href="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</a></li>
                            <li><a href="/#services">Services</a></li>
                            <li><a href="/#schedule">Schedule</a></li>
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
