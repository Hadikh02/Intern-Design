import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Video, Bell, Eye, Trash2, Users, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/Profile.scss';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [meetings, setMeetings] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [attendeeNotificationStatus, setAttendeeNotificationStatus] = useState({});
    const [loadingAttendeeStatus, setLoadingAttendeeStatus] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        type: ''
    });
    const [tempFormData, setTempFormData] = useState({ ...formData });
    const [isSendingEmails, setIsSendingEmails] = useState(false);

    // Utility functions
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

            const [startHour, startMin, startSec = 0] = startTime.split(':').map(Number);
            const [endHour, endMin, endSec = 0] = endTime.split(':').map(Number);
            const [year, month, day] = dateStr.split('-').map(Number);

            const start = new Date(year, month - 1, day, startHour, startMin, startSec);
            const end = new Date(year, month - 1, day, endHour, endMin, endSec);

            if (now < start) return 'not_started';
            if (now <= end) return 'active';
            return 'ended';
        } catch (error) {
            console.error('Error determining meeting status:', error);
            return 'unknown';
        }
    };

    const formatDuration = (startTime, endTime) => {
        const start = new Date(`1970-01-01T${startTime}`);
        const end = new Date(`1970-01-01T${endTime}`);
        const diffMs = end - start;
        const diffMins = Math.floor(diffMs / 60000);

        const hours = Math.floor(diffMins / 60);
        const minutes = diffMins % 60;

        if (hours && minutes) return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
        if (hours) return `${hours} hour${hours > 1 ? 's' : ''}`;
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    };

    // Fetch attendee notification status for organizer's meetings
    const fetchAttendeeNotificationStatus = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token || !userId) return;

        setLoadingAttendeeStatus(true);
        try {
            // Get meetings where user is the organizer
            const organizerMeetings = meetings.filter(meeting =>
                parseInt(meeting.userId || meeting.UserId) === parseInt(userId)
            );

            const statusData = {};

            for (const meeting of organizerMeetings) {
                const meetingId = meeting.id || meeting.Id;

                // Fetch attendees for this meeting
                const attendeesRes = await fetch(
                    `https://localhost:7175/api/MeetingAttendees?meetingId=${meetingId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!attendeesRes.ok) {
                    console.error(`Failed to fetch attendees for meeting ${meetingId}`);
                    continue;
                }

                const attendees = await attendeesRes.json();

                // Fetch notifications for this meeting
                const notificationsRes = await fetch(
                    `https://localhost:7175/api/Notifications`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!notificationsRes.ok) {
                    console.error(`Failed to fetch notifications for meeting ${meetingId}`);
                    continue;
                }

                const allNotifications = await notificationsRes.json();
                const meetingNotifications = allNotifications.filter(n =>
                    (n.meetingId || n.MeetingId) === meetingId
                );

                // Process attendees with their notification status
                const attendeeStatuses = attendees.map(attendee => {
                    const attendeeUserId = attendee.userId || attendee.UserId;
                    const attendeeNotifications = meetingNotifications.filter(n =>
                        (n.userId || n.UserId) === attendeeUserId
                    );

                    // Get the latest notification for this attendee
                    const latestNotification = attendeeNotifications.sort((a, b) =>
                        new Date(b.createdAt || b.CreatedAt) - new Date(a.createdAt || a.CreatedAt)
                    )[0];

                    return {
                        userId: attendeeUserId,
                        firstName: attendee.firstName || attendee.FirstName || attendee.user?.firstName || attendee.User?.firstName || 'Unknown',
                        lastName: attendee.lastName || attendee.LastName || attendee.user?.lastName || attendee.User?.lastName || 'User',
                        email: attendee.email || attendee.Email || attendee.user?.email || attendee.User?.email || 'No email',
                        role: attendee.role || attendee.Role || 'Participant',
                        attendanceStatus: attendee.attendanceStatus || attendee.AttendanceStatus || 'Pending',
                        hasNotification: !!latestNotification,
                        notificationRead: latestNotification ? (latestNotification.isRead || latestNotification.IsRead) : false,
                        lastNotificationDate: latestNotification ? (latestNotification.createdAt || latestNotification.CreatedAt) : null,
                        notificationEventType: latestNotification ? (latestNotification.eventType || latestNotification.EventType) : null
                    };
                });

                statusData[meetingId] = {
                    meetingTitle: meeting.title || meeting.Title || 'Untitled Meeting',
                    meetingDate: meeting.date || meeting.Date || meeting.meetingDate || meeting.MeetingDate,
                    attendees: attendeeStatuses
                };
            }

            setAttendeeNotificationStatus(statusData);
        } catch (error) {
            console.error('Error fetching attendee notification status:', error);
        } finally {
            setLoadingAttendeeStatus(false);
        }
    };

    const sendCancellationEmails = async (
        meetingId,
        meetingTitle,
        meetingDate,
        startTime,
        endTime,
        roomDetails
    ) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error('No access token available');
            return false;
        }

        setIsSendingEmails(true);
        let successCount = 0;

        try {
            // 1. First fetch meeting details
            const meetingRes = await fetch(`https://localhost:7175/api/Meetings/${meetingId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!meetingRes.ok) {
                throw new Error(`Failed to fetch meeting: ${meetingRes.status}`);
            }
            const meeting = await meetingRes.json();

            // 2. Fetch attendees
            const attendeesRes = await fetch(`https://localhost:7175/api/MeetingAttendees?meetingId=${meetingId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!attendeesRes.ok) {
                throw new Error(`Failed to fetch attendees: ${attendeesRes.status}`);
            }

            let attendees = await attendeesRes.json();

            // Normalize attendee data structure
            attendees = attendees.map(attendee => ({
                ...attendee,
                email: attendee.email || attendee.Email || attendee.user?.email || attendee.User?.email,
                firstName: attendee.firstName || attendee.FirstName || attendee.user?.firstName || attendee.User?.firstName,
                lastName: attendee.lastName || attendee.LastName || attendee.user?.lastName || attendee.User?.lastName
            }));

            console.log('Normalized attendees:', attendees);

            if (!attendees || attendees.length === 0) {
                console.log('No attendees to notify');
                return true;
            }

            // 3. Process each attendee
            for (const [index, attendee] of attendees.entries()) {
                try {
                    if (!attendee.email) {
                        console.warn('Skipping attendee with no email:', attendee);
                        continue;
                    }

                    const emailPayload = {
                        to: attendee.email,
                        subject: `Meeting Cancelled: ${meetingTitle}`,
                        recipientName: `${attendee.firstName || 'User'} ${attendee.lastName || ''}`.trim(),
                        eventType: 'MEETING_CANCELLATION',
                        eventDescription: `The meeting "${meetingTitle}" scheduled for ${formatDate(meetingDate)} at ${formatTime(startTime)} has been cancelled.`,
                        meetingTitle,
                        meetingDate: formatDate(meetingDate),
                        meetingDuration: `${formatDuration(startTime, endTime)}`,
                        meetingTime: formatTime(startTime),
                        roomDetails: roomDetails || 'N/A',
                        sentAt: new Date().toISOString()
                    };

                    console.log('Attempting to send to:', attendee.email, 'with:', emailPayload);

                    if (index > 0) await new Promise(resolve => setTimeout(resolve, 100));

                    const emailRes = await fetch('https://localhost:7175/api/Email/send-notification', {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(emailPayload)
                    });

                    if (!emailRes.ok) {
                        const error = await emailRes.json();
                        throw new Error(error.message || `Email failed with status ${emailRes.status}`);
                    }

                    successCount++;
                    console.log(`Successfully sent to ${attendee.email}`);
                } catch (err) {
                    console.error(`Failed to send to ${attendee.email}:`, err.message);
                }
            }

            const allSuccessful = successCount === attendees.filter(a => a.email).length;
            console.log(`Final result: ${successCount}/${attendees.length} emails sent`);

            return allSuccessful;
        } catch (err) {
            console.error('Email sending process failed:', err);
            return false;
        } finally {
            setIsSendingEmails(false);
        }
    };

    // Authentication check
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    // Responsive check
    useEffect(() => {
        const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    // Fetch user info
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

    // Fetch user meetings
    useEffect(() => {
        const fetchUserMeetings = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token || !userId) return;

            try {
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

    // Fetch notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token || !userId) return;

            try {
                const response = await fetch(
                    `https://localhost:7175/api/Notifications/user/${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch notifications');
                }

                const data = await response.json();
                setNotifications(data);
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };

        if (userId) fetchNotifications();
    }, [userId]);

    // Fetch attendee notification status when meetings are loaded
    useEffect(() => {
        if (meetings.length > 0 && userId) {
            fetchAttendeeNotificationStatus();
        }
    }, [meetings, userId]);

    const handleJoin = async (meetingId) => {
        const token = localStorage.getItem('accessToken');
        if (!token || !userId) {
            Swal.fire({
                icon: 'warning',
                title: 'Authentication Required',
                text: 'Please log in to join meetings',
                confirmButtonText: 'OK'
            });
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
            const normalizedMeeting = {
                date: meeting.date || meeting.Date || meeting.meetingDate || meeting.MeetingDate,
                startTime: meeting.startTime || meeting.StartTime,
                endTime: meeting.endTime || meeting.EndTime
            };

            const status = getMeetingStatus(normalizedMeeting);
            if (status !== 'active') {
                Swal.fire({
                    icon: 'info',
                    title: 'Meeting Not Available',
                    text: `Meeting is ${status === 'not_started' ? 'not started yet' : 'already ended'}`,
                    confirmButtonText: 'OK'
                });
                return;
            }

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
                Swal.fire({
                    icon: 'warning',
                    title: 'Access Denied',
                    text: 'You are not registered for this meeting',
                    confirmButtonText: 'OK'
                });
                return;
            }

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
            Swal.fire({
                icon: 'error',
                title: 'Join Meeting Error',
                text: err.message,
                confirmButtonText: 'OK'
            });
        }
    };

    const handleDeleteMeeting = async (meetingId) => {
        const token = localStorage.getItem('accessToken');
        if (!token || !userId) {
            Swal.fire({
                icon: 'warning',
                title: 'Authentication Required',
                text: 'Please log in to delete meetings',
                confirmButtonText: 'OK'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this meeting? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            // Get meeting details first
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
                throw new Error('Failed to verify meeting details');
            }

            const meeting = await meetingRes.json();
            if (parseInt(meeting.userId || meeting.UserId) !== parseInt(userId)) {
                throw new Error('Only the meeting organizer can delete this meeting');
            }

            // Show loading state for email sending
            Swal.fire({
                title: 'Processing...',
                html: 'Deleting meeting and notifying attendees...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const roomInfo =
                meeting.room?.roomNumber && meeting.room?.location
                    ? `Room ${meeting.room.roomNumber} - ${meeting.room.location}`
                    : meeting.room?.roomNumber
                        ? `Room ${meeting.room.roomNumber}`
                        : meeting.room?.location
                            ? meeting.room.location
                            : `Room ID: ${meeting.roomId || meeting.RoomId}`;

            // Send cancellation emails before deleting
            const emailsSent = await sendCancellationEmails(
                meetingId,
                meeting.title || meeting.Title || 'Untitled',
                meeting.date || meeting.Date || meeting.meetingDate || meeting.MeetingDate,
                meeting.startTime || meeting.StartTime,
                meeting.endTime || meeting.EndTime,
                roomInfo
            );

            // Delete attendees
            const deleteAttendeesRes = await fetch(
                `https://localhost:7175/api/MeetingAttendees/delete-for-meeting/${meetingId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                }
            );

            if (!deleteAttendeesRes.ok) {
                throw new Error('Failed to delete meeting attendees');
            }

            // Delete the meeting
            const deleteMeetingRes = await fetch(
                `https://localhost:7175/api/Meetings/${meetingId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                }
            );

            if (!deleteMeetingRes.ok) {
                throw new Error('Failed to delete meeting');
            }

            // Update both meetings and notifications state
            setMeetings(prev => prev.filter(m => (m.id || m.Id) !== meetingId));
            setNotifications(prev => prev.filter(n => {
                const notificationMeetingId = n.meetingId || n.MeetingId;
                return notificationMeetingId !== meetingId;
            }));

            // Update attendee notification status
            setAttendeeNotificationStatus(prev => {
                const newStatus = { ...prev };
                delete newStatus[meetingId];
                return newStatus;
            });

            Swal.fire({
                icon: emailsSent ? 'success' : 'warning',
                title: emailsSent ? 'Deleted!' : 'Deleted with warnings',
                text: emailsSent
                    ? 'Meeting deleted and all attendees notified.'
                    : 'Meeting deleted but some attendees may not have been notified.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Error deleting meeting:', err);
            Swal.fire({
                icon: 'error',
                title: 'Delete Error',
                text: err.message,
                confirmButtonText: 'OK'
            });
        }
    };

    const handleViewNotification = async (notificationId) => {
        try {
            const response = await fetch(
                `https://localhost:7175/api/Notifications/mark-as-read/${notificationId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to mark as read');
            }

            // Update UI state
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                )
            );
        } catch (err) {
            console.error('Error:', err);
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

            // Update local state
            setFormData(tempFormData);
            setIsEditing(false);
            setError(null);

            // Dispatch event to notify Sidebar and other components
            window.dispatchEvent(new CustomEvent('profileUpdated', {
                detail: {
                    firstName: tempFormData.firstName,
                    lastName: tempFormData.lastName,
                    email: tempFormData.email,
                }
            }));

            // Show success notification
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Profile updated successfully',
                timer: 1500,
                showConfirmButton: false,
                didClose: () => {
                    window.dispatchEvent(new Event('storage'));
                }
            });

        } catch (err) {
            setError(err.message || 'Failed to save changes');
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: err.message || 'Could not update profile',
                confirmButtonText: 'OK'
            });
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

    // Check if user has any meetings where they are the organizer
    const hasOrganizerMeetings = Object.keys(attendeeNotificationStatus).length > 0;

    if (loading) return (
        <div className={`profile-page ${isMobile ? 'mobile' : 'desktop'}`}>
            <div className="profile-container">
                <div className="loading-spinner"></div>
                <p>Loading profile information...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className={`profile-page ${isMobile ? 'mobile' : 'desktop'}`}>
            <div className="profile-container">
                <p className="error-message">{error}</p>
                <button className="btn btn-retry" onClick={() => window.location.reload()}>
                    Retry
                </button>
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
                                        <button onClick={handleSave} className="btn btn-save" disabled={loading}>
                                            {loading ? 'Saving...' : (
                                                <>
                                                    <Save size={18} /> Save
                                                </>
                                            )}
                                        </button>
                                        <button onClick={handleCancel} className="btn btn-cancel">
                                            <X size={18} /> Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="profile-avatar">
                                <div className="avatar-circle">{initials}</div>
                                {isSendingEmails && (
                                    <div className="email-sending-indicator">
                                        Sending notifications...
                                    </div>
                                )}
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
                                        const meetingId = meeting.id || meeting.Id;
                                        const title = meeting.title || meeting.Title || 'Untitled Meeting';
                                        const date = meeting.date || meeting.Date || meeting.meetingDate || meeting.MeetingDate;
                                        const startTime = meeting.startTime || meeting.StartTime;
                                        const endTime = meeting.endTime || meeting.EndTime;
                                        const meetingUserId = meeting.userId || meeting.UserId;

                                        const status = getMeetingStatus({ date, startTime, endTime });
                                        const isOrganizer = parseInt(meetingUserId) === parseInt(userId);

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
                                                        {isOrganizer && (
                                                            <div className="info-group">
                                                                <span className="info-label">Role</span>
                                                                <span className="info-value organizer">Organizer</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="meeting-actions">
                                                        <button
                                                            onClick={() => handleJoin(meetingId)}
                                                            className={`btn ${status === 'active' ? 'btn-join' : 'btn-join-ended'}`}
                                                        >
                                                            <Video size={16} />
                                                            {status === 'active' ? 'Join Now' :
                                                                status === 'not_started' ? 'Not Started' : 'Join (Meeting Ended)'}
                                                        </button>
                                                        {isOrganizer && status === 'not_started' && (
                                                            <button
                                                                onClick={() => handleDeleteMeeting(meetingId)}
                                                                className="btn btn-delete"
                                                                title="Delete Meeting"
                                                                disabled={isSendingEmails}
                                                            >
                                                                <Trash2 size={16} />
                                                                {isSendingEmails ? 'Processing...' : 'Delete'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <br />
                        <div className="profile-card notifications-card">
                            <h2>
                                <Bell size={20} style={{ marginRight: '10px' }} />
                                Your Notifications
                            </h2>
                            {notifications.length === 0 ? (
                                <p className="no-notifications">You have no notifications.</p>
                            ) : (
                                <div className="notifications-list">
                                    {notifications.map(notification => {
                                        const isRead = notification.isRead || notification.IsRead;
                                        const notificationId = notification.id || notification.Id;
                                        const eventType = notification.eventType || notification.EventType;
                                        const eventDescription = notification.eventDescription || notification.EventDescription;
                                        const createdAt = notification.createdAt || notification.CreatedAt;
                                        const meetingId = notification.meetingId || notification.MeetingId;

                                        return (
                                            <div key={notificationId} className={`notification-item ${isRead ? 'read' : 'unread'}`}>
                                                <div className="notification-content">
                                                    <h3 className="notification-type">{eventType}</h3>
                                                    <p className="notification-description">{eventDescription}</p>
                                                    <div className="notification-meta">
                                                        <span className="notification-date">{formatDate(createdAt)}</span>
                                                        <span className={`notification-status ${isRead ? 'read' : 'unread'}`}>
                                                            {isRead ? 'Read' : 'Unread'}
                                                        </span>
                                                    </div>

                                                    {/* Attendee status section for meeting organizers */}
                                                    {meetingId && attendeeNotificationStatus[meetingId] && (
                                                        <div className="attendee-status-section">
                                                            <h4>
                                                                <Users size={16} style={{ marginRight: '8px' }} />
                                                                Attendee Status
                                                            </h4>
                                                            {loadingAttendeeStatus ? (
                                                                <div className="loading-spinner small"></div>
                                                            ) : (
                                                                <div className="attendee-status-list">
                                                                    {attendeeNotificationStatus[meetingId].attendees.map(attendee => (
                                                                        <div key={attendee.userId} className="attendee-status-item">
                                                                            <div className="attendee-info">
                                                                                <span className="attendee-name">
                                                                                    {attendee.firstName} {attendee.lastName}
                                                                                </span>
                                                                                <span className="attendee-email">{attendee.email}</span>
                                                                            </div>
                                                                            <div className="attendee-notification-status">
                                                                                {attendee.hasNotification ? (
                                                                                    attendee.notificationRead ? (
                                                                                        <span className="status-badge seen">
                                                                                            <CheckCircle size={14} /> Seen
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="status-badge not-seen">
                                                                                            <Clock size={14} /> Not seen
                                                                                        </span>
                                                                                    )
                                                                                ) : (
                                                                                    <span className="status-badge no-notification">
                                                                                        No notification
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="notification-actions">
                                                    <button
                                                        onClick={() => !isRead && handleViewNotification(notificationId)}
                                                        className={`btn btn-view ${isRead ? 'disabled' : ''}`}
                                                        disabled={isRead}
                                                    >
                                                        <Eye size={16} /> View
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