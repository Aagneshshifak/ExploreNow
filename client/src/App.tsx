import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import { ScrollToTop } from './components/ui/scroll-to-top';
import { AuthProvider } from './hooks/use-auth';
import { ProtectedRoute } from './components/ui/protected-route';
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background text-foreground">
              <Routes>
                {/* Routes without navigation */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/signup" element={<AdminSignup />} />
                
                {/* Routes with navigation */}
                <Route path="*" element={
                  <>
                    <Navigation darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
                    <main className="pt-20">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/tools" element={<Tools />} />
                        <Route path="/tools/expense-estimator" element={<ExpenseEstimator />} />
                        <Route path="/tools/visa-checker" element={<VisaChecker />} />
                        <Route path="/tools/compass" element={<TravelCompass />} />
                        <Route path="/tools/route-finder" element={<RouteFinder />} />
                        <Route path="/tools/document-wallet" element={<DocumentWallet />} />
                        <Route path="/tools/tourist-crowd-map" element={<TouristCrowdMap />} />
                        <Route path="/tools/trip-suggestion-by-budget" element={<TripSuggestionByBudget />} />
        <Route path="/tools/text-translator" element={<TextTranslator />} />
        <Route path="/tools/explore-guide" element={<ExploreGuide />} />
        <Route path="/tools/recommend-trip" element={<TripRecommender />} />
        <Route path="/tools/translate" element={<TextTranslator />} />
        <Route path="/tools/explorer" element={<LocalExplorer />} />
        <Route path="/search" element={<SearchFilter />} />
        
        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAuth={true} requiredRole="admin">
              <AdminUploadDashboard />
            </ProtectedRoute>
          } 
        />
                        <Route path="/admin/dashboard" element={
                          <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="/submit-hotel" element={<HotelSubmission />} />
                        <Route path="/submit-trip" element={<TripSubmission />} />
                        <Route path="/trips" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-display">Trips Coming Soon</h1></div>} />
                        <Route path="/hotels" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-display">Hotels Coming Soon</h1></div>} />
                        <Route path="/about" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-display">About Coming Soon</h1></div>} />
                        <Route path="/profile" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-display">Profile Coming Soon</h1></div>} />
                        <Route path="/settings" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-display">Settings Coming Soon</h1></div>} />
                        <Route path="/unauthorized" element={<Unauthorized />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                    <ScrollToTop />
                  </>
                } />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;