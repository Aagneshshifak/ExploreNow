import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Globe, ChevronDown, Mountain, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AvatarMenu } from '@/components/ui/avatar-menu';
import { useAuth } from '@/hooks/use-auth';

interface NavigationProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navigation({ darkMode, toggleDarkMode }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
    { name: 'Trips', href: '/trips' },
    { name: 'Hotels', href: '/hotels' },
    { name: 'About', href: '/about' },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass shadow-elegant-md' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <motion.div
              className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <Mountain className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <span className="text-xl font-medium text-foreground group-hover:text-primary transition-colors">
              ExploreNow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary relative ${
                  location.pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {item.name}
                {location.pathname === item.href && (
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                    layoutId="activeNavItem"
                  />
                )}
              </Link>
            ))}
            
            {/* Submit Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-primary">
                  <Plus className="w-4 h-4" />
                  <span>Submit</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border border-border/50 bg-background/95 backdrop-blur-lg">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/submit-hotel" className="flex items-center space-x-2">
                    <span>Submit Hotel</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/submit-trip" className="flex items-center space-x-2">
                    <span>Submit Trip Package</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/tools/compass" className="flex items-center space-x-2">
                    <span>Create Trip Plan</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">EN</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border border-border/50 bg-background/95 backdrop-blur-lg">
                {languages.map((lang) => (
                  <DropdownMenuItem key={lang.code} className="cursor-pointer">
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="hover:bg-accent"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* User Avatar Menu */}
            <AvatarMenu user={user} onLogout={logout} />

            <Button asChild className="bg-white text-black dark:bg-black dark:text-white hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition" aria-label="Explore travel trips">
              <Link to="/trips">Explore Trips</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden mt-4 py-4 border-t border-border glass rounded-2xl"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col space-y-4 px-4">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-medium transition-colors ${
                      location.pathname === item.href
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* Mobile Submit Section */}
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">SUBMIT</p>
                  <Link
                    to="/submit-hotel"
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors block px-2 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Submit Hotel
                  </Link>
                  <Link
                    to="/submit-trip"
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors block px-2 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Submit Trip Package
                  </Link>
                  <Link
                    to="/tools/compass"
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors block px-2 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Create Trip Plan
                  </Link>
                </div>

                {/* Mobile Admin Section */}
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">ADMIN</p>
                  <Link
                    to="/admin/login"
                    className="text-sm font-medium underline text-black dark:text-white hover:opacity-80 block px-2 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin Login
                  </Link>
                  <Link
                    to="/admin/signup"
                    className="text-sm font-medium underline text-black dark:text-white hover:opacity-80 block px-2 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin Signup
                  </Link>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/login">Sign In</Link>
                    </Button>
                    <Button size="sm" asChild className="bg-white text-black dark:bg-black dark:text-white hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition" aria-label="Sign up for ExploreNow">
                      <Link to="/signup">Sign Up</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}