import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Settings, Calendar, LogIn } from "lucide-react";
import Logo from "../assets/Logo.jpg";

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);

    const firstName = "Hadi";
    const lastName = "Khalil";
    const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();

    // Check if screen is mobile size
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        // Check on initial render
        checkIfMobile();

        // Add event listener for window resize
        window.addEventListener('resize', checkIfMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    const navItems = [
        { label: "Home", icon: <Home size={18} />, path: "/" },
        { label: "Services", icon: <Settings size={18} />, path: "/services" },
        { label: "Schedule", icon: <Calendar size={18} />, path: "/schedule" },
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
                </div>
            </div>

            <div className="contentsContainer">
                <ul>
                    {navItems.map((item) => (
                        <li
                            key={item.path}
                            className={location.pathname === item.path ? "active" : ""}
                            onClick={() => navigate(item.path)}
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