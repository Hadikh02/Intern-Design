import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Calendar.css';

const HomeCalendarAndFooter = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const navigate = useNavigate();

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const daysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const firstDayOfMonth = (month, year) => {
        return new Date(year, month, 1).getDay();
    };

    const isPastDate = (day) => {
        const selectedDate = new Date(currentYear, currentMonth, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate < today;
    };

    const isToday = (day) => {
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === currentMonth &&
            today.getFullYear() === currentYear
        );
    };

    const changeMonth = (increment) => {
        let newMonth = currentMonth + increment;
        let newYear = currentYear;

        const today = new Date();
        const currentDate = new Date(newYear, newMonth);

        // Don't allow navigation to past months
        if (currentDate < new Date(today.getFullYear(), today.getMonth())) {
            return;
        }

        if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        }

        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    const isPreviousMonthDisabled = () => {
        const today = new Date();
        return new Date(currentYear, currentMonth - 1) < new Date(today.getFullYear(), today.getMonth());
    };

    const handleDayClick = (day) => {
        if (!isPastDate(day)) {
            const selectedDate = new Date(currentYear, currentMonth, day);
            const formattedDate = selectedDate.toISOString().split('T')[0];
            navigate('/RoomBooking', { state: { selectedDate: formattedDate } });
        }
    };

    const renderCalendar = () => {
        const days = [];
        const totalDays = daysInMonth(currentMonth, currentYear);
        const firstDay = firstDayOfMonth(currentMonth, currentYear);

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days cells
        for (let day = 1; day <= totalDays; day++) {
            const pastDate = isPastDate(day);

            days.push(
                <div
                    key={`day-${day}`}
                    className={`calendar-day ${pastDate ? 'past-date' : ''} ${!pastDate && isToday(day) ? 'today' : ''}`}
                    onClick={() => !pastDate && handleDayClick(day)}
                    style={{ cursor: pastDate ? 'default' : 'pointer' }}
                >
                    {day}
                    {!pastDate && isToday(day) && <div className="today-indicator"></div>}
                </div>
            );
        }

        return days;
    };

    return (
        <>
            <div className="home-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* Schedule / Calendar Section */}
                <div className="schedule-section" id="schedule" style={{ flex: 1 }}>
                    <h2 className="schedule-title">Our Schedule</h2>
                    <p style={{
                        textAlign: 'center',
                        color: '#555',
                        marginBottom: '20px',
                        fontSize: '16px'
                    }}>
                        Please choose a day that you want to book
                    </p>
                    <div className="calendar-container">
                        <div className="calendar-header">
                            <button
                                className={`calendar-nav ${isPreviousMonthDisabled() ? 'disabled' : ''}`}
                                onClick={() => changeMonth(-1)}
                                disabled={isPreviousMonthDisabled()}
                            >
                                &lt;
                            </button>
                            <h3 className="calendar-month">
                                {months[currentMonth]} {currentYear}
                            </h3>
                            <button className="calendar-nav" onClick={() => changeMonth(1)}>
                                &gt;
                            </button>
                        </div>
                        <div className="calendar-grid">
                            <div className="calendar-weekday">Sun</div>
                            <div className="calendar-weekday">Mon</div>
                            <div className="calendar-weekday">Tue</div>
                            <div className="calendar-weekday">Wed</div>
                            <div className="calendar-weekday">Thu</div>
                            <div className="calendar-weekday">Fri</div>
                            <div className="calendar-weekday">Sat</div>
                            {renderCalendar()}
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
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
                                <li><a href="#schedule">Schedule</a></li>
                                <li><a href="/login">Login</a></li>
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
            </div>
        </>
    );
};

export default HomeCalendarAndFooter;