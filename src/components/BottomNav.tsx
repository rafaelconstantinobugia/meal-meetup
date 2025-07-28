import { Home, Search, MessageCircle, User, MapPin } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: MapPin, label: 'Discover' },
  { to: '/explore', icon: Search, label: 'Explore' },
  { to: '/matches', icon: MessageCircle, label: 'Matches' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="glass-card mx-4 mb-4 rounded-2xl">
        <div className="flex items-center justify-around py-2 bottom-nav-safe">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200",
                  "min-w-[60px] relative group",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "relative transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-105"
                )}>
                  <Icon className="h-5 w-5" />
                  {isActive && (
                    <div className="absolute -inset-2 bg-primary/20 rounded-full blur-sm -z-10" />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium mt-1 transition-all duration-200",
                  isActive ? "opacity-100" : "opacity-70"
                )}>
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};