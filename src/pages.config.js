import AdminDashboard from './pages/AdminDashboard';
import BookService from './pages/BookService';
import BookingDetail from './pages/BookingDetail';
import Home from './pages/Home';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import Services from './pages/Services';
import Settings from './pages/Settings';
import TechnicianDashboard from './pages/TechnicianDashboard';
import TechnicianDetail from './pages/TechnicianDetail';
import TechnicianEarnings from './pages/TechnicianEarnings';
import TechnicianJobs from './pages/TechnicianJobs';
import TechnicianProfile from './pages/TechnicianProfile';
import TechnicianRegister from './pages/TechnicianRegister';
import Wallet from './pages/Wallet';
import NotificationCenter from './pages/NotificationCenter';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "BookService": BookService,
    "BookingDetail": BookingDetail,
    "Home": Home,
    "MyBookings": MyBookings,
    "Profile": Profile,
    "Services": Services,
    "Settings": Settings,
    "TechnicianDashboard": TechnicianDashboard,
    "TechnicianDetail": TechnicianDetail,
    "TechnicianEarnings": TechnicianEarnings,
    "TechnicianJobs": TechnicianJobs,
    "TechnicianProfile": TechnicianProfile,
    "TechnicianRegister": TechnicianRegister,
    "Wallet": Wallet,
    "NotificationCenter": NotificationCenter,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};