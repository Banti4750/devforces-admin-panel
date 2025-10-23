import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { MainContext } from '../context/MainContext';
import Sidebar from './Sidebar';
import Location from './Location';
import Dashboard from '../pages/Dashboard';
import Faq from '../pages/Faq';
import Auth from '../authpage/Auth';
import Problem from '../pages/Problem';
import Contest from '../pages/Contest';
import Tag from '../pages/Tag';
import UserFeedback from '../pages/UserFeedback';

const Layout = () => {
  const { issidebar, setissidebar } = useContext(MainContext);
  const location = useLocation();

  // Hide sidebar on auth route
  const isAuthPage = location.pathname === '/';

  if (isAuthPage) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r bg-card transition-transform duration-300 lg:static lg:translate-x-0 ${issidebar ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <Sidebar />
        <button
          className="absolute -right-3 top-20 flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-md lg:hidden hover:bg-accent"
          onClick={() => setissidebar(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </aside>

      {/* Overlay for mobile */}
      {issidebar && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setissidebar(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Location />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6 lg:p-8">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/problem" element={<Problem />} />
            <Route path="/faq" element={<Faq />} />
            <Route path='/contest' element={<Contest />} />
            <Route path='/tag' element={<Tag />} />
            <Route path="/userfeedback" element={<UserFeedback />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const MainContent = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Layout />} />
      </Routes>
    </BrowserRouter>
  );
};

export default MainContent;