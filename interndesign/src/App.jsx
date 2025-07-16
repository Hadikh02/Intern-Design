import './styles/main.scss';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Rooms from "./pages/Rooms";
import Calendar from "./pages/Calendar";
import RoomBooking from "./pages/RoomBooking";
import Profile from "./pages/Profile";
import Screen from "./pages/Screen";
import DashBoard from "./pages/dashBoard";
import Users from "./pages/Users";
import NewUser from "./pages/NewUser";
import NewRoom from "./pages/NewRoom";
import RoomsList from "./pages/ListRooms";
import EditRoom from "./pages/EditRoom";
import ForgetPassword from "./pages/ForgetPasswod";
import VerificationCode from "./pages/VerificationCode";
import GenerateNewPassword from "./pages/GenerateNewPassword";
import Sidebar from './components/Sidebar';


import { useEffect } from 'react';

function AppContent() {
    const location = useLocation();

    // List of routes where you don't want the sidebar
    const hideSidebarRoutes = ['/dashBoard', '/users', '/newUser', '/newRoom', '/listRooms', '/editRoom'];

    const shouldHideSidebar = hideSidebarRoutes.includes(location.pathname);

    return (
        <div className="App">
            {!shouldHideSidebar && <Sidebar />}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/Rooms" element={<Rooms />} />
                <Route path="/Calendar" element={<Calendar />} />
                <Route path="/RoomBooking" element={<RoomBooking />} />
                <Route path="/Profile" element={<Profile />} />
                <Route path="/Screen" element={<Screen />} />
                <Route path="/dashBoard" element={<DashBoard />} />
                <Route path="/Users" element={<Users />} />
                <Route path="/NewUser" element={<NewUser />} />
                <Route path="/NewRoom" element={<NewRoom />} />
                <Route path="/ListRooms" element={<RoomsList />} />
                <Route path="/editRoom/:id" element={<EditRoom />} />
                <Route path="/ForgetPassword" element={<ForgetPassword />} />
                <Route path="/VerificationCode" element={<VerificationCode />} />
                <Route path="/GenerateNewPassword" element={<GenerateNewPassword />} />

            </Routes>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;