
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  const languages = {
    en: { name: "English", flag: "🇺🇸" },
    hi: { name: "हिंदी", flag: "🇮🇳" },
    ta: { name: "தமிழ்", flag: "🇮🇳" },
  };

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Plan Trip", href: "/trip-planner" },
    { name: "Hotels", href: "/hotels" },
    { name: "Reviews", href: "/reviews" },
    { name: "About", href: "/about" },
  ];

  const toolsMenuItems = [
    { name: "Smart Travel Tools", href: "/tools", icon: "🔧" },
    { name: "Community", href: "/community", icon: "👥" },
    { name: "My Wallet", href: "/my-bookings", icon: "💼" },
    { name: "Travel Quiz", href: "/tools", icon: "❓" },
    { name: "Virtual Tours", href: "/virtual-tours", icon: "▶️" },
    { name: "Partner Hub", href: "/admin", icon: "💼" },
    { name: "Trip Compass", href: "/tools", icon: "🧭" },
    { name: "Local Pulse", href: "/tools", icon: "📍" },
    { name: "Mood Travel", href: "/tools", icon: "⭐" },
    { name: "Visa Checker", href: "/tools", icon: "📋" },
    { name: "ExploreNow Pass", href: "/tools", icon: "🎫" },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <nav className={`fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-semibold text-foreground">ExploreNow</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-foreground">
                  <span>Tools</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border border-border">
                {toolsMenuItems.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link
                      to={item.href}
                      className="flex items-center space-x-3 cursor-pointer px-3 py-2 hover:bg-muted rounded-sm"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Side - Language & Auth */}
          <div className="hidden md:flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <Globe className="w-4 h-4" />
                  <span>{languages[language as keyof typeof languages].flag}</span>
                  <span className="text-sm">INR</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border border-border">
                {Object.entries(languages).map(([code, lang]) => (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => setLanguage(code)}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t border-border">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Tools Menu */}
              <div className="pt-2 border-t border-border">
                <p className="px-3 py-2 text-sm font-semibold text-muted-foreground">Tools</p>
                {toolsMenuItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
              
              <div className="flex items-center space-x-2 px-3 py-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
