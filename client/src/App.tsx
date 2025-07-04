
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import Navigation from "./components/Navigation";

// Lazy load pages for better performance
const Landing = lazy(() => import("./pages/Landing"));
const TripPlanner = lazy(() => import("./pages/TripPlanner"));
const Hotels = lazy(() => import("./pages/Hotels"));
const Tools = lazy(() => import("./pages/Tools"));
const About = lazy(() => import("./pages/About"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Community = lazy(() => import("./pages/Community"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/trip-planner" element={<TripPlanner />} />
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/community" element={<Community />} />
            <Route path="/about" element={<About />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
