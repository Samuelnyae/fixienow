import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import BookingAssistant from '@/pages/BookingAssistant';
import USSDBooking from '@/pages/USSDBooking';
import OrderRide from '@/pages/OrderRide';
import DriverRegister from '@/pages/DriverRegister';
import DriverDashboard from '@/pages/DriverDashboard';
import CreditReadiness from '@/pages/CreditReadiness';
import RideShare from '@/pages/RideShare';
import RideHistory from '@/pages/RideHistory';
import PostGig from '@/pages/PostGig';
import GigBoard from '@/pages/GigBoard';
import GigMatches from '@/pages/GigMatches';
import PitchDeck from '@/pages/PitchDeck';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingScreen />;
  }

  // Only the "user_not_registered" error is still handled at the app level;
  // unauthenticated users are handled by ProtectedRoute → redirect to /login
  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
      <Routes location={location}>
      {/* Auth routes — public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* App routes — public (no login required to browse) */}
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      <Route path="/BookingAssistant" element={
        <LayoutWrapper currentPageName="BookingAssistant">
          <BookingAssistant />
        </LayoutWrapper>
      } />
      <Route path="/USSDBooking" element={
        <LayoutWrapper currentPageName="USSDBooking">
          <USSDBooking />
        </LayoutWrapper>
      } />
      <Route path="/OrderRide" element={
        <LayoutWrapper currentPageName="OrderRide">
          <OrderRide />
        </LayoutWrapper>
      } />
      <Route path="/DriverRegister" element={
        <LayoutWrapper currentPageName="DriverRegister">
          <DriverRegister />
        </LayoutWrapper>
      } />
      <Route path="/DriverDashboard" element={
        <LayoutWrapper currentPageName="DriverDashboard">
          <DriverDashboard />
        </LayoutWrapper>
      } />
      <Route path="/CreditReadiness" element={
        <LayoutWrapper currentPageName="CreditReadiness">
          <CreditReadiness />
        </LayoutWrapper>
      } />
      <Route path="/RideShare/:token" element={<RideShare />} />
      <Route path="/RideHistory" element={
        <LayoutWrapper currentPageName="RideHistory">
          <RideHistory />
        </LayoutWrapper>
      } />
      <Route path="/PostGig" element={
        <LayoutWrapper currentPageName="PostGig">
          <PostGig />
        </LayoutWrapper>
      } />
      <Route path="/GigBoard" element={
        <LayoutWrapper currentPageName="GigBoard">
          <GigBoard />
        </LayoutWrapper>
      } />
      <Route path="/GigMatches" element={
        <LayoutWrapper currentPageName="GigMatches">
          <GigMatches />
        </LayoutWrapper>
      } />
      <Route path="/PitchDeck" element={
        <LayoutWrapper currentPageName="PitchDeck">
          <PitchDeck />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}

      <Route path="*" element={<PageNotFound />} />
      </Routes>
      </motion.div>
    </AnimatePresence>
  );
};


function App() {
  // Global system dark mode detection — attach/remove .dark on <html> app-wide.
  // Honors a stored manual preference (set from the admin toggle); otherwise follows the OS.
  useEffect(() => {
    const root = document.documentElement;
    const applyDark = (isDark) => root.classList.toggle('dark', isDark);

    const stored = localStorage.getItem('fixie-theme');
    applyDark(stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      if (!localStorage.getItem('fixie-theme')) applyDark(e.matches);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App