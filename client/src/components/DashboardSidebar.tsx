import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpen,
  Building2,
  Car,
  Star,
  Gift,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const sidebarItems = [
  { icon: BookOpen, label: 'All Bookings', href: '/dashboard' },
  { icon: Building2, label: 'My Hotels', href: '/dashboard/hotels' },
  { icon: Car, label: 'My Transports', href: '/dashboard/transports' },
  { icon: Star, label: 'Reviews', href: '/reviews' },
  { icon: Gift, label: 'Rewards', href: '/rewards' },
];

interface DashboardSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className={`bg-card text-foreground transition-all duration-300 border-r border-border ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full text-foreground hover:bg-muted"
        >
          <Settings className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2">Dashboard</span>}
        </Button>
      </div>
      
      <nav className="mt-4">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            // Determine if this item is active
            let isActive = false;
            if (item.href === '/dashboard') {
              // For dashboard, match exactly /dashboard (not /dashboard/hotels or /dashboard/transports)
              isActive = currentPath === '/dashboard';
            } else {
              // For other items, match the href exactly
              isActive = currentPath === item.href;
            }

            return (
              <TooltipProvider key={item.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <li>
                      <Link to={item.href}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className={`w-full justify-start text-foreground hover:bg-muted ${
                            isActive ? 'bg-muted' : ''
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          {!isCollapsed && <span className="ml-2">{item.label}</span>}
                        </Button>
                      </Link>
                    </li>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

