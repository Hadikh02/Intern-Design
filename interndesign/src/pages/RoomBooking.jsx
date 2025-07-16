import React, { useState, useEffect } from 'react';
import { Search, Clock, Users, X, Mail } from 'lucide-react';
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

    // Notification states
    const [showNotificationForm, setShowNotificationForm] = useState(false);
    const [createdMeetingId, setCreatedMeetingId] = useState(null);
    const [notificationData, setNotificationData] = useState({
        eventType: 'Meeting Invitation',
        eventDescription: ''
    });
    const [isSubmittingNotification, setIsSubmittingNotification] = useState(false);

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
                console.error('Error fetching rooms:', err);
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
                console.error('Error fetching attendees:', err);
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
                console.error('Error fetching unavailable times:', err);
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

    const isTimeInPast = (selectedTime, selectedDate) => {
        if (!selectedTime || !selectedDate) return false;

        const now = new Date();
        const [hour, minute] = selectedTime.split(':').map(Number);
        const selectedDateTime = new Date(selectedDate);
        selectedDateTime.setHours(hour, minute, 0, 0);

        // Add a small buffer (1 minute) to account for processing time
        const nowWithBuffer = new Date(now.getTime() + 60000);

        return selectedDateTime <= nowWithBuffer;
    };

    const handleInputChange = (field, value) => {
        if (field === 'time') {
            if (!formData.meetingDate) {
                setTimeError('Please select a meeting date first.');
                setFormData(prev => ({ ...prev, time: '' }));
                return;
            }

            if (isTimeInPast(value, formData.meetingDate)) {
                setTimeError('Please select a future time.');
            } else if (checkTimeConflict(value, formData.duration)) {
                setTimeError('Time conflict with existing booking.');
            } else {
                setTimeError('');
            }
        }

        if (field === 'duration' && formData.time) {
            if (checkTimeConflict(formData.time, value)) {
                setTimeError('Duration causes time conflict.');
            } else if (isTimeInPast(formData.time, formData.meetingDate)) {
                setTimeError('Please select a future time.');
            } else {
                setTimeError('');
            }
        }

        if (field === 'meetingDate') {
            // Reset time error when date changes
            if (formData.time && !isTimeInPast(formData.time, value)) {
                setTimeError('');
            }
        }

        setFormData(prev => ({ ...prev, [field]: value }));

        // Update notification description when title, date, or time changes
        if (field === 'title' || field === 'meetingDate' || field === 'time') {
            const title = field === 'title' ? value : formData.title;
            const date = field === 'meetingDate' ? value : formData.meetingDate;
            const time = field === 'time' ? value : formData.time;

            setNotificationData(prev => ({
                ...prev,
                eventDescription: `You've been invited to a meeting titled "${title}" on ${date} at ${convertTo12Hour(time)}`
            }));
        }
    };

    const handleNotificationInputChange = (field, value) => {
        setNotificationData(prev => ({ ...prev, [field]: value }));
    };

    // Updated sendEmailNotification function for your React component
    const sendEmailNotification = async (attendee, notification) => {
        try {
            // Ensure all required fields are present and properly formatted
            const meetingDate = new Date(formData.meetingDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const sentAt = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Create a default description if none is provided
            const eventDescription = notification.eventDescription ||
                `You've been invited to a meeting titled "${formData.title || 'No Title'}" on ${meetingDate} at ${convertTo12Hour(formData.time) || 'unknown time'}`;

            const emailRequest = {
                to: attendee.email || '',
                subject: notification.eventType || 'Meeting Notification',
                recipientName: `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim(),
                eventType: notification.eventType || 'Meeting Invitation',
                eventDescription: eventDescription,  // Use the properly formatted description
                meetingTitle: formData.title || '',
                meetingDate: meetingDate,
                meetingTime: convertTo12Hour(formData.time) || '',
                meetingDuration: `${formData.duration} hour${formData.duration !== '1' ? 's' : ''}`,
                roomDetails: roomDetails
                    ? `${roomDetails.roomNumber} - ${roomDetails.location}`
                    : 'Meeting Room',
                sentAt: sentAt
            };

            // Validate required fields before sending
            const requiredFields = ['to', 'subject', 'recipientName', 'eventDescription'];
            const missingFields = requiredFields.filter(field =>
                !emailRequest[field] || emailRequest[field].trim() === ''
            );

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailRequest.to)) {
                throw new Error('Invalid email address format');
            }

            console.log('Sending email with payload:', JSON.stringify(emailRequest, null, 2));

            const response = await fetch('https://localhost:7175/api/Email/send-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(emailRequest)
            });

            const responseText = await response.text();
            console.log('Email API Response:', {
                status: response.status,
                statusText: response.statusText,
                body: responseText
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

                try {
                    const errorData = JSON.parse(responseText);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.errors) {
                        errorMessage = Array.isArray(errorData.errors)
                            ? errorData.errors.join(', ')
                            : JSON.stringify(errorData.errors);
                    }
                } catch (parseError) {
                    // If response is not JSON, use the raw text
                    errorMessage = responseText || errorMessage;
                }

                throw new Error(errorMessage);
            }

            // Try to parse the response as JSON
            try {
                return JSON.parse(responseText);
            } catch (parseError) {
                // If not JSON, return a success object
                return { success: true, message: 'Email sent successfully' };
            }

        } catch (error) {
            console.error('Email sending error:', error);
            throw new Error(`Failed to send email to ${attendee.email}: ${error.message}`);
        }
    };
    const handleSubmitNotification = async (e) => {
        e.preventDefault();
        setIsSubmittingNotification(true);

        try {
            const results = [];
            let notificationSuccessCount = 0;
            let emailSuccessCount = 0;

            for (const attendee of formData.attendees) {
                const result = {
                    attendee: `${attendee.firstName} ${attendee.lastName}`,
                    email: attendee.email,
                    notificationSuccess: false,
                    emailSuccess: false,
                    error: null
                };

                try {
                    // Create notification in database
                    const notification = {
                        EventType: notificationData.eventType,
                        EventDescription: notificationData.eventDescription,
                        IsRead: false,
                        CreatedAt: new Date().toISOString(),
                        MeetingId: createdMeetingId,
                        UserId: attendee.id
                    };

                    const notificationResponse = await fetch('https://localhost:7175/api/Notifications', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(notification)
                    });

                    if (notificationResponse.ok) {
                        notificationSuccessCount++;
                        result.notificationSuccess = true;
                    }

                    // Send email notification
                    try {
                        await sendEmailNotification(attendee, notification);
                        emailSuccessCount++;
                        result.emailSuccess = true;
                    } catch (emailError) {
                        result.error = emailError.message;
                        console.error(`Failed to send email to ${attendee.email}:`, emailError);
                    }

                } catch (error) {
                    result.error = error.message;
                    console.error(`Failed to process notification for ${attendee.email}:`, error);
                }

                results.push(result);
            }

            // Show results to user
            if (emailSuccessCount === formData.attendees.length) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    html: `
                        <p>All notifications and emails sent successfully!</p>
                        <p>• Notifications: ${notificationSuccessCount}/${formData.attendees.length}</p>
                        <p>• Emails: ${emailSuccessCount}/${formData.attendees.length}</p>
                    `,
                    timer: 3000,
                    showConfirmButton: false
                });
            } else {
                const failedEmails = results.filter(r => !r.emailSuccess);
                await Swal.fire({
                    icon: 'warning',
                    title: 'Partial Success',
                    html: `
                        <p>Notifications sent: ${notificationSuccessCount}/${formData.attendees.length}</p>
                        <p>Emails sent: ${emailSuccessCount}/${formData.attendees.length}</p>
                        ${failedEmails.length > 0 ? `
                            <div style="margin-top: 1rem; text-align: left;">
                                <p><strong>Failed emails:</strong></p>
                                <ul style="padding-left: 1rem;">
                                    ${failedEmails.map(f => `
                                        <li>${f.attendee} (${f.email}): ${f.error || 'Unknown error'}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    `,
                    showConfirmButton: true
                });
            }

            setShowNotificationForm(false);
            navigate('/');
        } catch (err) {
            console.error('Error in notification submission:', err);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An unexpected error occurred. Please try again.',
                showConfirmButton: true
            });
        } finally {
            setIsSubmittingNotification(false);
        }
    };

    const handleSkipNotification = () => {
        setShowNotificationForm(false);
        navigate('/');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (roomDetails && formData.attendees.length + 1 > roomDetails.capacity) {
            Swal.fire({
                icon: 'error',
                title: 'Capacity Exceeded',
                text: `This room can only accommodate ${roomDetails.capacity} people. You have ${formData.attendees.length + 1} attendees.`,
            });
            return;
        }
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
                setCreatedMeetingId(meetingId);

                // ✅ Inject organizer into attendees if not already included
                const organizerInfo = {
                    id: userId,
                    email: localStorage.getItem("userEmail") || "",
                    firstName: localStorage.getItem("userFirstName") || "You",
                    lastName: localStorage.getItem("userLastName") || "",
                    userType: userType
                };

                setFormData(prev => ({
                    ...prev,
                    attendees: [organizerInfo, ...prev.attendees.filter(a => a.id !== userId)]
                }));


                // Add organizer as attendee
                const payload = {
                    MeetingId: meetingId,
                    UserId: userId,
                    AttendanceStatus: 'Confirmed',
                    Role: userType || 'Organizer',
                };

                await fetch('https://localhost:7175/api/MeetingAttendees', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });

                // Add other attendees
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

                await Swal.fire({
                    icon: 'success',
                    title: 'Meeting Booked',
                    text: 'Your meeting has been successfully scheduled!',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Show notification form if there are attendees
                if (formData.attendees.length > 0) {
                    setShowNotificationForm(true);
                } else {
                    navigate('/');
                }
            } else {
                const error = await res.text();
                Swal.fire({ icon: 'error', title: 'Booking Failed', text: error });
            }
        } catch (err) {
            console.error('Error during booking:', err);
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

    if (loadingUserId) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading user information...</p>
            </div>
        );
    }

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

                        <div className="form-group">
                            <label className="form-label">Meeting Date</label>
                            <input
                                type="date"
                                value={formData.meetingDate}
                                onChange={(e) => handleInputChange('meetingDate', e.target.value)}
                                className="form-input"
                                min={new Date().toISOString().split('T')[0]}
                                disabled
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
                                {timeError && <p className="error-message">{timeError}</p>}
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
                                <div className="search-input-wrapper">
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
                                </div>

                                {showAttendeeSearch && searchTerm && (
                                    <div className="attendee-dropdown">
                                        <div className="attendee-dropdown-content">
                                            {filteredAttendees.length === 0 ? (
                                                <div className="attendee-option no-results">No attendees found</div>
                                            ) : (
                                                filteredAttendees.map((attendee) => (
                                                    <div
                                                        key={attendee.id}
                                                        onClick={() => addAttendee(attendee)}
                                                        className="attendee-option"
                                                    >
                                                        <div className="attendee-info">
                                                            <div className="attendee-name">
                                                                {attendee.firstName} {attendee.lastName}
                                                            </div>
                                                            <div className="attendee-email">{attendee.email}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
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
                                                    aria-label="Remove attendee"
                                                >
                                                    <X size={12} />
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
                                disabled={loadingUserId || !userId || !!timeError ||
                                    (roomDetails?.capacity && formData.attendees.length + 1 > roomDetails.capacity)}
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
                            <p><strong>Capacity:</strong> {roomDetails.capacity || 'N/A'}</p>
                            {roomDetails.capacity && formData.attendees.length + 1 > roomDetails.capacity && (
                                <div className="capacity-warning">
                                    ⚠️ This room's capacity will be exceeded ({formData.attendees.length + 1}/{roomDetails.capacity})
                                </div>
                            )}
                            {formData.time && formData.duration && (
                                <div className="booking-preview">
                                    <h3>Booking Preview</h3>
                                    <p><strong>Date:</strong> {new Date(formData.meetingDate).toLocaleDateString()}</p>
                                    <p><strong>Time:</strong> {convertTo12Hour(formData.time)} - {convertTo12Hour(calculateEndTime(formData.time, formData.duration))}</p>
                                    <p><strong>Duration:</strong> {formData.duration} hour{formData.duration !== '1' ? 's' : ''}</p>
                                    <p><strong>Attendees:</strong> {formData.attendees.length + 1} (including you)</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p>Loading room details...</p>
                    )}

                    <div className="unavailable-times-section">
                        <h3 className="unavailable-title">Unavailable Times</h3>
                        {unavailableTimes.length > 0 ? (
                            <div className="unavailable-times-list">
                                {unavailableTimes.map((meeting, index) => (
                                    <div key={index} className="unavailable-time">
                                        <Clock size={14} />
                                        <span>
                                            {convertTo12Hour(meeting.startTime || meeting.StartTime)} - {convertTo12Hour(meeting.endTime || meeting.EndTime)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-unavailable-times">No unavailable times for this date</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Notification Form Modal */}
            {showNotificationForm && (
                <div className="notification-modal-overlay">
                    <div className="notification-modal">
                        <div className="notification-modal-header">
                            <h2>
                                <Mail size={20} />
                                Send Notification to Attendees
                            </h2>
                            <button
                                type="button"
                                onClick={handleSkipNotification}
                                className="modal-close-btn"
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitNotification}>
                            <div className="notification-form-group">
                                <label className="notification-form-label">Event Type</label>
                                <input
                                    type="text"
                                    value={notificationData.eventType}
                                    onChange={(e) => handleNotificationInputChange('eventType', e.target.value)}
                                    placeholder="e.g., Meeting Invitation, Schedule Change"
                                    className="notification-form-input"
                                    required
                                />
                            </div>

                            <div className="notification-form-group">
                                <label className="notification-form-label">Event Description</label>
                                <textarea
                                    value={notificationData.eventDescription}
                                    onChange={(e) => handleNotificationInputChange('eventDescription', e.target.value)}
                                    placeholder="Describe the meeting details or any important information..."
                                    className="notification-form-textarea"
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="notification-attendees-info">
                                <h3>Notification Recipients ({formData.attendees.length})</h3>
                                <div className="notification-attendees-list">
                                    {formData.attendees.map((attendee) => (
                                        <div key={attendee.id} className="notification-attendee-item">
                                            <div className="attendee-details">
                                                <span className="attendee-name">
                                                    {attendee.firstName} {attendee.lastName}
                                                </span>
                                                <span className="attendee-email">
                                                    {attendee.email}
                                                </span>
                                            </div>
                                            <div className="notification-attendee-status">
                                                <Mail size={16} className="notification-icon" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="notification-modal-actions">
                                <button
                                    type="button"
                                    onClick={handleSkipNotification}
                                    className="btn btn-secondary"
                                    disabled={isSubmittingNotification}
                                >
                                    Skip & Continue
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmittingNotification}
                                >
                                    {isSubmittingNotification ? 'Sending...' : 'Send Notifications & Emails'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomBooking;