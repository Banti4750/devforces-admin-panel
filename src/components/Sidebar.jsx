import React, { useContext } from 'react';
import { Home, HelpCircle, ParkingCircle, Trophy } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const userData =
    localStorage.getItem("userData")
  const parsed = JSON.parse(userData);
  const links = [
    { id: 1, title: 'Dashboard', path: '/dashboard', icon: Home },
    { id: 2, title: 'FAQ', path: '/faq', icon: HelpCircle },
    { id: 3, title: "Problem", path: '/problem', icon: ParkingCircle },
    { id: 4, title: "Contest", path: "/contest", icon: Trophy }
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Logo Section */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">A</span>
          </div>
          <span className="text-lg font-semibold">Admin Panel</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => (
          <NavLink
            to={link.path}
            key={link.id}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            <link.icon className="h-5 w-5" />
            <span>{link.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            AD
          </div>
          <div className="flex-1 text-sm">
            <p className="font-medium">{parsed.name || "user"} </p>
            <p className="text-xs text-muted-foreground">{parsed.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;