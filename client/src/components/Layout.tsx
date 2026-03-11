import React from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  
  // Hide footer on AI Assistant and Tourist Map pages
  const hideFooter = location.pathname === '/ai-assistant' || location.pathname === '/tourist-map';
  
  return (
    <>
      <Navigation darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <main className="pt-20">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </>
  );
};

export default Layout;
