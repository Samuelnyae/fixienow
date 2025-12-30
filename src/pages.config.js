import Home from './pages/Home';
import Services from './pages/Services';
import TechnicianDetail from './pages/TechnicianDetail';
import BookService from './pages/BookService';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Services": Services,
    "TechnicianDetail": TechnicianDetail,
    "BookService": BookService,
    "MyBookings": MyBookings,
    "BookingDetail": BookingDetail,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};