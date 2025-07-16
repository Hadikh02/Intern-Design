import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Users,
    LogOut,
    Trash2,
    Plus,
    DoorOpen,
    Edit
} from 'lucide-react';

const ListRooms = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeItem, setActiveItem] = useState('users');
    const [expandedSubmenus, setExpandedSubmenus] = useState({});
    const navigate = useNavigate();

    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [roomsPerPage] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch('https://localhost:7175/api/Users/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch current user');
                }

                const user = await response.json();
                setCurrentUser(user);

                if (user.userType !== 'Admin') {
                    setError('You do not have permission to view this page');
                    navigate('/');
                    return;
                }

                fetchAllRooms(token);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching current user:', err);
                navigate('/login');
            }
        };

        const fetchAllRooms = async (token) => {
            setIsLoading(true);
            try {
                const response = await fetch('https://localhost:7175/api/Room', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch rooms');
                }

                const data = await response.json();
                setRooms(data);
                setFilteredRooms(data);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching rooms:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCurrentUser();
    }, [navigate]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredRooms(rooms);
            setCurrentPage(1);
        } else {
            const filtered = rooms.filter(room =>
                (room.roomNumber && room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (room.location && room.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (room.id && room.id.toString().includes(searchTerm))
            );
            setFilteredRooms(filtered);
            setCurrentPage(1);
        }
    }, [searchTerm, rooms]);

    const indexOfLastRoom = currentPage * roomsPerPage;
    const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
    const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom);
    const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);

    const handleSearch = (e) => {
        e.preventDefault();
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
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

    const handleDeleteRoom = async (roomId) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // First check if the room has any meetings
            const meetingsResponse = await fetch(`https://localhost:7175/api/Meetings/Room/${roomId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!meetingsResponse.ok) {
                const errorText = await meetingsResponse.text();
                throw new Error(errorText || 'Failed to check room meetings');
            }

            const meetings = await meetingsResponse.json();

            if (meetings && meetings.length > 0) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Cannot Delete Room',
                    text: 'This room has scheduled meetings and cannot be deleted.',
                    confirmButtonText: 'OK'
                });
                return;
            }

            // Confirm deletion with user
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            });

            if (!result.isConfirmed) return;

            // Proceed with deletion
            const deleteResponse = await fetch(`https://localhost:7175/api/Room/${roomId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!deleteResponse.ok) {
                const errorText = await deleteResponse.text();
                throw new Error(errorText || 'Failed to delete room');
            }

            // Update UI
            const updatedRooms = rooms.filter(room => room.id !== roomId);
            setRooms(updatedRooms);
            setFilteredRooms(updatedRooms);

            await Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'The room has been deleted.',
                confirmButtonText: 'OK'
            });

        } catch (error) {
            console.error('Delete room error:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to delete room',
                confirmButtonText: 'OK'
            });
        }
    };

    const handleEditRoom = (roomId) => {
        navigate(`/editRoom/${roomId}`); // ✅ Pass via URL
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
        { id: 'users', label: 'Users', icon: Users, path: '/users' },

        {
            id: 'actions',
            label: 'Actions',
            icon: Plus,
            submenu: [
                { id: 'user', label: 'New User', path: '/NewUser', state: { adminId: currentUser?.id } },
                { id: 'room', label: 'New Room', path: '/NewRoom', state: { adminId: currentUser?.id } },
            ]
        },
    ];

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

                .logo-subtitle {
                    font-size: 12px;
                    color: var(--gray);
                    font-weight: 500;
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
                    z-index: 30;
                    padding: 8px;
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

                .admin-dashboard-content {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 32px;
                    margin-top: 24px;
                }

                .rooms-table-container {
                    background-color: var(--white);
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                    border: 1px solid var(--gray-light);
                    margin-bottom: 2rem;
                }

                .table-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .table-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--dark);
                }

                .table-filters {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .filter-group label {
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--gray-dark);
                }

                .filter-group input {
                    padding: 8px 12px;
                    border: 1px solid var(--gray-light);
                    border-radius: 6px;
                    font-size: 14px;
                    transition: all 0.2s;
                    width:280px;
                }

                .filter-group input:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
                }

                .table-wrapper {
                    width: 100%;
                    overflow-x: auto;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    scrollbar-width: thin;
                    scrollbar-color: var(--gray-light) transparent;
                }

                .table-wrapper::-webkit-scrollbar {
                    height: 8px;
                }

                .table-wrapper::-webkit-scrollbar-track {
                    background: transparent;
                }

                .table-wrapper::-webkit-scrollbar-thumb {
                    background: var(--gray-light);
                    border-radius: 4px;
                }

                .table-wrapper::-webkit-scrollbar-thumb:hover {
                    background: var(--gray);
                }

                .rooms-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 800px;
                }

                .rooms-table thead {
                    background-color: var(--primary);
                    color: var(--white);
                }

                .rooms-table th {
                    padding: 12px 16px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 14px;
                }

                .rooms-table tbody tr {
                    border-bottom: 1px solid var(--gray-light);
                    transition: background-color 0.2s;
                }

                .rooms-table tbody tr:last-child {
                    border-bottom: none;
                }

                .rooms-table tbody tr:hover {
                    background-color: rgba(67, 97, 238, 0.05);
                }

                .rooms-table td {
                    padding: 12px 16px;
                    font-size: 14px;
                    color: var(--gray-dark);
                }

                .no-results {
                    text-align: center;
                    padding: 24px;
                    color: var(--gray);
                    font-style: italic;
                }

                .table-pagination {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 20px;
                    padding-top: 16px;
                    border-top: 1px solid var(--gray-light);
                }

                .pagination-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background-color: var(--white);
                    border: 1px solid var(--gray-light);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                }

                .pagination-button:hover:not(:disabled) {
                    background-color: var(--gray-light);
                }

                .pagination-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .page-info {
                    font-size: 14px;
                    color: var(--gray-dark);
                }

                .delete-button {
                    padding: 6px;
                    color: var(--danger);
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .delete-button:hover {
                    color: var(--danger);
                    background-color: rgba(239, 35, 60, 0.1);
                }

                .edit-button {
                    padding: 6px;
                    color: var(--info);
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .edit-button:hover {
                    color: var(--info);
                    background-color: rgba(72, 149, 239, 0.1);
                }

                .action-buttons {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
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

                    .table-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .table-filters {
                        width: 100%;
                    }

                    .filter-group {
                        width: 100%;
                    margin-bottom: 12px;
                    margin-right: 0;
                    flex: 1 1 100%;
                    min-width: 100%;
                    max-width: 100%;
                    box-sizing: border-box;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    align-items: stretch;
                }

                    .filter-group input {
                        width: 100%;
                        box-sizing: border-box;
                    }

                    .rooms-table {
                        min-width: 900px;
                        font-size: 13px;
                    }

                    .rooms-table th,
                    .rooms-table td {
                        padding: 10px 12px;
                        white-space: nowrap;
                    }

                    .rooms-table th:first-child,
                    .rooms-table td:first-child {
                        min-width: 80px;
                    }

                    .rooms-table th:nth-child(2),
                    .rooms-table td:nth-child(2),
                    .rooms-table th:nth-child(3),
                    .rooms-table td:nth-child(3) {
                        min-width: 120px;
                    }

                    .rooms-table th:nth-child(4),
                    .rooms-table td:nth-child(4) {
                        min-width: 100px;
                    }

                    .rooms-table th:nth-child(5),
                    .rooms-table td:nth-child(5) {
                        min-width: 120px;
                        text-align: center;
                    }
                }

                @media (max-width: 480px) {
                    .rooms-table {
                        min-width: 950px;
                        font-size: 12px;
                    }

                    .rooms-table th,
                    .rooms-table td {
                        padding: 8px 10px;
                    }
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
                        <h1 className="dashboard-title">Rooms Management</h1>
                        <p className="dashboard-subtitle">View and manage all meeting rooms</p>
                    </div>

                    {error && error.includes('permission') ? (
                        <div className="no-results" style={{ color: 'var(--danger)' }}>
                            {error}
                        </div>
                    ) : (
                        <div className="admin-dashboard-content">
                            <div className="rooms-table-container">
                                <div className="table-header">
                                    <h2 className="table-title">Rooms</h2>
                                    <form onSubmit={handleSearch} className="table-filters">
                                        <div className="filter-group" style={{ flex: 1 }}>
                                            <label htmlFor="search">Search Rooms</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    id="search"
                                                    placeholder="Search by room number, location or ID..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                {isLoading ? (
                                    <div className="no-results">Loading rooms...</div>
                                ) : error ? (
                                    <div className="no-results" style={{ color: 'var(--danger)' }}>{error}</div>
                                ) : currentRooms.length === 0 ? (
                                    <div className="no-results">No rooms found</div>
                                ) : (
                                    <>
                                        <div className="table-wrapper">
                                            <table className="rooms-table">
                                                <thead>
                                                    <tr>
                                                        <th>Room ID</th>
                                                        <th>Room Number</th>
                                                        <th>Location</th>
                                                        <th>Capacity</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentRooms.map((room) => (
                                                        <tr key={room.id}>
                                                            <td>{room.id}</td>
                                                            <td>{room.roomNumber}</td>
                                                            <td>{room.location}</td>
                                                            <td>{room.capacity}</td>
                                                            <td>
                                                                <div className="action-buttons">
                                                                    <button
                                                                        onClick={() => handleEditRoom(room.id)}
                                                                        className="edit-button"
                                                                        title="Edit room"
                                                                    >
                                                                        <Edit size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteRoom(room.id)}
                                                                        className="delete-button"
                                                                        title="Delete room"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="table-pagination">
                                            <button
                                                className="pagination-button"
                                                onClick={handlePrevPage}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </button>
                                            <span className="page-info">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <button
                                                className="pagination-button"
                                                onClick={handleNextPage}
                                                disabled={currentPage === totalPages || totalPages === 0}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
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
                                <li><a href="#" onClick={() => navigate('/dashboard')}>DashBoard</a></li>
                                <li><a href="#" onClick={() => navigate('/users')}>Users</a></li>
                                <li><a href="#" onClick={() => navigate('/newUser')}>New User</a></li>
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
                                    <path fill="currentColor" d="M20 15.5c-1.2 0-2.5-.2-3.6-.6h-.3c-.3 0-.5.1-.7.3l-2.2 2.2c-2.8-1.5-5.2-3.8-6.6-6.6l2.2-2.2c.4-.4.6-1 .3-1.5-.4-1.1-.6-2.4-.6-3.6 0-.5-.5-1-1-1H4c-.5 0-1 .5-1 1 0 9.4 7.6 17 17 17 .5 0 1-.5 1-1v-3.5c0-.5-.5-1-1-1z" />                                </svg>
                                +1 (555) 123-4567
                            </p>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} Taska. All rights reserved.</p>
                    </div>
                </footer>
            </div>

            <button onClick={toggleSidebar} className="mobile-menu-button">
                <Menu size={24} />
            </button>
        </>
    );
};

export default ListRooms;