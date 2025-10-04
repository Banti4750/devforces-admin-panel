import React, { useContext } from 'react';
import { Menu, Search, Bell, Settings } from 'lucide-react';
import { MainContext } from '../context/MainContext';

const Location = () => {
  const { setissidebar } = useContext(MainContext);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      {/* Mobile menu button */}
      <button
        className="lg:hidden -ml-2 inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
        onClick={() => setissidebar(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb or Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold md:text-xl">Dashboard</h1>
      </div>

      {/* Search bar - hidden on mobile */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        <button className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent">
          <Settings className="h-5 w-5" />
        </button>

        <div className="ml-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
          A
        </div>
      </div>
    </header>
  );
};

export default Location;