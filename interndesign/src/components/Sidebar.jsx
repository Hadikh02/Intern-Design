import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Settings, Calendar, LogIn, LogOut, User, LayoutDashboard } from "lucide-react";
import Logo from "../assets/Logo.jpg";

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const [activePath, setActivePath] = useState(location.pathname);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userInfo, setUserInfo] = useState({
        email: "",
        firstName: "",
        lastName: "",
        initials: "",
        isAdmin: false
    });

    useEffect(() => {
        const handleProfileUpdate = (e) => {
            if (isAuthenticated) {
                // Option 1: Re-fetch fresh data (slower but ensures consistency)
                fetchUserInfo();

                // Option 2: Update directly from event (faster, but assumes data is correct)
                if (e.detail) {
                    setUserInfo(prev => ({
                        ...prev,
                        firstName: e.detail.firstName,
                        lastName: e.detail.lastName,
                        email: e.detail.email,
                        initials: `${e.detail.firstName[0]}${e.detail.lastName[0]}`.toUpperCase()
                    }));
                }
            }
        };

        window.addEventListener('profileUpdated', handleProfileUpdate);
        return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
    }, [isAuthenticated])

    // Extract user role from JWT token (role doesn't change frequently)
    const getUserRoleFromToken = () => {
        const token = localStorage.getItem("accessToken");
        if (!token) return { isAdmin: false };
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isAdmin = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] === "Admin";
            return { isAdmin };
        } catch {
            return { isAdmin: false };
        }
    };

    // Fetch fresh user data from API
    const fetchUserInfo = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        try {
            const response = await fetch('https://localhost:7175/api/Users/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (response.ok) {
                const userData = await response.json();
                const { isAdmin } = getUserRoleFromToken();

                const normalizedData = {
                    email: userData.email || userData.Email || "",
                    firstName: userData.firstName || userData.FirstName || "",
                    lastName: userData.lastName || userData.LastName || "",
                    isAdmin
                };

                const initials = `${normalizedData.firstName[0] || ""}${normalizedData.lastName[0] || ""}`.toUpperCase();

                setUserInfo({
                    ...normalizedData,
                    initials
                });
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    };

    // Check authentication status and fetch user info
    useEffect(() => {
        const checkAuthStatus = () => {
            const accessToken = localStorage.getItem("accessToken");
            const refreshToken = localStorage.getItem("refreshToken");
            const authenticated = !!(accessToken && refreshToken);
            setIsAuthenticated(authenticated);

            if (authenticated) {
                fetchUserInfo();
            } else {
                setUserInfo({
                    email: "",
                    firstName: "",
                    lastName: "",
                    initials: "",
                    isAdmin: false
                });
            }
        };

        checkAuthStatus();
        window.addEventListener('storage', checkAuthStatus);

        // Listen for profile updates (custom event)
        const handleProfileUpdate = () => {
            if (isAuthenticated) {
                fetchUserInfo();
            }
        };
        window.addEventListener('profileUpdated', handleProfileUpdate);

        // Check periodically, but less frequently
        const interval = setInterval(checkAuthStatus, 5000);

        return () => {
            window.removeEventListener('storage', checkAuthStatus);
            window.removeEventListener('profileUpdated', handleProfileUpdate);
            clearInterval(interval);
        };
    }, [isAuthenticated]);

    useEffect(() => {
        const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (location.pathname === "/") {
                const homeSection = document.getElementById("home");
                const servicesSection = document.getElementById("services");
                const roomsSection = document.getElementById("rooms");

                const scrollPosition = window.scrollY + 100;

                const homePosition = homeSection?.offsetTop || Infinity;
                const servicesPosition = servicesSection?.offsetTop || Infinity;
                const roomsPosition = roomsSection?.offsetTop || Infinity;

                if (roomsSection && scrollPosition >= roomsPosition) {
                    setActivePath("/rooms");
                } else if (servicesSection && scrollPosition >= servicesPosition) {
                    setActivePath("/services");
                } else {
                    setActivePath("/");
                }
            }
        };

        setActivePath(location.pathname);
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setIsAuthenticated(false);
        navigate("/login");
        console.log("User logged out successfully");
    };

    const handleNavigation = (path) => {
        if (path === "/logout") {
            handleLogout();
            return;
        }

        if (path === "/") {
            if (location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                navigate("/");
            }
            setActivePath("/");
        }
        else if (path === "/services" || path === "/rooms") {
            if (location.pathname === "/") {
                const section = document.getElementById(path.slice(1));
                if (section) {
                    section.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            } else {
                navigate("/", { state: { scrollTo: path.slice(1) } });
            }
        }
        else {
            navigate(path);
        }
    };

    useEffect(() => {
        if (location.pathname === "/" && location.state?.scrollTo) {
            setTimeout(() => {
                const section = document.getElementById(location.state.scrollTo);
                if (section) {
                    section.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }, 100);
        }
    }, [location]);

    const getNavItems = () => {
        const baseItems = [
            { label: "Home", icon: <Home size={18} />, path: "/" },
            { label: "Services", icon: <Settings size={18} />, path: "/services" },
            { label: "Rooms", icon: <Calendar size={18} />, path: "/rooms" },
        ];

        if (isAuthenticated) {
            return [
                ...baseItems,
                { label: "Logout", icon: <LogOut size={18} />, path: "/logout" }
            ];
        } else {
            return [...baseItems, { label: "Login", icon: <LogIn size={18} />, path: "/login" }];
        }
    };

    const navItems = getNavItems();

    return (
        <div className={isMobile ? "sidebar active" : "sidebar"}>
            <div className="logoContainer">
                <img src={Logo} alt="Logo" className="logo" />
                <h2 className="title">Taska</h2>
            </div>

            {isAuthenticated && (
                <div className="profileContainer">
                    <div className="profileCircle">{userInfo.initials}</div>
                    <div className="profileContents">
                        <p className="name">Hello, {userInfo.firstName}</p>
                        <p>{userInfo.email}</p>
                        <div className="profileButtons">
                            <button
                                className="profileButton"
                                onClick={() => handleNavigation("/profile")}
                            >
                                View Profile
                            </button>
                            {userInfo.isAdmin && (
                                <button
                                    className="dashboardButton"
                                    onClick={() => handleNavigation("/dashBoard")}
                                >
                                    Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="contentsContainer">
                <ul>
                    {navItems.map((item) => (
                        <li
                            key={item.path}
                            className={activePath === item.path ? "active" : ""}
                            onClick={() => handleNavigation(item.path)}
                            style={{ cursor: "pointer", fontWeight: "bold" }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;