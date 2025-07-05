import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Settings, Calendar, LogIn, LogOut } from "lucide-react";
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
        initials: ""
    });

    // Extract user info from JWT token
    const getUserInfoFromToken = () => {
        const token = localStorage.getItem("accessToken");
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const email = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "";
            const nameParts = email.split("@")[0]?.split(".") || [];
            const firstName = nameParts[0] || "";
            const lastName = nameParts[1] || "";
            const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
            return { email, firstName, lastName, initials };
        } catch {
            return null;
        }
    };

    // Check authentication status and set user info
    useEffect(() => {
        const checkAuthStatus = () => {
            const accessToken = localStorage.getItem("accessToken");
            const refreshToken = localStorage.getItem("refreshToken");
            const authenticated = !!(accessToken && refreshToken);
            setIsAuthenticated(authenticated);

            if (authenticated) {
                const info = getUserInfoFromToken();
                if (info) setUserInfo(info);
            } else {
                setUserInfo({
                    email: "",
                    firstName: "",
                    lastName: "",
                    initials: ""
                });
            }
        };

        checkAuthStatus();
        window.addEventListener('storage', checkAuthStatus);
        const interval = setInterval(checkAuthStatus, 1000);

        return () => {
            window.removeEventListener('storage', checkAuthStatus);
            clearInterval(interval);
        };
    }, []);

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
            return [...baseItems, { label: "Logout", icon: <LogOut size={18} />, path: "/logout" }];
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
                        <button
                            className="profileButton"
                            onClick={() => handleNavigation("/profile")}
                        >
                            View Profile
                        </button>
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
