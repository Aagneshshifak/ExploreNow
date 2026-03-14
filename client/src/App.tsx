import React, { useState, useEffect, Suspense } from 'react';
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

// Eager load critical pages
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// Lazy load non-critical pages
const Login = React.lazy(() => import("./pages/Login"));
const Signup = React.lazy(() => import("./pages/Signup"));
const AdminLogin = React.lazy(() => import("./pages/AdminLogin"));
const AdminSignup = React.lazy(() => import("./pages/AdminSignup"));

// Tools pages
const Tools = React.lazy(() => import("./pages/Tools"));
const ExpenseEstimator = React.lazy(() => import("./pages/ExpenseEstimator"));
const VisaChecker = React.lazy(() => import("./pages/VisaChecker"));
const TravelCompass = React.lazy(() => import("./pages/TravelCompass"));
const RouteFinder = React.lazy(() => import("./pages/RouteFinder"));
const DocumentWallet = React.lazy(() => import("./pages/DocumentWallet"));
const TouristCrowdMap = React.lazy(() => import("./pages/TouristCrowdMap"));
const TouristMap = React.lazy(() => import("./pages/TouristMap"));
const TripSuggestionByBudget = React.lazy(() => import("./pages/TripSuggestionByBudget"));
const TextTranslator = React.lazy(() => import("./pages/TextTranslator"));
const ExploreGuide = React.lazy(() => import("./pages/ExploreGuide"));
const TripRecommender = React.lazy(() => import("./pages/TripRecommender"));
const LocalExplorer = React.lazy(() => import("./pages/LocalExplorer"));
const ExpenseConverter = React.lazy(() => import("./pages/ExpenseConverter"));
const TranslationPage = React.lazy(() => import("./pages/TranslationPage"));

// Admin pages
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const AdminUploadDashboard = React.lazy(() => import("./pages/AdminUploadDashboard"));
const HotelSubmission = React.lazy(() => import("./pages/HotelSubmission"));
const TripSubmission = React.lazy(() => import("./pages/TripSubmission"));

// Booking pages
const BookingFlow = React.lazy(() => import("./pages/BookingFlow"));
const TripBooking = React.lazy(() => import("./pages/TripBooking"));
const BookNowPage = React.lazy(() => import("./pages/BookNowPage"));
const BookingConfirmation = React.lazy(() => import("./pages/BookingConfirmation"));
const PaymentPage = React.lazy(() => import("./pages/PaymentPage"));

// Dashboard pages
const Profile = React.lazy(() => import("./pages/Profile"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));

// Content pages
const TripsList = React.lazy(() => import("./pages/TripsList"));
const TripDetails = React.lazy(() => import("./pages/TripDetails"));
const HotelDetails = React.lazy(() => import("./pages/HotelDetails"));
const HotelsList = React.lazy(() => import("./pages/HotelsList"));
const HotelsPage = React.lazy(() => import("./pages/HotelsPage"));
const TransportsPage = React.lazy(() => import("./pages/TransportsPage"));
const ReviewsPage = React.lazy(() => import("./pages/ReviewsPage"));
const RewardsPage = React.lazy(() => import("./pages/RewardsPage"));
const AIAssistant = React.lazy(() => import("./pages/AIAssistant"));
const SearchFilter = React.lazy(() => import("./pages/SearchFilter"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
    
    // Check if it's a chunk loading error
    if (error.message?.includes('Loading chunk') || 
        error.message?.includes('Cannot access') ||
        error.message?.includes('before initialization')) {
      console.error('Chunk loading error detected, reloading page...');
      // Reload the page to clear any stale chunks
      setTimeout(() => window.location.reload(), 100);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


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
    <ErrorBoundary>
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
                  <Suspense fallback={<LoadingSpinner />}>
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
                <Route path="/tourist-map" element={<Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}><TouristMap /></Layout>} />
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
                <Route path="/hotel/:id/book" element={
                  <ProtectedRoute requireAuth={true}>
                    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                      <BookingFlow />
                    </Layout>
                  </ProtectedRoute>
                } />
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
                  </Suspense>
                </PageTransition>
                <ScrollToTop />
              </div>
            </BrowserRouter>
              </TooltipProvider>
            </CurrencyProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;