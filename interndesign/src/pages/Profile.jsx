import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.scss';

// Utility functions with enhanced error handling
const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
        const [hours, minutes, seconds = 0] = timeString.split(':').map(Number);
        const date = new Date(2000, 0, 1, hours, minutes, seconds);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        console.error('Error formatting time:', error);
        return timeString;
    }
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        let date = new Date(dateString);
        if (isNaN(date.getTime())) {
            const parts = dateString.split('T')[0].split('-');
            if (parts.length === 3) {
                date = new Date(parts[0], parts[1] - 1, parts[2]);
            }
        }
        return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
};

const getMeetingStatus = (meeting) => {
    // Normalize field names
    const date = meeting.date || meeting.Date || meeting.meetingDate || meeting.MeetingDate;
    const startTime = meeting.startTime || meeting.StartTime;
    const endTime = meeting.endTime || meeting.EndTime;

    if (!date || !startTime || !endTime) {
        console.warn('Missing required meeting fields:', { date, startTime, endTime });
        return 'unknown';
    }

    try {
        const dateStr = date.split('T')[0];
        const now = new Date();

        // Handle cases where time might be missing seconds
        const [startHour, startMin, startSec = 0] = startTime.split(':').map(Number);
        const [endHour, endMin, endSec = 0] = endTime.split(':').map(Number);
        const [year, month, day] = dateStr.split('-').map(Number);

        // Create date objects in local timezone
        const start = new Date(year, month - 1, day, startHour, startMin, startSec);
        const end = new Date(year, month - 1, day, endHour, endMin, endSec);

        // Debug logging
        console.debug('Meeting Time Comparison:', {
            now: now.toString(),
            start: start.toString(),
            end: end.toString(),
            comparison: {
                isBefore: now < start,
                isActive: now >= start && now <= end,
                isEnded: now > end
            }
        });

        if (now < start) return 'not_started';
        if (now <= end) return 'active';  // Changed to <= to include end time
        return 'ended';
    } catch (error) {
        console.error('Error determining meeting status:', error);
        return 'unknown';
    }
};

