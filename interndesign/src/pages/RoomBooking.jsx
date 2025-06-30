import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, Users, Video, Repeat, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/RoomBooking.css';// Import the CSS file



const RoomBooking = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        duration: '1',
        attendees: [],
        room: '',
        recurring: false,
        videoConferencing: false
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [showAttendeeSearch, setShowAttendeeSearch] = useState(false);

    // Sample data - removed maintenance rooms
    const availableRooms = [
        { id: 1, name: 'Conference Room A', capacity: 10, status: 'available' },
        { id: 2, name: 'Meeting Room B', capacity: 6, status: 'occupied' },
        { id: 3, name: 'Boardroom C', capacity: 12, status: 'available' },
        { id: 5, name: 'Executive Suite', capacity: 8, status: 'available' }
    ];

    const suggestedAttendees = [
        { id: 1, name: 'John Smith', email: 'john.smith@company.com' },
        { id: 2, name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
        { id: 3, name: 'Mike Wilson', email: 'mike.wilson@company.com' },
        { id: 4, name: 'Emily Davis', email: 'emily.davis@company.com' }
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addAttendee = (attendee) => {
        if (!formData.attendees.find(a => a.id === attendee.id)) {
            setFormData(prev => ({
                ...prev,
                attendees: [...prev.attendees, attendee]
            }));
        }
        setSearchTerm('');
        setShowAttendeeSearch(false);
    };

    const removeAttendee = (attendeeId) => {
        setFormData(prev => ({
            ...prev,
            attendees: prev.attendees.filter(a => a.id !== attendeeId)
        }));
    };

    const filteredAttendees = suggestedAttendees.filter(attendee =>
        attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendee.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Booking submitted:', formData);
        alert('Room booked successfully!');
    };

    const handleCancel = () => {
        setFormData({
            title: '',
            date: '',
            time: '',
            duration: '1',
            attendees: [],
            room: '',
            recurring: false,
            videoConferencing: false
        });
        setSearchTerm('');
        navigate('/'); // Redirect to Home
    };


    return (
        <div className="room-booking-container">
            {/* Header */}
            <div className="room-booking-header">
                <h1 className="room-booking-title">Book a Room</h1>
                <p className="room-booking-subtitle">Schedule your meeting and reserve the perfect space</p>
            </div>

            <div className="room-booking-grid">
                {/* Booking Form */}
                <div className="booking-form">
                    <form onSubmit={handleSubmit}>
                        {/* Title */}
                        <div className="form-group">
                            <label className="form-label">Meeting Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="Enter meeting title"
                                className="form-input"
                                required
                            />
                        </div>

                        {/* Date and Time */}
                        <div className="form-group-inline">
                            <div>
                                <label className="form-label-icon">
                                    <Calendar size={16} />
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => handleInputChange('date', e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label-icon">
                                    <Clock size={16} />
                                    Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => handleInputChange('time', e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="form-group">
                            <label className="form-label">Duration</label>
                            <select
                                value={formData.duration}
                                onChange={(e) => handleInputChange('duration', e.target.value)}
                                className="form-select"
                            >
                                <option value="0.5">30 minutes</option>
                                <option value="1">1 hour</option>
                                <option value="1.5">1.5 hours</option>
                                <option value="2">2 hours</option>
                                <option value="3">3 hours</option>
                                <option value="4">4 hours</option>
                            </select>
                        </div>

                        {/* Attendees */}
                        <div className="form-group">
                            <label className="form-label-icon">
                                <Users size={16} />
                                Attendees
                            </label>
                            <div className="search-container">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowAttendeeSearch(true);
                                    }}
                                    placeholder="Search and add attendees"
                                    onFocus={() => setShowAttendeeSearch(true)}
                                    onBlur={() => setTimeout(() => setShowAttendeeSearch(false), 200)}
                                    className="form-input-search"
                                />
                                <Search size={16} className="search-icon" />

                                {showAttendeeSearch && searchTerm && (
                                    <div className="attendee-dropdown">
                                        {filteredAttendees.map(attendee => (
                                            <div
                                                key={attendee.id}
                                                onClick={() => addAttendee(attendee)}
                                                className="attendee-option"
                                            >
                                                <div className="attendee-name">{attendee.name}</div>
                                                <div className="attendee-email">{attendee.email}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {formData.attendees.length > 0 && (
                                    <div className="attendees-list">
                                        {formData.attendees.map(attendee => (
                                            <div key={attendee.id} className="attendee-tag">
                                                <span>{attendee.name}</span>
                                                <X
                                                    size={14}
                                                    onClick={() => removeAttendee(attendee.id)}
                                                    className="attendee-remove"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Room Selection */}
                        <div className="form-group">
                            <label className="form-label">Select Room</label>
                            <select
                                value={formData.room}
                                onChange={(e) => handleInputChange('room', e.target.value)}
                                className="form-select"
                                required
                            >
                                <option value="">Choose a room</option>
                                {availableRooms
                                    .filter(room => room.status === 'available')
                                    .map(room => (
                                        <option key={room.id} value={room.id}>
                                            {room.name} (Capacity: {room.capacity})
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Options */}
                        <div className="form-group">
                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    checked={formData.recurring}
                                    onChange={(e) => handleInputChange('recurring', e.target.checked)}
                                    className="checkbox"
                                />
                                <Repeat size={16} />
                                <label htmlFor="recurring" className="checkbox-label">Recurring meeting</label>
                            </div>
                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="video"
                                    checked={formData.videoConferencing}
                                    onChange={(e) => handleInputChange('videoConferencing', e.target.checked)}
                                    className="checkbox"
                                />
                                <Video size={16} />
                                <label htmlFor="video" className="checkbox-label">Video Conferencing</label>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="button-group">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                            >
                                Book Now
                            </button>
                        </div>
                    </form>
                </div>

                {/* Room Availability Preview */}
                <div className="availability-panel">
                    <h3 className="panel-title">Room Availability</h3>

                    <div className="rooms-list">
                        {availableRooms.map(room => (
                            <div key={room.id} className="room-card">
                                <div className="room-header">
                                    <h4 className="room-name">{room.name}</h4>
                                    <div className={`status-indicator status-${room.status}`}></div>
                                </div>
                                <p className="room-capacity">Capacity: {room.capacity} people</p>
                                <span className={`status-badge status-badge-${room.status}`}>
                                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Booking Summary */}
                    <div>
                        <h3 className="panel-title">Booking Summary</h3>

                        {formData.title || formData.date || formData.time || formData.attendees.length > 0 ? (
                            <div className="summary-section">
                                {formData.title && (
                                    <div>
                                        <p className="summary-item-label">Meeting Title</p>
                                        <p className="summary-item-value">{formData.title}</p>
                                    </div>
                                )}

                                {(formData.date || formData.time) && (
                                    <div>
                                        <p className="summary-item-label">Date & Time</p>
                                        <p className="summary-item-value">
                                            {formData.date && new Date(formData.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                            {formData.time && `, ${formData.time}`}
                                            {formData.duration && ` (${formData.duration} ${formData.duration === '1' ? 'hour' : 'hours'})`}
                                        </p>
                                    </div>
                                )}

                                {formData.attendees.length > 0 && (
                                    <div>
                                        <p className="summary-item-label">Attendees ({formData.attendees.length})</p>
                                        <div className="summary-attendees">
                                            {formData.attendees.map(attendee => (
                                                <span key={attendee.id} className="summary-attendee">
                                                    {attendee.name.split(' ')[0]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {formData.room && (
                                    <div>
                                        <p className="summary-item-label">Room</p>
                                        <p className="summary-item-value">
                                            {availableRooms.find(r => r.id.toString() === formData.room)?.name}
                                        </p>
                                    </div>
                                )}

                                {(formData.recurring || formData.videoConferencing) && (
                                    <div>
                                        <p className="summary-item-label">Options</p>
                                        <div className="summary-options">
                                            {formData.recurring && (
                                                <div className="summary-option">
                                                    <Repeat size={14} />
                                                    <span>Recurring meeting</span>
                                                </div>
                                            )}
                                            {formData.videoConferencing && (
                                                <div className="summary-option">
                                                    <Video size={14} />
                                                    <span>Video conferencing</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="no-details">No booking details yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomBooking;