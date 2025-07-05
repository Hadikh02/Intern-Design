import React, { useState, useEffect } from 'react';
import { Search, Clock, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/RoomBooking.css';

const RoomBooking = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { roomId, selectedDate } = location.state || {};
    const token = localStorage.getItem('accessToken');

    const formattedDate = selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : '';

    const [availableRooms, setAvailableRooms] = useState([]);
    const [attendeesList, setAttendeesList] = useState([]);
    const [roomDetails, setRoomDetails] = useState(null);
    const [unavailableTimes, setUnavailableTimes] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        time: '',
        duration: '1',
        attendees: [],
        room: roomId || '',
        meetingDate: formattedDate,
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [showAttendeeSearch, setShowAttendeeSearch] = useState(false);
    const [userId, setUserId] = useState(null);
    const [userType, setUserType] = useState(null);
    const [loadingUserId, setLoadingUserId] = useState(true);
    const [timeError, setTimeError] = useState('');

    useEffect(() => {
        if (!token) {
            navigate('/Login');
            return;
        }

        const fetchUser = async () => {
            try {
                const res = await fetch('https://localhost:7175/api/Users/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const userData = await res.json();
                    setUserId(userData.id || userData.Id);
                    setUserType(userData.userType || userData.UserType || 'Participant');
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to get user info. Please login again.' });
                    navigate('/Login');
                }
            } catch {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Network error while fetching user info.' });
                navigate('/Login');
            }
            setLoadingUserId(false);
        };

        fetchUser();
    }, [token, navigate]);

    useEffect(() => {
        if (!token) return;

        const fetchRooms = async () => {
            try {
                const response = await fetch('https://localhost:7175/api/Room', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setAvailableRooms(data);
                    const selectedRoom = data.find((r) => r.id === roomId);
                    setRoomDetails(selectedRoom);
                }
            } catch (err) {
                console.error(err);
            }
        };

        const fetchAttendees = async () => {
            try {
                const response = await fetch('https://localhost:7175/api/Users', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setAttendeesList(data);
                }
            } catch (err) {
                console.error(err);
            }
        };

        const fetchUnavailableTimes = async () => {
            if (!roomId || !formattedDate) return;
            try {
                const res = await fetch(`https://localhost:7175/api/Meetings/Room/${roomId}?date=${formattedDate}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setUnavailableTimes(data);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchRooms();
        fetchAttendees();
        fetchUnavailableTimes();
    }, [token, roomId, formattedDate]);

    const convertTo12Hour = (time24) => {
        if (!time24) return '';
        const [hourStr, minute] = time24.split(':');
        let hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${hour}:${minute} ${ampm}`;
    };

    const calculateEndTime = (startTime, duration) => {
        if (!startTime || !duration) return '';
        const [hours, minutes] = startTime.split(':').map(Number);
        const durationHours = parseFloat(duration);
        const startDate = new Date(formData.meetingDate);
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);
        return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:00`;
    };

    const checkTimeConflict = (startTime, duration) => {
        if (!startTime || !duration || unavailableTimes.length === 0) return false;
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const bookingStart = new Date(formData.meetingDate);
        bookingStart.setHours(startHours, startMinutes, 0, 0);
        const bookingEnd = new Date(bookingStart.getTime() + parseFloat(duration) * 60 * 60 * 1000);

        for (const meeting of unavailableTimes) {
            const meetingStart = new Date(formData.meetingDate);
            const meetingEnd = new Date(formData.meetingDate);
            const [startH, startM] = (meeting.startTime || meeting.StartTime).split(':').map(Number);
            const [endH, endM] = (meeting.endTime || meeting.EndTime).split(':').map(Number);
            meetingStart.setHours(startH, startM, 0, 0);
            meetingEnd.setHours(endH, endM, 0, 0);
            if (meetingEnd <= meetingStart) meetingEnd.setDate(meetingEnd.getDate() + 1);
            if (bookingStart < meetingEnd && bookingEnd > meetingStart) return true;
        }

        return false;
    };

    const handleInputChange = (field, value) => {
        if (field === 'time') {
            if (!formData.meetingDate) {
                setTimeError('Please select a meeting date first.');
                setFormData(prev => ({ ...prev, time: '' }));
                return;
            }
            const now = new Date();
            const [hour, minute] = value.split(':').map(Number);
            const selectedTime = new Date(formData.meetingDate);
            selectedTime.setHours(hour, minute, 0, 0);
            if (selectedTime <= now) setTimeError('Please select a future time.');
            else if (checkTimeConflict(value, formData.duration)) setTimeError('Time conflict with existing booking.');
            else setTimeError('');
        }

        if (field === 'duration' && formData.time) {
            if (checkTimeConflict(formData.time, value)) setTimeError('Duration causes time conflict.');
            else setTimeError('');
        }

        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId || timeError) {
            Swal.fire({ icon: 'error', title: 'Error', text: timeError || 'User not loaded yet.' });
            return;
        }

        const [startHour, startMin] = formData.time.split(':').map(Number);
        const durationHrs = parseFloat(formData.duration);

        const startDateTime = new Date(formData.meetingDate);
        startDateTime.setHours(startHour, startMin, 0, 0);
        const endDateTime = new Date(startDateTime.getTime() + durationHrs * 60 * 60 * 1000);

        if (endDateTime.getDate() !== startDateTime.getDate()) {
            setTimeError('Meetings cannot cross midnight. Please select an earlier time or shorter duration.');
            return;
        }

        const formatTime = (date) => date.toTimeString().split(' ')[0];

        const meetingData = {
            UserId: userId,
            RoomId: formData.room,
            Title: formData.title,
            MeetingDate: startDateTime.toISOString().split('T')[0],
            StartTime: formatTime(startDateTime),
            EndTime: formatTime(endDateTime),
            RecordingPath: '',
            IsRecorded: false,
            RecordingUploadedAt: startDateTime.toISOString().split('T')[0],
        };

        try {
            const res = await fetch('https://localhost:7175/api/Meetings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(meetingData),
            });

            if (res.ok) {
                const createdMeeting = await res.json();
                const meetingId = createdMeeting.id || createdMeeting.MeetingId;

                const payload = {
                    MeetingId: meetingId,
                    UserId: userId,
                    AttendanceStatus: 'Pending',
                    Role: userType || 'Participant',
                };

                await fetch('https://localhost:7175/api/MeetingAttendees', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });

                for (const a of formData.attendees.filter(a => a.id !== userId)) {
                    await fetch('https://localhost:7175/api/MeetingAttendees', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            MeetingId: meetingId,
                            UserId: a.id,
                            AttendanceStatus: 'Pending',
                            Role: a.userType || a.UserType || 'Participant',
                        }),
                    });
                }

                await Swal.fire({ icon: 'success', title: 'Booked', timer: 1500, showConfirmButton: false });
                navigate('/');
            } else {
                const error = await res.text();
                Swal.fire({ icon: 'error', title: 'Booking Failed', text: error });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error during booking.' });
        }
    };

    const filteredAttendees = attendeesList
        .filter((user) => user.id !== userId)
        .filter((a) =>
            a.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const addAttendee = (attendee) => {
        if (!formData.attendees.find((a) => a.id === attendee.id)) {
            setFormData(prev => ({ ...prev, attendees: [...prev.attendees, attendee] }));
        }
        setSearchTerm('');
        setShowAttendeeSearch(false);
    };

    const removeAttendee = (attendeeId) => {
        setFormData(prev => ({ ...prev, attendees: prev.attendees.filter((a) => a.id !== attendeeId) }));
    };

    const handleCancel = () => {
        setFormData({ title: '', time: '', duration: '1', attendees: [], room: '', meetingDate: '' });
        setSearchTerm('');
        navigate('/Rooms');
    };

    if (loadingUserId) return <div>Loading user info...</div>;

    return (
        <div className="room-booking-container">
            <div className="room-booking-header">
                <h1 className="room-booking-title">Book a Room</h1>
                <p className="room-booking-subtitle">Schedule your meeting and reserve the perfect space</p>
            </div>

            <div className="room-booking-grid">
                <div className="booking-form">
                    <form onSubmit={handleSubmit}>
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

                        <div className="form-group-inline">
                            <div>
                                <label className="form-label-icon">
                                    <Clock size={16} /> Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => handleInputChange('time', e.target.value)}
                                    className="form-input"
                                    required
                                />
                                {timeError && <p style={{ color: 'red', marginTop: '5px' }}>{timeError}</p>}
                            </div>
                            <div>
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
                        </div>

                        <div className="form-group">
                            <label className="form-label-icon">
                                <Users size={16} /> Attendees
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
                                    className="form-input-search"
                                    onFocus={() => setShowAttendeeSearch(true)}
                                    onBlur={() => setTimeout(() => setShowAttendeeSearch(false), 200)}
                                />
                                <Search size={16} className="search-icon" />
                                {showAttendeeSearch && searchTerm && (
                                    <div className="attendee-dropdown">
                                        {filteredAttendees.length === 0 ? (
                                            <div className="attendee-option">No attendees found</div>
                                        ) : (
                                            filteredAttendees.map((attendee) => (
                                                <div
                                                    key={attendee.id}
                                                    onClick={() => addAttendee(attendee)}
                                                    className="attendee-option"
                                                >
                                                    <div className="attendee-name">
                                                        {attendee.firstName} {attendee.lastName}
                                                    </div>
                                                    <div className="attendee-email">{attendee.email}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                                {formData.attendees.length > 0 && (
                                    <div className="attendees-list">
                                        {formData.attendees.map((attendee) => (
                                            <div key={attendee.id} className="attendee-tag">
                                                <span>
                                                    {attendee.firstName} {attendee.lastName}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttendee(attendee.id)}
                                                    className="attendee-remove"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="button-group">
                            <button type="button" onClick={handleCancel} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loadingUserId || !userId || !!timeError}
                            >
                                Book Now
                            </button>
                        </div>
                    </form>
                </div>

                <div className="room-info-card">
                    <h2 className="room-info-title">Room Details</h2>
                    {roomDetails ? (
                        <div className="room-info-content">
                            <p><strong>Room Number:</strong> {roomDetails.roomNumber}</p>
                            <p><strong>Location:</strong> {roomDetails.location}</p>
                            {formData.time && formData.duration && (
                                <div className="booking-preview">
                                    <p><strong>Booking Time:</strong> {convertTo12Hour(formData.time)} - {convertTo12Hour(calculateEndTime(formData.time, formData.duration))}</p>
                                    <p><strong>Duration:</strong> {formData.duration} hour{formData.duration !== '1' ? 's' : ''}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p>Loading room details...</p>
                    )}

                    <h3 className="unavailable-title">Unavailable Times</h3>
                    {unavailableTimes.length > 0 ? (
                        <ul className="unavailable-times-list">
                            {unavailableTimes.map((meeting, index) => (
                                <li key={index} className="unavailable-time">
                                    {convertTo12Hour(meeting.startTime || meeting.StartTime)} - {convertTo12Hour(meeting.endTime || meeting.EndTime)}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No unavailable times</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoomBooking;
