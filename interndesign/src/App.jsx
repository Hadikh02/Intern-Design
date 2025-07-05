import './styles/main.scss';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Rooms from "./pages/Rooms";
import Calendar from "./pages/Calendar";
import RoomBooking from "./pages/RoomBooking";
import Profile from "./pages/Profile";
import Screen from "./pages/Screen";
import Sidebar from './components/Sidebar';

function App() {
    return (
        <Router>
            <div className="App">
                <Sidebar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/Rooms" element={<Rooms />} />
                    <Route path="/Calendar" element={<Calendar />} />
                    <Route path="/RoomBooking" element={<RoomBooking />} />
                    <Route path="/Profile" element={<Profile />} />
                    <Route path="/Screen" element={<Screen />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;