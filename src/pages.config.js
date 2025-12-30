import Home from './pages/Home';
import Services from './pages/Services';
import TechnicianDetail from './pages/TechnicianDetail';
import BookService from './pages/BookService';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import Profile from './pages/Profile';
import TechnicianRegister from './pages/TechnicianRegister';
import TechnicianDashboard from './pages/TechnicianDashboard';
import TechnicianJobs from './pages/TechnicianJobs';
import TechnicianEarnings from './pages/TechnicianEarnings';
import TechnicianProfile from './pages/TechnicianProfile';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import Wallet from './pages/Wallet';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Services": Services,
    "TechnicianDetail": TechnicianDetail,
    "BookService": BookService,
    "MyBookings": MyBookings,
    "BookingDetail": BookingDetail,
    "Profile": Profile,
    "TechnicianRegister": TechnicianRegister,
    "TechnicianDashboard": TechnicianDashboard,
    "TechnicianJobs": TechnicianJobs,
    "TechnicianEarnings": TechnicianEarnings,
    "TechnicianProfile": TechnicianProfile,
    "AdminDashboard": AdminDashboard,
    "Settings": Settings,
    "Wallet": Wallet,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};