const ProfilePage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            // إذا ما في توكن، حوّل المستخدم لصفحة تسجيل الدخول
            navigate('/login', { replace: true });
        }
    }, [navigate]);
    const [isEditing, setIsEditing] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [meetings, setMeetings] = useState([]);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        type: ''
    });


    const [tempFormData, setTempFormData] = useState({ ...formData });
 

    useEffect(() => {
        const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    useEffect(() => {
        const fetchUserInfo = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('No access token found. Please log in.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch('https://localhost:7175/api/Users/me', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });

                if (!response.ok) {
                    throw new Error('Unauthorized. Please log in again.');
                }

                const data = await response.json();
                const normalizedData = {
                    firstName: data.firstName || data.FirstName || '',
                    lastName: data.lastName || data.LastName || '',
                    email: data.email || data.Email || '',
                    type: data.type || data.Type || data.userType || data.UserType || '',
                };

                setFormData(normalizedData);
                setTempFormData(normalizedData);
                setUserId(data.id || data.Id);
                setError(null);
            } catch (err) {
                setError(err.message || 'Failed to load user information.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, []);

    useEffect(() => {
        const fetchUserMeetings = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token || !userId) return;

            try {
                // Fetch meeting attendees
                const attendeesRes = await fetch(
                    `https://localhost:7175/api/MeetingAttendees?userId=${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                    }
                );

                if (!attendeesRes.ok) {
                    throw new Error('Failed to fetch meeting attendees');
                }

                const allAttendees = await attendeesRes.json();
                const meetingIds = allAttendees
                    .filter(a => (a.userId === userId || a.UserId === userId) &&
                        a.attendanceStatus !== 'Declined')
                    .map(a => a.meetingId || a.MeetingId);

                // Fetch all meetings
                const meetingsRes = await fetch('https://localhost:7175/api/Meetings', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });

                if (!meetingsRes.ok) {
                    throw new Error('Failed to fetch meetings');
                }

                const allMeetings = await meetingsRes.json();
                const userMeetings = allMeetings.filter(m =>
                    meetingIds.includes(m.id || m.Id)
                );

                setMeetings(userMeetings);
            } catch (err) {
                console.error('Error fetching meetings:', err);
            }
        };

        if (userId) fetchUserMeetings();
    }, [userId]);

    const handleJoin = async (meetingId) => {
        const token = localStorage.getItem('accessToken');
        if (!token || !userId) {
            alert('Please log in to join meetings');
            return;
        }

        try {
            const meetingRes = await fetch(
                `https://localhost:7175/api/Meetings/${meetingId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                }
            );

            if (!meetingRes.ok) {
                throw new Error('Failed to fetch meeting details');
            }

            const meeting = await meetingRes.json();

            // Normalize meeting fields
            const normalizedMeeting = {
                date: meeting.date || meeting.Date || meeting.meetingDate || meeting.MeetingDate,
                startTime: meeting.startTime || meeting.StartTime,
                endTime: meeting.endTime || meeting.EndTime
            };

            const status = getMeetingStatus(normalizedMeeting);

            if (status !== 'active') {
                alert(`Meeting is ${status === 'not_started' ? 'not started yet' : 'already ended'}`);
                return;
            }

            // Check attendee status
            const attendeesRes = await fetch(
                `https://localhost:7175/api/MeetingAttendees?meetingId=${meetingId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                }
            );

            if (!attendeesRes.ok) {
                throw new Error('Failed to fetch attendees');
            }

            const attendees = await attendeesRes.json();
            const attendee = attendees.find(a =>
                (a.userId === userId || a.UserId === userId) &&
                a.attendanceStatus !== 'Declined'
            );

            if (!attendee) {
                alert('You are not registered for this meeting');
                return;
            }

            // Update attendance status
            const updateRes = await fetch(
                `https://localhost:7175/api/MeetingAttendees/${attendee.id || attendee.Id}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        Id: attendee.id || attendee.Id,
                        MeetingId: attendee.meetingId || attendee.MeetingId,
                        UserId: attendee.userId || attendee.UserId,
                        AttendanceStatus: 'Present',
                        Role: attendee.role || attendee.Role || 'Participant'
                    }),
                }
            );

            if (!updateRes.ok) {
                throw new Error('Failed to update attendance');
            }

            navigate('/screen', { state: { meetingId, userId } });
        } catch (err) {
            console.error('Error joining meeting:', err);
            alert(`Error: ${err.message}`);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        setTempFormData(formData);
    };

    const handleSave = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token || !userId) {
            setError('Authentication required');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `https://localhost:7175/api/Users/${userId}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: userId,
                        firstName: tempFormData.firstName.trim(),
                        lastName: tempFormData.lastName.trim(),
                        email: tempFormData.email.trim()
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Update failed');
            }

            setFormData(tempFormData);
            setIsEditing(false);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to save changes');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setTempFormData(formData);
        setIsEditing(false);
        setError(null);
    };

    const handleInputChange = (field, value) => {
        setTempFormData(prev => ({ ...prev, [field]: value }));
    };

    const initials = formData.firstName && formData.lastName
        ? `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase()
        : '??';

    if (loading) return (
        <div className={`profile-page ${isMobile ? 'mobile' : 'desktop'}`}>
            <div className="profile-container">
                <p>Loading profile information...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className={`profile-page ${isMobile ? 'mobile' : 'desktop'}`}>
            <div className="profile-container">
                <p className="error-message">{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        </div>
    );

    return (
        <div className={`profile-page ${isMobile ? 'mobile' : 'desktop'}`}>
            <div className="profile-container">
                <header className="profile-header">
                    <h1 className="profile-title">User Profile</h1>
                    <p className="profile-subtitle">Manage your profile and meetings</p>
                </header>

                <div className="profile-grid">
                    <div className="profile-form">
                        <div className="profile-card">
                            <div className="form-header">
                                <h2 className="form-title">Profile Information</h2>
                                {!isEditing ? (
                                    <button onClick={handleEdit} className="btn btn-edit">
                                        <Edit2 size={18} /> Edit Profile
                                    </button>
                                ) : (
                                    <div className="edit-actions">
                                        <button onClick={handleSave} className="btn btn-save">
                                            <Save size={18} /> Save
                                        </button>
                                        <button onClick={handleCancel} className="btn btn-cancel">
                                            <X size={18} /> Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="profile-avatar">
                                <div className="avatar-circle">{initials}</div>
                            </div>

                            <div className="form-fields">
                                {['firstName', 'lastName', 'email'].map(field => (
                                    <div className="form-group" key={field}>
                                        <label className="form-label">
                                            {field === 'firstName' ? 'First Name' :
                                                field === 'lastName' ? 'Last Name' : 'Email'}
                                        </label>
                                        {isEditing ? (
                                            <input
                                                className="form-input"
                                                type={field === 'email' ? 'email' : 'text'}
                                                value={tempFormData[field]}
                                                onChange={e => handleInputChange(field, e.target.value)}
                                                placeholder={`Enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                                            />
                                        ) : (
                                            <div className="form-display">
                                                {formData[field] || 'Not provided'}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="form-group">
                                    <label className="form-label">User Type</label>
                                    <div className="form-display">
                                        {formData.type || 'Not provided'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-content">
                        <div className="profile-card meetings-card">
                            <h2>Your Meetings</h2>
                            {meetings.length === 0 ? (
                                <p className="no-meetings">You have no scheduled meetings.</p>
                            ) : (
                                <div className="meetings-list">
                                    {meetings.map(meeting => {
                                        // Normalize meeting data
                                        const meetingId = meeting.id || meeting.Id;
                                        const title = meeting.title || meeting.Title || 'Untitled Meeting';
                                        const date = meeting.date || meeting.Date || meeting.meetingDate || meeting.MeetingDate;
                                        const startTime = meeting.startTime || meeting.StartTime;
                                        const endTime = meeting.endTime || meeting.EndTime;

                                        const status = getMeetingStatus({ date, startTime, endTime });

                                        return (
                                            <div key={meetingId} className={`meeting-item ${status}`}>
                                                <div className="meeting-details">
                                                    <h3 className="meeting-title">{title}</h3>
                                                    <div className="meeting-info">
                                                        <div className="info-group">
                                                            <span className="info-label">Date</span>
                                                            <span className="info-value">{formatDate(date)}</span>
                                                        </div>
                                                        <div className="info-group">
                                                            <span className="info-label">Time</span>
                                                            <span className="info-value">
                                                                {formatTime(startTime)} - {formatTime(endTime)}
                                                            </span>
                                                        </div>
                                                        <div className="info-group">
                                                            <span className="info-label">Status</span>
                                                            <span className={`info-value ${status}`}>
                                                                {status === 'not_started' ? 'Not Started' :
                                                                    status === 'active' ? 'Active Now' : 'Ended'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="meeting-actions">
                                                    <button
                                                        onClick={() => handleJoin(meetingId)}
                                                        className={`btn ${status === 'active' ? 'btn-join' : 'btn-disabled'}`}
                                                        disabled={status !== 'active'}
                                                    >
                                                        <Video size={16} />
                                                        {status === 'active' ? 'Join Now' :
                                                            status === 'not_started' ? 'Not Started' : 'Ended'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
                        </ul>
                    </div>
                    <div className="footer-contact">
                        <h4>Contact Us</h4>
                        <p>
                            <svg className="icon" width="16" height="16" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                            </svg>
                            info@taska.com
                        </p>
                        <p>
                            <svg className="icon" width="16" height="16" viewBox="0 0 24 24">
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

export default ProfilePage;