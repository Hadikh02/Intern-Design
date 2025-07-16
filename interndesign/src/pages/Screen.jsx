import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { List, ClipboardList, X, Check, Plus, User, ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import '../styles/Screen.scss';

const Screen = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { meetingId, userId } = location.state || {};

    // Meeting state
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [isOrganizer, setIsOrganizer] = useState(false);

    // UI state
    const [activeTab, setActiveTab] = useState('agenda');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        Topic: '',
        Description: '',
        TimeAllocation: '',
        Status: 'Pending',
        AssignAction: '',
        DueDate: '',
        MeetingAttendeeId: ''
    });
    const [agendaItems, setAgendaItems] = useState([]);
    const [actionItems, setActionItems] = useState([]);
    const [expandedAgendaItem, setExpandedAgendaItem] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

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
                setIsOrganizer(meetingData.userId === parseInt(userId));

                // Fetch attendees
                const attendeesResponse = await fetch(`https://localhost:7175/api/MeetingAttendees?meetingId=${meetingId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!attendeesResponse.ok) {
                    throw new Error(`Failed to fetch attendees (${attendeesResponse.status})`);
                }

                const attendeesData = await attendeesResponse.json();

                // Fetch user details for each attendee
                const userIds = attendeesData.map(a => a.userId);
                const usersResponse = await fetch(`https://localhost:7175/api/Users?ids=${userIds.join(',')}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!usersResponse.ok) {
                    throw new Error(`Failed to fetch user details (${usersResponse.status})`);
                }

                const usersData = await usersResponse.json();

                // Merge attendee data with user details
                const attendeesWithUserData = attendeesData.map(attendee => {
                    const user = usersData.find(u => u.id === attendee.userId);
                    return {
                        ...attendee,
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        email: user?.email || ''
                    };
                });

                setAttendees(attendeesWithUserData);

                // Fetch agenda items
                const agendaResponse = await fetch(`https://localhost:7175/api/Agenda?meetingId=${meetingId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (agendaResponse.ok) {
                    const agendaData = await agendaResponse.json();
                    // Sort by ItemNumber
                    setAgendaItems(agendaData.sort((a, b) => {
                        const aNum = parseInt(a.ItemNumber) || 0;
                        const bNum = parseInt(b.ItemNumber) || 0;
                        return aNum - bNum;
                    }));
                }

                // Fetch action items
                const actionsResponse = await fetch(`https://localhost:7175/api/Minutes?meetingId=${meetingId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (actionsResponse.ok) {
                    const actionsData = await actionsResponse.json();

                    // Filter action items based on user role
                    if (meetingData.userId === parseInt(userId)) {
                        // If user is organizer, show all action items
                        setActionItems(actionsData);
                    } else {
                        // If user is attendee, show only actions assigned to them
                        const currentAttendee = attendeesWithUserData.find(a => a.userId === parseInt(userId));
                        if (currentAttendee) {
                            setActionItems(actionsData.filter(item => item.meetingAttendeeId === currentAttendee.id));
                        } else {
                            setActionItems([]);
                        }
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Meeting data error:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchMeetingData();
    }, [meetingId, userId]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const token = localStorage.getItem('accessToken');
            let url, method, payload;

            if (activeTab === 'agenda') {
                // Validate agenda form
                if (!formData.Topic.trim()) {
                    setError('Topic is required');
                    return;
                }
                if (!formData.Description.trim()) {
                    setError('Description is required');
                    return;
                }
                if (!formData.TimeAllocation || parseInt(formData.TimeAllocation) <= 0) {
                    setError('Time allocation must be greater than 0');
                    return;
                }

                url = editingItem
                    ? `https://localhost:7175/api/Agenda/${editingItem.id}`
                    : 'https://localhost:7175/api/Agenda';
                method = editingItem ? 'PUT' : 'POST';

                payload = {
                    topic: formData.Topic.trim(),
                    description: formData.Description.trim(),
                    timeAllocation: parseInt(formData.TimeAllocation),
                    status: formData.Status,
                    meetingId: parseInt(meetingId)
                };

                if (editingItem) {
                    payload.id = editingItem.id;
                    payload.itemNumber = editingItem.itemNumber || editingItem.ItemNumber;
                } else {
                    const nextItemNumber = agendaItems.length > 0
                        ? String(Math.max(...agendaItems.map(item => parseInt(item.ItemNumber) || 0)) + 1)
                        : '1';
                    payload.itemNumber = nextItemNumber;
                }
            } else {
                // Validate action form
                if (!formData.AssignAction.trim()) {
                    setError('Action description is required');
                    return;
                }
                if (!formData.DueDate || isNaN(Date.parse(formData.DueDate))) {
                    setError('Due date is missing or invalid');
                    return;
                }

                if (!formData.MeetingAttendeeId) {
                    setError('Please select an attendee');
                    return;
                }

                // Check if organizer is trying to assign to themselves
                const selectedAttendee = attendees.find(a => a.id === parseInt(formData.MeetingAttendeeId));
                if (selectedAttendee && selectedAttendee.userId === parseInt(userId)) {
                    setError('Organizer cannot assign actions to themselves');
                    return;
                }

                // Validate date
                const dueDateParsed = new Date(formData.DueDate);
                if (isNaN(dueDateParsed.getTime()) || dueDateParsed < new Date('1753-01-01')) {
                    setError('Due date is invalid or out of range (must be after 1753)');
                    return;
                }

                url = editingItem
                    ? `https://localhost:7175/api/Minutes/${editingItem.id}`
                    : 'https://localhost:7175/api/Minutes';
                method = editingItem ? 'PUT' : 'POST';

                payload = {
                    assignAction: formData.AssignAction.trim(),
                    dueDate: dueDateParsed.toISOString(),
                    meetingAttendeeId: parseInt(formData.MeetingAttendeeId),
                    meetingId: parseInt(meetingId)
                };

                if (editingItem) {
                    payload.id = editingItem.id;
                }
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Server error: ${response.status}`);
            }

            // Only parse JSON if response has content
            const responseText = await response.text();
            let result = null;
            if (responseText) {
                try {
                    result = JSON.parse(responseText);
                } catch (parseError) {
                    throw new Error('Invalid server response format');
                }
            }
            if (!result) {
                result = {
                    ...payload,
                    id: editingItem?.id || Math.max(...agendaItems.map(i => i?.id || 0), 0) + 1
                };
            }

            // Update state based on active tab
            if (activeTab === 'agenda') {
                setAgendaItems(prevItems => {
                    if (editingItem) {
                        return prevItems.map(item =>
                            item.id === result.id ? { ...item, ...result } : item
                        );
                    } else {
                        const newItems = [...prevItems, result];
                        return newItems.sort((a, b) => {
                            const aNum = parseInt(a.ItemNumber || a.itemNumber) || 0;
                            const bNum = parseInt(b.ItemNumber || b.itemNumber) || 0;
                            return aNum - bNum;
                        });
                    }
                });
            } else {
                setActionItems(prevItems => {
                    if (editingItem) {
                        return prevItems.map(item =>
                            item.id === result.id ? { ...item, ...result } : item
                        );
                    } else {
                        return [...prevItems, result];
                    }
                });
            }

            // Reset form
            setShowForm(false);
            setEditingItem(null);
            setFormData({
                Topic: '',
                Description: '',
                TimeAllocation: '',
                Status: 'Pending',
                AssignAction: '',
                DueDate: '',
                MeetingAttendeeId: ''
            });

        } catch (err) {
            console.error('Error submitting form:', err);
            setError(err.message || 'An unexpected error occurred');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const toggleAgendaItem = (itemId) => {
        setExpandedAgendaItem(expandedAgendaItem === itemId ? null : itemId);
    };

    const handleEditItem = (item) => {
        if (activeTab === 'agenda') {
            setFormData({
                Topic: item.topic || item.Topic,
                Description: item.description || item.Description,
                TimeAllocation: item.timeAllocation || item.TimeAllocation,
                Status: item.status || item.Status,
                AssignAction: '',
                DueDate: '',
                MeetingAttendeeId: ''
            });
            setEditingItem(item);
            setShowForm(true);
        } else {
            // Existing action items handling
            let dueDate = '';
            if (item.dueDate || item.DueDate) {
                const dateObj = new Date(item.dueDate || item.DueDate);
                if (!isNaN(dateObj.getTime())) {
                    dueDate = dateObj.toISOString().split('T')[0];
                }
            }

            setFormData({
                Topic: '',
                Description: '',
                TimeAllocation: '',
                Status: 'Pending',
                AssignAction: item.assignAction || item.AssignAction,
                DueDate: dueDate,
                MeetingAttendeeId: item.meetingAttendeeId || item.MeetingAttendeeId
            });
            setEditingItem(item);
            setShowForm(true);
        }
    };

    const handleDeleteItem = async (itemId) => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('Authentication token missing');
            }

            const endpoint = activeTab === 'agenda'
                ? `https://localhost:7175/api/Agenda/${itemId}`
                : `https://localhost:7175/api/Minutes/${itemId}`;

            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to delete item');
            }

            if (activeTab === 'agenda') {
                setAgendaItems(prev => prev.filter(item => item.id !== itemId));
            } else {
                setActionItems(prev => prev.filter(item => item.id !== itemId));
            }
        } catch (err) {
            console.error('Error deleting item:', err);
            setError(err.message || 'Failed to delete item');
        }
    };

    const renderForm = () => {
        if (activeTab === 'agenda') {
            return (
                <div className="form-container">
                    <form onSubmit={handleFormSubmit} className="organizer-form">
                        <h3>{editingItem ? 'Edit Agenda Item' : 'Add Agenda Item'}</h3>
                        {error && <div className="error-message">{error}</div>}
                        <div className="form-group">
                            <label>Topic *</label>
                            <input
                                type="text"
                                name="Topic"
                                value={formData.Topic}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter topic title"
                            />
                        </div>
                        <div className="form-group">
                            <label>Description *</label>
                            <textarea
                                name="Description"
                                value={formData.Description}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter detailed description"
                                rows="4"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Time Allocation (minutes) *</label>
                                <input
                                    type="number"
                                    name="TimeAllocation"
                                    value={formData.TimeAllocation}
                                    onChange={handleInputChange}
                                    required
                                    min="1"
                                    placeholder="e.g. 15"
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    name="Status"
                                    value={formData.Status}
                                    onChange={handleInputChange}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Postponed">Postponed</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-buttons">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingItem(null);
                                    setError(null);
                                }}
                                className="secondary-button"
                            >
                                <X size={16} /> Cancel
                            </button>
                            <button type="submit" className="primary-button">
                                <Check size={16} /> {editingItem ? 'Update' : 'Save'} Agenda Item
                            </button>
                        </div>
                    </form>
                </div>
            );
        } else {
            const assignableAttendees = editingItem
                ? attendees // when editing, show everyone including the current assignee
                : attendees.filter(attendee => attendee.userId !== parseInt(userId)); // when creating, exclude organizer

            return (
                <div className="form-container">
                    <form onSubmit={handleFormSubmit} className="organizer-form">
                        <h3>{editingItem ? 'Edit Action Item' : 'Assign Action Item'}</h3>
                        {error && <div className="error-message">{error}</div>}
                        <div className="form-group">
                            <label>Action Description *</label>
                            <textarea
                                name="AssignAction"
                                value={formData.AssignAction}
                                onChange={handleInputChange}
                                required
                                placeholder="Describe the action to be taken"
                                rows="4"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Due Date *</label>
                                <input
                                    type="date"
                                    name="DueDate"
                                    value={formData.DueDate}
                                    onChange={handleInputChange}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="form-group">
                                <label>Assign To *</label>
                                <select
                                    name="MeetingAttendeeId"
                                    value={formData.MeetingAttendeeId}
                                    onChange={handleInputChange}
                                    required
                                    disabled={!!editingItem}
                                >
                                    <option value="">Select attendee</option>
                                    {assignableAttendees.map(attendee => (
                                        <option key={attendee.id} value={attendee.id}>
                                            {attendee.firstName} {attendee.lastName} ({attendee.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-buttons">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingItem(null);
                                    setError(null);
                                }}
                                className="secondary-button"
                            >
                                <X size={16} /> Cancel
                            </button>
                            <button type="submit" className="primary-button">
                                <Check size={16} /> {editingItem ? 'Update' : 'Assign'} Action
                            </button>
                        </div>
                    </form>
                </div>
            );
        }
    };

    const renderContent = () => {
        if (activeTab === 'agenda') {
            return (
                <div className="content-section">
                    <div className="section-header">
                        <h2>Meeting Agenda</h2>
                        {isOrganizer && (
                            <button
                                onClick={() => {
                                    setEditingItem(null);
                                    setShowForm(true);
                                }}
                                className="add-button"
                            >
                                <Plus size={16} /> Add Item
                            </button>
                        )}
                    </div>
                    {agendaItems.length === 0 ? (
                        <p className="no-items">No agenda items have been added yet</p>
                    ) : (
                        <div className="agenda-items-container">
                            {agendaItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`agenda-item ${expandedAgendaItem === item.id ? 'expanded' : ''}`}
                                >
                                    <div
                                        className="item-header"
                                        onClick={() => toggleAgendaItem(item.id)}
                                    >
                                        <div className="item-number-status">
                                            <span className="item-number">{item.itemNumber || item.ItemNumber}.</span>
                                            <span className={`item-status ${(item.status || item.Status).toLowerCase().replace(' ', '-')}`}>
                                                {item.status || item.Status}
                                            </span>
                                        </div>
                                        <div className="item-topic-time">
                                            <span className="item-topic">{item.topic || item.Topic}</span>
                                            <span className="item-time">{item.timeAllocation || item.TimeAllocation} min</span>
                                        </div>
                                        <div className="expand-icon">
                                            {expandedAgendaItem === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </div>
                                    {expandedAgendaItem === item.id && (
                                        <div className="item-details">
                                            <p className="item-description">{item.description || item.Description}</p>
                                            <div className="item-meta">
                                                <span>Added: {new Date(item.createdAt || item.CreatedAt).toLocaleString()}</span>
                                                {isOrganizer && (
                                                    <div className="item-actions">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditItem(item);
                                                            }}
                                                            className="edit-button"
                                                        >
                                                            <Edit size={16} /> Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteItem(item.id);
                                                            }}
                                                            className="delete-button"
                                                        >
                                                            <Trash2 size={16} /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        } else {
            return (
                <div className="content-section">
                    <div className="section-header">
                        <h2>Action Items</h2>
                        {isOrganizer && (
                            <button
                                onClick={() => {
                                    setEditingItem(null);
                                    setShowForm(true);
                                }}
                                className="add-button"
                            >
                                <Plus size={16} /> Assign Action
                            </button>
                        )}
                    </div>
                    {actionItems.length === 0 ? (
                        <p className="no-items">
                            {isOrganizer
                                ? "No action items have been assigned yet"
                                : "No action items have been assigned to you"}
                        </p>
                    ) : (
                        <div className="action-items-container">
                            {actionItems.map(item => {
                                const assignee = attendees.find(a => a.id === (item.meetingAttendeeId || item.MeetingAttendeeId));
                                const dueDate = new Date(item.dueDate || item.DueDate);
                                const isOverdue = dueDate < new Date() && (item.status || 'Pending') !== 'Completed';
                                const createdAt = new Date(item.createdAt || item.CreatedAt);

                                return (
                                    <div key={item.id} className={`action-item ${isOverdue ? 'overdue' : ''}`}>
                                        <div className="action-description">
                                            <p>{item.assignAction || item.AssignAction}</p>
                                        </div>
                                        <div className="action-details">
                                            <div className="assignee-info">
                                                <User size={14} />
                                                {assignee ? (
                                                    <span>{assignee.firstName} {assignee.lastName}</span>
                                                ) : (
                                                    <span>Unassigned</span>
                                                )}
                                            </div>
                                            <div className="due-date">
                                                <span>Due: {!isNaN(dueDate.getTime()) ? dueDate.toLocaleDateString() : 'Invalid Date'}</span>
                                                {isOverdue && <span className="overdue-badge">Overdue</span>}
                                            </div>
                                        </div>
                                        <div className="action-meta">
                                            <span>Assigned: {!isNaN(createdAt.getTime()) ? createdAt.toLocaleString() : 'Invalid Date'}</span>
                                            {(isOrganizer || (assignee && assignee.userId === parseInt(userId))) && (
                                                <div className="action-actions">
                                                    {isOrganizer && (
                                                        <button
                                                            onClick={() => handleEditItem(item)}
                                                            className="edit-button"
                                                        >
                                                            <Edit size={16} /> Edit
                                                        </button>
                                                    )}
                                                    {isOrganizer && (
                                                        <button
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            className="delete-button"
                                                        >
                                                            <Trash2 size={16} /> Delete
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }
    };

    if (loading) {
        return (
            <div className="screen-loading">
                <div className="loading-spinner"></div>
                <p>Loading meeting data...</p>
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
        <div className="organizer-container">
            <header className="meeting-header">
                <div className="meeting-info">
                    <h1>{meeting?.title || `Meeting: ${meetingId}`}</h1>
                    <div className="meeting-meta">
                        <span className="meeting-date">
                            {meeting?.meetingDate && new Date(meeting.meetingDate).toLocaleDateString()}
                        </span>
                        {isOrganizer && <span className="organizer-badge">Organizer</span>}
                    </div>
                </div>
            </header>

            <div className="organizer-tabs">
                <button
                    onClick={() => setActiveTab('agenda')}
                    className={`tab-button ${activeTab === 'agenda' ? 'active' : ''}`}
                >
                    <List size={18} /> Agenda
                </button>
                <button
                    onClick={() => setActiveTab('actions')}
                    className={`tab-button ${activeTab === 'actions' ? 'active' : ''}`}
                >
                    <ClipboardList size={18} /> Actions
                </button>
            </div>

            <main className="organizer-content">
                {showForm ? renderForm() : renderContent()}
            </main>
        </div>
    );
};

export default Screen;