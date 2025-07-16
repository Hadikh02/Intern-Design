import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
    Menu,
    X,
    Home,
    Users as UsersIcon,
    BarChart2,
    Settings,
    Calendar,
    ChevronDown,
    DoorOpen,
    LogOut,
    Plus,
    Video,
    Projector,
    Hash,
    MapPin,
    CheckCircle
} from 'lucide-react';

const EditRoom = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeItem, setActiveItem] = useState('room');
    const [expandedSubmenus, setExpandedSubmenus] = useState({ actions: true });
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        id: 0,
        roomNumber: '',
        location: '',
        hasVideo: false,
        hasProjector: false,
        capacity: '',
        userId: null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                // Fetch current user
                const userResponse = await fetch('https://localhost:7175/api/Users/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!userResponse.ok) {
                    throw new Error('Failed to fetch current user');
                }

                const user = await userResponse.json();

                if (!isMounted) return;

                setCurrentUser(user);

                // Silent redirect if not admin
                if (user.userType !== 'Admin') {
                    navigate('/', { replace: true }); // Added replace: true to prevent back navigation
                    return;
                }

                // Rest of your data fetching logic...
                if (id) {
                    const roomResponse = await fetch(`https://localhost:7175/api/Room/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!roomResponse.ok) {
                        throw new Error('Failed to fetch room data');
                    }

                    const room = await roomResponse.json();

                    if (!isMounted) return;

                    setFormData({
                        id: room.id,
                        roomNumber: room.roomNumber || '',
                        location: room.location || '',
                        hasVideo: Boolean(room.hasVideo),
                        hasProjector: Boolean(room.hasProjector),
                        capacity: room.capacity?.toString() || '1',
                        userId: user.id
                    });

                    setDataLoaded(true);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                if (isMounted) {
                    navigate('/', { replace: true }); // Silent redirect on error
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [navigate, id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        try {
            const token = localStorage.getItem('accessToken');

            const dataToSend = {
                id: formData.id,
                roomNumber: formData.roomNumber,
                location: formData.location,
                capacity: parseInt(formData.capacity, 10) || 1,
                hasVideo: formData.hasVideo,
                hasProjector: formData.hasProjector,
                userId: formData.userId
            };

            const response = await fetch(`https://localhost:7175/api/Room/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                const errorData = await response.json();

                // Check if this is a validation error with field-specific messages
                if (errorData.errors) {
                    // Combine all error messages into one string
                    const allErrors = Object.values(errorData.errors)
                        .flat()
                        .join(' ');
                    setErrors({ general: allErrors });
                } else {
                    // Fallback to general error
                    throw new Error(errorData.message || 'Room update failed');
                }
                return;
            }

            await Swal.fire({
                icon: 'success',
                title: 'Room Updated Successfully!',
                text: `Room ${formData.roomNumber} has been updated.`,
                confirmButtonColor: '#0d47a1'
            });

            navigate('/listRooms');

        } catch (error) {
            console.error('Room update error:', error);
            setErrors({ general: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked :
                name === 'capacity' ? value : // Keep capacity as string during input
                    value
        }));

        // Clear error when user starts typing
        if (errors.general) {
            setErrors({});
        }
    };

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const handleItemClick = (itemId) => {
        setActiveItem(itemId);
        const item = menuItems.find(i => i.id === itemId);
        if (item?.submenu) {
            setExpandedSubmenus(prev => ({
                ...prev,
                [itemId]: !prev[itemId]
            }));
        }
    };

    const handleLogout = () => {
        navigate('/');
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
        { id: 'users', label: 'Users', icon: UsersIcon, path: '/users' },
        { id: 'rooms', label: 'Rooms', icon: DoorOpen, path: '/listRooms' },
        {
            id: 'actions',
            label: 'Actions',
            icon: Plus,
            submenu: [
                { id: 'user', label: 'New User', path: '/NewUser', state: { adminId: currentUser?.id } },
            ]
        },
    ];

    if (!dataLoaded) {
        // If we're still loading but currentUser is set and not admin,
        // we're in the process of redirecting
        if (currentUser && currentUser.userType !== 'Admin') {
            return null; // Render nothing while redirecting
        }

        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#6c757d'
            }}>
                Loading room data...
            </div>
        );
    }
    return (
        <>
            <style>{`
                :root {
                    --primary: #0d47a1;
                    --primary-light: #3a86ff;
                    --primary-dark: #3f37c9;
                    --secondary: #7209b7;
                    --accent: #f72585;
                    --dark: #14213d;
                    --light: #f8f9fa;
                    --gray: #6c757d;
                    --gray-light: #e9ecef;
                    --gray-dark: #495057;
                    --success: #4cc9f0;
                    --danger: #ef233c;
                    --warning: #f8961e;
                    --info: #4895ef;
                    --white: #ffffff;
                    --black: #212529;
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Poppins', sans-serif;
                    background-color: var(--light);
                }

                .dashboard-container {
                    position: relative;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }

                .mobile-overlay {
                    position: fixed;
                    inset: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 40;
                    backdrop-filter: blur(2px);
                }

                .sidebar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 100vh;
                    width: 280px;
                    background-color: var(--white);
                    box-shadow: 0 0 30px rgba(0, 0, 0, 0.05);
                    transform: translateX(-100%);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 50;
                    display: flex;
                    flex-direction: column;
                    border-right: 1px solid var(--gray-light);
                }

                .sidebar.open {
                    transform: translateX(0);
                }

                .sidebar-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--gray-light);
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.5rem;
                }

                .logo-container {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .logo-icon {
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, var(--primary), var(--primary-light));
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .logo-letter {
                    color: var(--white);
                    font-weight: 700;
                    font-size: 16px;
                }

                .logo-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--dark);
                }

                .close-sidebar-button {
                    padding: 6px;
                    border-radius: 6px;
                    transition: all 0.2s;
                    color: var(--gray);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                }

                .close-sidebar-button:hover {
                    background-color: var(--gray-light);
                    color: var(--dark);
                }

                .navigation-container {
                    flex: 1;
                    padding: 1rem;
                    overflow-y: auto;
                }

                .menu-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px;
                    border-radius: 8px;
                    transition: all 0.2s;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    margin-bottom: 4px;
                    color: var(--gray-dark);
                }

                .menu-item:hover {
                    background-color: var(--gray-light);
                    color: var(--dark);
                }

                .menu-item.active {
                    background-color: rgba(67, 97, 238, 0.1);
                    color: var(--primary);
                }

                .menu-item-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .menu-icon {
                    color: var(--primary);
                    transition: color 0.2s;
                }

                .menu-item:hover .menu-icon,
                .menu-item.active .menu-icon {
                    color: var(--primary);
                }

                .menu-label {
                    font-weight: 500;
                    font-size: 14px;
                }

                .submenu-arrow {
                    transition: transform 0.2s;
                    color: var(--gray);
                }

                .submenu-arrow.expanded {
                    transform: rotate(180deg);
                }

                .submenu-container {
                    margin-left: 12px;
                    padding-left: 12px;
                    border-left: 1px dashed var(--gray-light);
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .submenu-container.expanded {
                    max-height: 500px;
                    opacity: 1;
                }

                .submenu-container:not(.expanded) {
                    max-height: 0;
                    opacity: 0;
                }

                .submenu-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    font-size: 13px;
                    border-radius: 6px;
                    transition: all 0.2s;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: var(--gray);
                    margin: 4px 0;
                }

                .submenu-item:hover {
                    color: var(--dark);
                    background-color: var(--gray-light);
                }

                .submenu-item.active {
                    color: var(--primary);
                    font-weight: 500;
                }

                .submenu-label {
                    margin-left: 8px;
                }

                .sidebar-footer {
                    padding: 1rem;
                    border-top: 1px solid var(--gray-light);
                }

                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 1rem;
                }

                .user-avatar {
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, var(--secondary), var(--accent));
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .user-initials {
                    color: var(--white);
                    font-weight: 600;
                    font-size: 13px;
                }

                .user-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--dark);
                }

                .user-role {
                    font-size: 12px;
                    color: var(--gray);
                }

                .logout-button {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    color: var(--gray-dark);
                    transition: all 0.2s;
                    font-size: 14px;
                    font-weight: 500;
                }

                .logout-button:hover {
                    background-color: var(--gray-light);
                    color: var(--danger);
                }

                .mobile-menu-button {
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 1000;
    padding: 12px;
    background-color: var(--primary);
    color: var(--white);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
}

.mobile-menu-button:hover {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
}


                .dashboard-main-content {
                    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    min-height: 100vh;
                    margin-left: 0;
                    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d47a1' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                    background-attachment: fixed;
                    flex: 1;
                }

                .dashboard-main-content.sidebar-open {
                    margin-left: 280px;
                }

                .content-container {
                    padding: 24px;
                    padding-top: 80px;
                    flex: 1;
                }

                .dashboard-header {
                    margin-bottom: 32px;
                }

                .dashboard-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--dark);
                    margin-bottom: 8px;
                }

                .dashboard-subtitle {
                    color: var(--gray);
                    font-size: 16px;
                }

                .form-container {
                    background-color: var(--white);
                    border-radius: 12px;
                    padding: 32px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                    border: 1px solid var(--gray-light);
                    max-width: 600px;
                    margin: 0 auto;
                }

                .form-title {
                    font-size: 24px;
                    font-weight: 600;
                    color: var(--dark);
                    margin-bottom: 24px;
                    text-align: center;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: var(--gray-dark);
                    font-size: 14px;
                }

                .form-group .input-container {
                    position: relative;
                }

                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: 12px 16px;
                    padding-left: 48px;
                    border: 1px solid var(--gray-light);
                    border-radius: 8px;
                    font-size: 14px;
                    transition: all 0.2s;
                    background-color: var(--white);
                }

                .form-group input:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
                }

                .form-group .input-icon {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--gray);
                    z-index: 1;
                }

                .form-group.error input,
                .form-group.error select {
                    border-color: var(--danger);
                }

                .error-message {
                    color: var(--danger);
                    font-size: 12px;
                    margin-top: 4px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .form-actions {
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    margin-top: 32px;
                }

                .btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 120px;
                    justify-content: center;
                }

                .btn-primary {
                    background-color: var(--primary);
                    color: var(--white);
                }

                .btn-primary:hover:not(:disabled) {
                    background-color: var(--primary-dark);
                    transform: translateY(-1px);
                }

                .btn-secondary {
                    background-color: var(--gray-light);
                    color: var(--gray-dark);
                }

                .btn-secondary:hover:not(:disabled) {
                    background-color: var(--gray);
                    color: var(--white);
                }

                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .loading-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid transparent;
                    border-top: 2px solid currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                .modern-footer {
                    background-color: var(--white);
                    padding: 3rem 0 0;
                    margin-top: auto;
                    border-top: 1px solid var(--gray-light);
                }

                .footer-content {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 2rem;
                }

                .footer-logo {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }

                .footer-logo h3 {
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                    color: var(--dark);
                }

                .footer-logo p {
                    margin: 0;
                    color: var(--gray);
                }

                .footer-links h4,
                .footer-contact h4 {
                    font-size: 1.2rem;
                    margin-bottom: 1.5rem;
                    position: relative;
                    color: var(--dark);
                }

                .footer-links h4::after,
                .footer-contact h4::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    left: 0;
                    width: 40px;
                    height: 3px;
                    background: var(--primary);
                }

                .footer-links ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .footer-links li {
                    margin-bottom: 0.8rem;
                }

                .footer-links a {
                    text-decoration: none;
                    color: var(--gray-dark);
                    transition: color 0.3s ease;
                }

                .footer-links a:hover {
                    color: var(--primary);
                    text-decoration: underline;
                }

                .footer-contact p {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    color: var(--gray-dark);
                }

                .footer-bottom {
                    text-align: center;
                    padding: 1.5rem;
                    margin-top: 2rem;
                    border-top: 1px solid var(--gray-light);
                    font-size: 0.9rem;
                    color: var(--gray);
                }

                @media (min-width: 1024px) {
                    .sidebar {
                        transform: translateX(0);
                    }

                    .dashboard-main-content {
                        margin-left: 280px;
                    }

          .mobile-menu-button {
        display: none;
    }

                    .content-container {
                        padding-top: 24px;
                    }

                }

                @media (max-width: 768px) {
                    .content-container {
                        padding: 16px;
                        padding-top: 72px;
                    }

                    .form-container {
                        padding: 24px;
                    }

                    .form-actions {
                        flex-direction: column;
                    }

                    .btn {
                        width: 100%;
                    }
                }

                @media (max-width: 480px) {
                    .form-container {
                        padding: 16px;
                        margin: 0 8px;
                    }

                    .dashboard-title {
                        font-size: 24px;
                    }
                }
                  .modern-footer {
                    background-color: var(--white);
                    padding: 3rem 0 0;
                    margin-top: auto;
                    border-top: 1px solid var(--gray-light);
                }

                .footer-content {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 2rem;
                }

                .footer-logo {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }

                .footer-logo h3 {
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                    color: var(--dark);
                }

                .footer-logo p {
                    margin: 0;
                    color: var(--gray);
                }

                .footer-links h4,
                .footer-contact h4 {
                    font-size: 1.2rem;
                    margin-bottom: 1.5rem;
                    position: relative;
                    color: var(--dark);
                }

                .footer-links h4::after,
                .footer-contact h4::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    left: 0;
                    width: 40px;
                    height: 3px;
                    background: var(--primary);
                }

                .footer-links ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .footer-links li {
                    margin-bottom: 0.8rem;
                }

                .footer-links a {
                    text-decoration: none;
                    color: var(--gray-dark);
                    transition: color 0.3s ease;
                }

                .footer-links a:hover {
                    color: var(--primary);
                    text-decoration: underline;
                }

                .footer-contact p {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    color: var(--gray-dark);
                }

                .footer-bottom {
                    text-align: center;
                    padding: 1.5rem;
                    margin-top: 2rem;
                    border-top: 1px solid var(--gray-light);
                    font-size: 0.9rem;
                    color: var(--gray);
                }
            `}</style>


            {isOpen && (
                <div className="mobile-overlay" onClick={toggleSidebar} />
            )}

            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="header-content">
                        <div className="logo-container">
                            <div className="logo-icon">
                                <span className="logo-letter">T</span>
                            </div>
                            <div>
                                <h1 className="logo-title">Taska</h1>
                            </div>
                        </div>
                        <button onClick={toggleSidebar} className="close-sidebar-button">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <nav className="navigation-container">
                    {menuItems.map((item) => (
                        <div key={item.id}>
                            <button
                                onClick={() => {
                                    if (item.path) {
                                        navigate(item.path);
                                    }
                                    handleItemClick(item.id);
                                }}
                                className={`menu-item ${activeItem === item.id ? 'active' : ''}`}
                            >
                                <div className="menu-item-content">
                                    <item.icon size={20} className={`menu-icon ${activeItem === item.id ? 'active' : ''}`} />
                                    <span className="menu-label">{item.label}</span>
                                </div>
                                {item.submenu && (
                                    <ChevronDown
                                        size={16}
                                        className={`submenu-arrow ${expandedSubmenus[item.id] ? 'expanded' : ''}`}
                                    />
                                )}
                            </button>

                            {item.submenu && (
                                <div className={`submenu-container ${expandedSubmenus[item.id] ? 'expanded' : ''}`}>
                                    {item.submenu.map((subitem) => (
                                        <button
                                            key={subitem.id}
                                            onClick={() => {
                                                navigate(subitem.path, {
                                                    state: subitem.state || {}
                                                });
                                                setActiveItem(subitem.id);
                                            }}
                                            className={`submenu-item ${activeItem === subitem.id ? 'active' : ''}`}
                                        >
                                            <span className="submenu-label">{subitem.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            <span className="user-initials">
                                {currentUser ? `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}` : 'AD'}
                            </span>
                        </div>
                        <div>
                            <p className="user-name">
                                {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin User'}
                            </p>
                            <p className="user-role">
                                {currentUser ? currentUser.userType : 'Administrator'}
                            </p>
                        </div>
                    </div>
                    <button className="logout-button" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>

            <div className={`dashboard-main-content ${isOpen ? 'sidebar-open' : ''}`}>
                <div className="content-container">
                    <div className="dashboard-header">
                        <h2 className="dashboard-title">Edit Room</h2>
                        <p className="dashboard-subtitle">Update the details of this meeting room</p>
                    </div>

                 

                    <form onSubmit={handleSubmit} className="form-container">

                        <h3 className="form-title">Room Details</h3>
                           {/* Only show general error here */}
                    {errors.general && (
                        <div className="form-group error" style={{
                            textAlign: 'center',
                            marginBottom: '20px',
                            padding: '12px',
                            backgroundColor: '#fef2f2',
                            borderRadius: '8px',
                            borderLeft: '4px solid #ef4444'
                        }}>
                            <p className="error-message" style={{
                                fontSize: '14px',
                                color: '#ef4444',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                {errors.general}
                            </p>
                        </div>
                    )}

                        {/* Room Number Field */}
                        <div className="form-group">
                            <label htmlFor="roomNumber">Room Number</label>
                            <div className="input-container">
                                <Hash className="input-icon" size={16} />
                                <input
                                    type="text"
                                    id="roomNumber"
                                    name="roomNumber"
                                    value={formData.roomNumber || ''}
                                    onChange={handleInputChange}
                                    placeholder="A101"
                                />
                            </div>
                        </div>

                        {/* Location Field */}
                        <div className="form-group">
                            <label htmlFor="location">Location</label>
                            <div className="input-container">
                                <MapPin className="input-icon" size={16} />
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location || ''}
                                    onChange={handleInputChange}
                                    placeholder="1st Floor"
                                />
                            </div>
                        </div>

                        {/* Capacity Field */}
                        <div className="form-group">
                            <label htmlFor="capacity">Capacity</label>
                            <div className="input-container">
                                <UsersIcon className="input-icon" size={16} />
                                <input
                                    type="number"
                                    id="capacity"
                                    name="capacity"
                                    value={formData.capacity}
                                    onChange={handleInputChange}
                                    placeholder="5"
                                />

                            </div>
                        </div>

                        {/* Video Checkbox */}
                        <div className="form-group" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    id="hasVideo"
                                    name="hasVideo"
                                    checked={Boolean(formData.hasVideo)}
                                    onChange={handleInputChange}
                                />
                                <span className="checkmark"></span>
                                <Video size={16} style={{ marginRight: '8px' }} />
                                Has Video
                            </label>

                            {/* Projector Checkbox */}
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    id="hasProjector"
                                    name="hasProjector"
                                    checked={Boolean(formData.hasProjector)}
                                    onChange={handleInputChange}
                                />
                                <span className="checkmark"></span>
                                <Projector size={16} style={{ marginRight: '8px' }} />
                                Has Projector
                            </label>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? (
                                    <div className="loading-spinner"></div>
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        Update Room
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/listRooms')}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
                <footer className="modern-footer">
                    {/* Your existing footer code remains the same */}
                    <footer className="modern-footer">
                        <div className="footer-content">
                            <div className="footer-logo">
                                <h3>Taska</h3>
                                <p>Where productivity meets simplicity</p>
                            </div>
                            <div className="footer-links">
                                <h4>Quick Links</h4>
                                <ul>
                                    <li><a href="#" onClick={() => navigate('/dashboard')}>Home</a></li>
                                    <li><a href="#" onClick={() => navigate('/settings')}>Settings</a></li>
                                    <li><a href="#" onClick={() => navigate('/users')}>Users</a></li>
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
                </footer>
            </div>

            <button onClick={toggleSidebar} className="mobile-menu-button">
                <Menu size={24} />
            </button>
        </>
    );
};

export default EditRoom;