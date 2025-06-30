// Sidebar.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Settings, Calendar, LogIn } from "lucide-react";
import Logo from "../assets/Logo.jpg";

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const [activePath, setActivePath] = useState(location.pathname);

    const firstName = "Hadi";
    const lastName = "Khalil";
    const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();

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

                // Get current scroll position with some offset
                const scrollPosition = window.scrollY + 100; // Adding 100px offset

                // Get section positions (with fallback to very large numbers if not found)
                const homePosition = homeSection?.offsetTop || Infinity;
                const servicesPosition = servicesSection?.offsetTop || Infinity;
                const roomsPosition = roomsSection?.offsetTop || Infinity;

                // Determine which section is active
                if (roomsSection && scrollPosition >= roomsPosition) {
                    setActivePath("/rooms");
                } else if (servicesSection && scrollPosition >= servicesPosition) {
                    setActivePath("/services");
                } else {
                    setActivePath("/");
                }
            }
        };

        // Set initial active path
        setActivePath(location.pathname);

        // Add scroll listener
        window.addEventListener("scroll", handleScroll, { passive: true });

        // Initial check
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, [location.pathname]);

    const handleNavigation = (path) => {
        if (path === "/") {
            // Special handling for Home
            if (location.pathname === "/") {
                // Already on home page - scroll to top
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            } else {
                // Navigate to home page first
                navigate("/");
            }
            setActivePath("/"); // Force set active path
        }
        else if (path === "/services" || path === "/rooms") {
            if (location.pathname === "/") {
                const section = document.getElementById(path.slice(1));
                if (section) {
                    section.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            } else {
                navigate("/", {
                    state: { scrollTo: path.slice(1) }
                });
            }
        }
        else {
            navigate(path);
        }
    };

    // Handle scroll after navigation
    useEffect(() => {
        if (location.pathname === "/" && location.state?.scrollTo) {
            setTimeout(() => {
                const section = document.getElementById(location.state.scrollTo);
                if (section) {
                    section.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            }, 100);
        }
    }, [location]);

    const navItems = [
        { label: "Home", icon: <Home size={18} />, path: "/" },
        { label: "Services", icon: <Settings size={18} />, path: "/services" },
        { label: "Rooms", icon: <Calendar size={18} />, path: "/rooms" },
        { label: "Login", icon: <LogIn size={18} />, path: "/login" },
    ];

    return (
        <div className={isMobile ? "sidebar active" : "sidebar"}>
            <div className="logoContainer">
                <img src={Logo} alt="Logo" className="logo" />
                <h2 className="title">Taska</h2>
            </div>

            <div className="profileContainer">
                <div className="profileCircle">{initials}</div>
                <div className="profileContents">
                    <p className="name">Hello, {firstName}</p>
                    <p>hadi.khalil332@gmail.com</p>
                    <button
                        className="profileButton"
                        onClick={() => handleNavigation("/profile")}
                    >
                        View Profile
                    </button>
                </div>
            </div>

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
