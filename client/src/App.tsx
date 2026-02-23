import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import { ScrollToTop } from './components/ui/scroll-to-top';
import { PageTransition } from './components/PageTransition';
import { AuthProvider } from './hooks/use-auth';
import { ProtectedRoute } from './components/ui/protected-route';
import { CurrencyProvider } from './contexts/CurrencyContext';
import Layout from './components/Layout';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import ExpenseEstimator from "./pages/ExpenseEstimator";
import VisaChecker from "./pages/VisaChecker";
import TravelCompass from "./pages/TravelCompass";
import RouteFinder from "./pages/RouteFinder";
import DocumentWallet from "./pages/DocumentWallet";
import AdminDashboard from "./pages/AdminDashboard";
import Tools from "./pages/Tools";
import TouristCrowdMap from "./pages/TouristCrowdMap";
import HotelSubmission from "./pages/HotelSubmission";
import TripSubmission from "./pages/TripSubmission";
import TripSuggestionByBudget from "./pages/TripSuggestionByBudget";
import TextTranslator from "./pages/TextTranslator";
import ExploreGuide from "./pages/ExploreGuide";
import TripRecommender from "./pages/TripRecommender";
import LocalExplorer from "./pages/LocalExplorer";
import AdminUploadDashboard from "./pages/AdminUploadDashboard";
import SearchFilter from "./pages/SearchFilter";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import DashboardPage from "./pages/DashboardPage";
import TripsList from "./pages/TripsList";
import ExpenseConverter from "./pages/ExpenseConverter";
import ReviewsPage from "./pages/ReviewsPage";
import BookingFlow from "./pages/BookingFlow";
import TripBooking from "./pages/TripBooking";
import TranslationPage from "./pages/TranslationPage";
import TripDetails from "./pages/TripDetails";
import HotelDetails from "./pages/HotelDetails";
import HotelsList from "./pages/HotelsList";
import HotelsPage from "./pages/HotelsPage";
import TransportsPage from "./pages/TransportsPage";
import RewardsPage from "./pages/RewardsPage";
import AIAssistant from "./pages/AIAssistant";
import BookNowPage from "./pages/BookNowPage";
import BookingConfirmation from "./pages/BookingConfirmation";
import PaymentPage from "./pages/PaymentPage";


const queryClient = new QueryClient();

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CurrencyProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
            <div className="min-h-screen bg-background text-foreground">
              <PageTransition>
                <Routes>
                {/* Routes without navigation */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/signup" element={<AdminSignup />} />
                
                {/* Routes with navigation */}
                <Route path="/" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Home /></Layout>} />
                <Route path="/tools" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><Tools /></Layout>} />
                <Route path="/tools/expense-estimator" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ExpenseEstimator /></Layout>} />
                <Route path="/tools/visa-checker" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><VisaChecker /></Layout>} />
                <Route path="/tools/compass" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><TravelCompass /></Layout>} />
                <Route path="/tools/route-finder" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><RouteFinder /></Layout>} />
                <Route path="/tools/document-wallet" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><DocumentWallet /></Layout>} />
                <Route path="/tools/tourist-crowd-map" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><TouristCrowdMap /></Layout>} />
                <Route path="/tools/trip-suggestion-by-budget" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><TripSuggestionByBudget /></Layout>} />
                <Route path="/tools/text-translator" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><TextTranslator /></Layout>} />
                <Route path="/tools/explore-guide" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ExploreGuide /></Layout>} />
                <Route path="/tools/recommend-trip" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><TripRecommender /></Layout>} />
                <Route path="/tools/translate" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><TextTranslator /></Layout>} />
                <Route path="/tools/explorer" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><LocalExplorer /></Layout>} />
                <Route path="/search" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><SearchFilter /></Layout>} />
                <Route path="/ai-assistant" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><AIAssistant /></Layout>} />
                <Route path="/trips" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><TripsList /></Layout>} />
                <Route path="/trip/:id" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><TripDetails /></Layout>} />
                <Route path="/hotel/:id" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><HotelDetails /></Layout>} />
                <Route path="/hotels" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><HotelsList /></Layout>} />
                <Route path="/hotels-list" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><HotelsList /></Layout>} />
                <Route path="/transports" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><TransportsPage /></Layout>} />
                <Route path="/currency-converter" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ExpenseConverter /></Layout>} />
                <Route path="/translate" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><TranslationPage /></Layout>} />
                <Route path="/reviews" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><ReviewsPage /></Layout>} />
                <Route path="/rewards" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><RewardsPage /></Layout>} />
                <Route path="/about" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><div className="min-h-screen flex items-center justify-center"><h1 className="text-display">About Coming Soon</h1></div></Layout>} />
                <Route path="/book-now" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><BookNowPage /></Layout>} />
                <Route path="/payment/:bookingId" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><PaymentPage /></Layout>} />
                <Route path="/confirmation/:id" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><BookingConfirmation /></Layout>} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAuth={true} requiredRole="admin">
                    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                      <AdminUploadDashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                      <AdminDashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/submit-hotel" element={
                  <ProtectedRoute requireAuth={true} requiredRole="admin">
                    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                      <HotelSubmission />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/submit-trip" element={
                  <ProtectedRoute requireAuth={true} requiredRole="admin">
                    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                      <TripSubmission />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/book/:id" element={
                  <ProtectedRoute requireAuth={true}>
                    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                      <BookingFlow />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/trip/:id/book" element={
                  <ProtectedRoute requireAuth={true}>
                    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                      <TripBooking />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute requireAuth={true}>
                    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute requireAuth={true}>
                    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/hotels" element={
                  <ProtectedRoute requireAuth={true}>
                    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                      <HotelsPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/transports" element={
                  <ProtectedRoute requireAuth={true}>
                    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                      <TransportsPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><div className="min-h-screen flex items-center justify-center"><h1 className="text-display">Settings Coming Soon</h1></div></Layout>} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </PageTransition>
              <ScrollToTop />
            </div>
          </BrowserRouter>
            </TooltipProvider>
          </CurrencyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;