/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import BookService from './pages/BookService';
import BookingDetail from './pages/BookingDetail';
import Home from './pages/Home';
import MyBookings from './pages/MyBookings';
import NotificationCenter from './pages/NotificationCenter';
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
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "BookService": BookService,
    "BookingDetail": BookingDetail,
    "Home": Home,
    "MyBookings": MyBookings,
    "NotificationCenter": NotificationCenter,
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
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};