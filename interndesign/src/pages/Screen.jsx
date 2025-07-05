import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Mic, MicOff, Video, VideoOff,
    Hand, Phone, Users, Maximize, Minimize, X,
    MessageSquare, Share2, Monitor
} from 'lucide-react';
import '../styles/Screen.scss';

const Screen = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { meetingId, userId } = location.state || {};

    // Meeting state
    const [attendees, setAttendees] = useState([]);
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOrganizer, setIsOrganizer] = useState(false);

    // Media state
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [mediaError, setMediaError] = useState(null);

    // UI state
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    // WebRTC state
    const [peerConnections, setPeerConnections] = useState({});
    const [remoteStreams, setRemoteStreams] = useState({});
    const [signalingChannel, setSignalingChannel] = useState(null);

    // Refs
    const localVideoRef = useRef(null);
    const screenShareRef = useRef(null);
    const localStreamRef = useRef(null);
    const pollIntervalRef = useRef(null);
    const hasJoinedRef = useRef(false);

    // WebRTC Configuration
    const pcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // Add TURN servers here if needed
        ]
    };

    // Initialize WebSocket signaling channel
    const setupSignalingChannel = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Signaling channel connected');
            ws.send(JSON.stringify({
                type: 'join',
                meetingId,
                userId
            }));
        };

        ws.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'offer':
                    await handleOffer(message);
                    break;
                case 'answer':
                    await handleAnswer(message);
                    break;
                case 'ice-candidate':
                    await handleIceCandidate(message);
                    break;
                case 'user-joined':
                    handleUserJoined(message);
                    await createOffer(message.userId);
                    break;
                case 'user-left':
                    handleUserLeft(message);
                    break;
                case 'media-update':
                    handleMediaUpdate(message);
                    break;
                default:
                    console.warn('Unknown message type:', message.type);
            }
        };

        ws.onclose = () => {
            console.log('Signaling channel disconnected');
            setTimeout(() => {
                if (!hasJoinedRef.current) return;
                setSignalingChannel(setupSignalingChannel());
            }, 3000);
        };

        ws.onerror = (error) => {
            console.error('Signaling channel error:', error);
        };

        setSignalingChannel(ws);
        return ws;
    };

    // Create a new peer connection
    const createPeerConnection = (remoteUserId) => {
        const pc = new RTCPeerConnection(pcConfig);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                signalingChannel?.send(JSON.stringify({
                    type: 'ice-candidate',
                    meetingId,
                    toUserId: remoteUserId,
                    candidate: event.candidate
                }));
            }
        };

        pc.ontrack = (event) => {
            if (event.streams && event.streams.length > 0) {
                setRemoteStreams(prev => ({
                    ...prev,
                    [remoteUserId]: event.streams[0]
                }));
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${remoteUserId}:`, pc.connectionState);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                handleUserLeft({ userId: remoteUserId });
            }
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        return pc;
    };

    // Handle incoming offer
    const handleOffer = async (message) => {
        const { fromUserId, offer } = message;
        const pc = createPeerConnection(fromUserId);

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            signalingChannel?.send(JSON.stringify({
                type: 'answer',
                meetingId,
                toUserId: fromUserId,
                answer,
                fromUserId: userId
            }));

            setPeerConnections(prev => ({ ...prev, [fromUserId]: pc }));
        } catch (err) {
            console.error('Error handling offer:', err);
        }
    };

    // Handle incoming answer
    const handleAnswer = async (message) => {
        const { fromUserId, answer } = message;
        const pc = peerConnections[fromUserId];
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (err) {
                console.error('Error setting remote description:', err);
            }
        }
    };

    // Handle ICE candidate
    const handleIceCandidate = async (message) => {
        const { fromUserId, candidate } = message;
        const pc = peerConnections[fromUserId];
        if (pc && candidate) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error('Error adding ICE candidate:', err);
            }
        }
    };

    // Handle user joined event
    const handleUserJoined = (message) => {
        console.log(`User ${message.userId} joined the meeting`);
        fetchAttendees();
    };

    // Handle media update event
    const handleMediaUpdate = (message) => {
        const { userId: updatedUserId, hasVideo, hasAudio } = message;
        setAttendees(prev => prev.map(attendee =>
            attendee.userId === updatedUserId
                ? { ...attendee, hasVideo, hasAudio }
                : attendee
        ));
    };

    // Handle user left event
    const handleUserLeft = (message) => {
        const { userId: leftUserId } = message;
        if (peerConnections[leftUserId]) {
            peerConnections[leftUserId].close();
            setPeerConnections(prev => {
                const newPCs = { ...prev };
                delete newPCs[leftUserId];
                return newPCs;
            });
        }

        setRemoteStreams(prev => {
            const newStreams = { ...prev };
            delete newStreams[leftUserId];
            return newStreams;
        });

        setAttendees(prev => prev.filter(attendee => attendee.userId !== leftUserId));
    };

    // Initialize media devices
    const initializeMedia = async () => {
        try {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }

            if (isAudioEnabled || isVideoEnabled) {
                const constraints = {
                    audio: isAudioEnabled,
                    video: isVideoEnabled ? {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user'
                    } : false
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                localStreamRef.current = stream;

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = isVideoEnabled ? stream : null;
                    if (isVideoEnabled) {
                        localVideoRef.current.onloadedmetadata = () => {
                            localVideoRef.current.play().catch(err => {
                                console.error("Error playing video:", err);
                                setMediaError("Couldn't start video playback");
                            });
                        };
                    }
                }

                // Update all peer connections with new stream
                Object.entries(peerConnections).forEach(([userId, pc]) => {
                    pc.getSenders().forEach(sender => {
                        if (sender.track) pc.removeTrack(sender);
                    });
                    stream.getTracks().forEach(track => {
                        pc.addTrack(track, stream);
                    });
                });

                // Notify others about media change
                if (signalingChannel?.readyState === WebSocket.OPEN) {
                    signalingChannel.send(JSON.stringify({
                        type: 'media-update',
                        meetingId,
                        userId,
                        hasVideo: isVideoEnabled,
                        hasAudio: isAudioEnabled
                    }));
                }
            } else {
                localStreamRef.current = null;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = null;
                }

                if (signalingChannel?.readyState === WebSocket.OPEN) {
                    signalingChannel.send(JSON.stringify({
                        type: 'media-update',
                        meetingId,
                        userId,
                        hasVideo: false,
                        hasAudio: false
                    }));
                }
            }
        } catch (err) {
            console.error('Media initialization error:', err);
            setMediaError(err.message);
        }
    };

    // Toggle screen sharing
    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            if (screenShareRef.current?.srcObject) {
                screenShareRef.current.srcObject.getTracks().forEach(track => track.stop());
                screenShareRef.current.srcObject = null;
            }
            setIsScreenSharing(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ 
                    video: true,
                    audio: true 
                });
                
                if (screenShareRef.current) {
                    screenShareRef.current.srcObject = stream;
                }
                
                stream.getVideoTracks()[0].onended = () => {
                    setIsScreenSharing(false);
                };
                
                setIsScreenSharing(true);
            } catch (err) {
                console.error('Screen share error:', err);
            }
        }
    };

    // Update attendee status on server
    const updateAttendeeStatus = async (updates) => {
        try {
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`https://localhost:7175/api/MeetingAttendees/update-status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    meetingId: meetingId,
                    userId: userId,
                    ...updates
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to update attendee status (${response.status})`);
            }
        } catch (err) {
            console.error('Error updating attendee status:', err);
        }
    };

    // Join meeting function
    const joinMeeting = async () => {
        if (hasJoinedRef.current) return;

        try {
            const token = localStorage.getItem('accessToken');

            await fetch(`https://localhost:7175/api/MeetingAttendees/join`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    meetingId: meetingId,
                    userId: userId,
                    hasAudio: isAudioEnabled,
                    hasVideo: isVideoEnabled,
                    isHandRaised: isHandRaised,
                    role: isOrganizer ? "Organizer" : "Participant"
                })
            });

            hasJoinedRef.current = true;
        } catch (err) {
            console.error('Error joining meeting:', err);
        }
    };

    // Fetch attendees data + user profiles
    const fetchAttendees = async () => {
        try {
            const token = localStorage.getItem('accessToken');

            // Fetch attendees
            const attendeesResponse = await fetch(`https://localhost:7175/api/MeetingAttendees?meetingId=${meetingId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!attendeesResponse.ok) {
                throw new Error(`Failed to fetch attendees (${attendeesResponse.status})`);
            }

            const attendeesData = await attendeesResponse.json();

            // Extract unique userIds
            const userIds = [...new Set(attendeesData.map(a => a.userId))];

            // Fetch user profiles
            const usersResponse = await fetch(`https://localhost:7175/api/Users?ids=${userIds.join(',')}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!usersResponse.ok) {
                throw new Error(`Failed to fetch user profiles (${usersResponse.status})`);
            }

            const usersData = await usersResponse.json();

            // Merge user profiles into attendees
            const attendeesWithNames = attendeesData.map(attendee => {
                const user = usersData.find(u => u.id === attendee.userId);
                return {
                    ...attendee,
                    firstName: user?.firstName || '',
                    lastName: user?.lastName || '',
                };
            });

            // Get most recent status for each user
            const latestAttendeesMap = new Map();
            attendeesWithNames.forEach(attendee => {
                const existing = latestAttendeesMap.get(attendee.userId);
                if (!existing || 
                    new Date(attendee.updatedAt || attendee.createdAt) > new Date(existing.updatedAt || existing.createdAt)) {
                    latestAttendeesMap.set(attendee.userId, attendee);
                }
            });

            // Filter active attendees
            const activeAttendees = Array.from(latestAttendeesMap.values())
                .filter(attendee => {
                    const isNotCurrentUser = String(attendee.userId) !== String(userId);
                    const isActive = ['Present', 'Joined'].includes(attendee.attendanceStatus);
                    const hasNotLeft = !['Left', 'Disconnected'].includes(attendee.attendanceStatus);
                    return isNotCurrentUser && isActive && hasNotLeft;
                });

            setAttendees(activeAttendees);
        } catch (err) {
            console.error('Error fetching attendees:', err);
        }
    };

    // Fetch meeting data
    useEffect(() => {
        const fetchMeetingData = async () => {
            if (!meetingId || !userId) {
                setError('Missing meeting or user information');
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem('accessToken');

                // Fetch meeting details
                const meetingResponse = await fetch(`https://localhost:7175/api/Meetings/${meetingId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!meetingResponse.ok) {
                    throw new Error(`Failed to fetch meeting details (${meetingResponse.status})`);
                }

                const meetingData = await meetingResponse.json();
                setMeeting(meetingData);
                setIsOrganizer(meetingData.userId === userId);

                await joinMeeting();
                await fetchAttendees();
                setupSignalingChannel();
                await initializeMedia();

                setLoading(false);
            } catch (err) {
                console.error('Meeting data error:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchMeetingData();
    }, [meetingId, userId]);

    // Poll for attendees updates
    useEffect(() => {
        if (!loading && !error) {
            pollIntervalRef.current = setInterval(fetchAttendees, 3000);
            return () => clearInterval(pollIntervalRef.current);
        }
    }, [loading, error]);

    // Initialize media when state changes
    useEffect(() => {
        initializeMedia();
    }, [isVideoEnabled, isAudioEnabled]);

    // Cleanup
    useEffect(() => {
        return () => {
            Object.values(peerConnections).forEach(pc => pc.close());
            if (signalingChannel) signalingChannel.close();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (screenShareRef.current?.srcObject) {
                screenShareRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, []);

    // Fullscreen handling
    const toggleFullScreen = () => {
        if (!isFullScreen) {
            document.documentElement.requestFullscreen?.().then(() => {
                setIsFullScreen(true);
            });
        } else {
            document.exitFullscreen?.().then(() => {
                setIsFullScreen(false);
            });
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Control functions
    const toggleAudio = async () => {
        const newAudioState = !isAudioEnabled;
        setIsAudioEnabled(newAudioState);
        await updateAttendeeStatus({
            hasAudio: newAudioState,
            hasVideo: isVideoEnabled,
            isHandRaised: isHandRaised
        });
        await initializeMedia();
    };

    const toggleVideo = async () => {
        const newVideoState = !isVideoEnabled;
        setIsVideoEnabled(newVideoState);
        await updateAttendeeStatus({
            hasAudio: isAudioEnabled,
            hasVideo: newVideoState,
            isHandRaised: isHandRaised
        });
        await initializeMedia();
    };

    const toggleHandRaise = async () => {
        const newHandRaiseState = !isHandRaised;
        setIsHandRaised(newHandRaiseState);
        await updateAttendeeStatus({
            hasAudio: isAudioEnabled,
            hasVideo: isVideoEnabled,
            isHandRaised: newHandRaiseState
        });
    };

    const sendChatMessage = () => {
        if (newMessage.trim()) {
            setChatMessages([...chatMessages, {
                id: Date.now(),
                senderId: userId,
                text: newMessage,
                timestamp: new Date().toISOString(),
                senderName: 'You'
            }]);
            setNewMessage('');
        }
    };

    const leaveMeeting = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`https://localhost:7175/api/MeetingAttendees/leave`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    meetingId: meetingId,
                    userId: userId
                })
            });

            // Cleanup
            Object.values(peerConnections).forEach(pc => pc.close());
            if (signalingChannel) signalingChannel.close();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (screenShareRef.current?.srcObject) {
                screenShareRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

            navigate('/');
        } catch (err) {
            console.error('Error leaving meeting:', err);
            navigate('/');
        }
    };

    if (loading) {
        return (
            <div className="screen-loading">
                <div className="loading-spinner"></div>
                <p>Joining meeting...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="screen-error">
                <p className="error-message">{error}</p>
                <button onClick={() => navigate('/')} className="error-button">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className={`screen-container ${isFullScreen ? 'fullscreen' : ''}`}>
            <header className="meeting-header">
                <div className="meeting-info">
                    <h1>{meeting?.title || `Meeting: ${meetingId}`}</h1>
                    <span className="participant-count">
                        {attendees.length + 1} participant{attendees.length !== 0 ? 's' : ''}
                    </span>
                    {isOrganizer && <span className="organizer-badge">Organizer</span>}
                </div>
                <div className="header-controls">
                    <button
                        onClick={() => setShowParticipants(!showParticipants)}
                        className={`control-button ${showParticipants ? 'active' : ''}`}
                        title="Participants"
                    >
                        <Users size={20} />
                    </button>
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`control-button ${showChat ? 'active' : ''}`}
                        title="Chat"
                    >
                        <MessageSquare size={20} />
                    </button>
                    <button onClick={toggleFullScreen} className="fullscreen-button">
                        {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                </div>
            </header>

            <main className="meeting-content">
                <div className="video-grid">
                    {isScreenSharing ? (
                        <div className="screen-share-container">
                            <video
                                ref={screenShareRef}
                                autoPlay
                                playsInline
                                className="screen-share-video"
                            />
                            <div className="local-video-overlay">
                                {isVideoEnabled ? (
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="video-element"
                                    />
                                ) : (
                                    <div className="video-placeholder">
                                        <div className="user-avatar">YOU</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="video-tile local-video">
                                {isVideoEnabled ? (
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="video-element"
                                    />
                                ) : (
                                    <div className="video-placeholder">
                                        <div className="user-avatar">YOU</div>
                                    </div>
                                )}
                                <div className="video-overlay">
                                    <span className="user-name">
                                        You {isHandRaised && '🙋'}
                                    </span>
                                    <div className="media-status">
                                        {!isAudioEnabled && <MicOff size={16} />}
                                        {!isVideoEnabled && <VideoOff size={16} />}
                                    </div>
                                </div>
                                {mediaError && (
                                    <div className="media-error">
                                        <small>{mediaError}</small>
                                    </div>
                                )}
                            </div>

                            {attendees.map(attendee => {
                                const remoteStream = remoteStreams[attendee.userId];
                                const hasVideo = remoteStream && attendee.hasVideo;

                                return (
                                    <div key={attendee.id} className="video-tile">
                                        {hasVideo ? (
                                            <video
                                                ref={el => {
                                                    if (el && remoteStream) {
                                                        el.srcObject = remoteStream;
                                                        el.onloadedmetadata = () => el.play().catch(console.error);
                                                    }
                                                }}
                                                autoPlay
                                                playsInline
                                                className="video-element"
                                            />
                                        ) : (
                                            <div className="video-placeholder">
                                                <div className="user-avatar">
                                                    {`${attendee.firstName?.[0] || ''}${attendee.lastName?.[0] || ''}`.toUpperCase() || '??'}
                                                </div>
                                            </div>
                                        )}
                                        <div className="video-overlay">
                                            <span className="user-name">
                                                {attendee.firstName} {attendee.lastName} {attendee.isHandRaised && '🙋'}
                                            </span>
                                            <div className="media-status">
                                                {!attendee.hasAudio && <MicOff size={16} />}
                                                {!attendee.hasVideo && <VideoOff size={16} />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {showParticipants && (
                    <aside className="side-panel participants-panel">
                        <div className="panel-header">
                            <h3>Participants ({attendees.length + 1})</h3>
                            <button
                                onClick={() => setShowParticipants(false)}
                                className="close-panel"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="participants-container">
                            <div className="participant-item current-user">
                                <div className="participant-info">
                                    <span className="participant-name">You</span>
                                    <div className="participant-status">
                                        {!isAudioEnabled && <MicOff size={14} />}
                                        {!isVideoEnabled && <VideoOff size={14} />}
                                        {isHandRaised && <span className="hand-raised">🙋</span>}
                                    </div>
                                </div>
                            </div>
                            {attendees.map(attendee => (
                                <div key={attendee.id} className="participant-item">
                                    <div className="participant-info">
                                        <span className="participant-name">
                                            {attendee.firstName} {attendee.lastName}
                                        </span>
                                        <div className="participant-status">
                                            {!attendee.hasAudio && <MicOff size={14} />}
                                            {!attendee.hasVideo && <VideoOff size={14} />}
                                            {attendee.isHandRaised && <span className="hand-raised">🙋</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}

                {showChat && (
                    <aside className="side-panel chat-panel">
                        <div className="panel-header">
                            <h3>Meeting Chat</h3>
                            <button
                                onClick={() => setShowChat(false)}
                                className="close-panel"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="chat-messages">
                            {chatMessages.length === 0 ? (
                                <p className="no-messages">No messages yet</p>
                            ) : (
                                chatMessages.map(message => (
                                    <div key={message.id} className="message">
                                        <div className="message-sender">
                                            {message.senderName || 'You'}:
                                        </div>
                                        <div className="message-text">{message.text}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="chat-input">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                            />
                            <button onClick={sendChatMessage}>Send</button>
                        </div>
                    </aside>
                )}
            </main>

            <footer className="meeting-footer">
                <button
                    onClick={toggleAudio}
                    className={`control-button ${isAudioEnabled ? 'active' : 'inactive'}`}
                    title={isAudioEnabled ? 'Mute' : 'Unmute'}
                >
                    {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <button
                    onClick={toggleVideo}
                    className={`control-button ${isVideoEnabled ? 'active' : 'inactive'}`}
                    title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
                >
                    {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
                <button
                    onClick={toggleScreenShare}
                    className={`control-button ${isScreenSharing ? 'active' : ''}`}
                    title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                >
                    <Share2 size={20} />
                </button>
                <button
                    onClick={toggleHandRaise}
                    className={`control-button ${isHandRaised ? 'raised active' : ''}`}
                    title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
                >
                    <Hand size={20} />
                </button>
                <button
                    className="control-button"
                    title="More Options"
                >
                    ⋯
                </button>
                <button
                    onClick={leaveMeeting}
                    className="control-button leave-button"
                    title="Leave Meeting"
                >
                    <Phone size={20} />
                </button>
            </footer>
        </div>
    );
};

export default Screen;