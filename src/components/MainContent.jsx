import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { X } from 'lucide-react';
import { MainContext } from '../context/MainContext';
import Sidebar from './Sidebar';
import Location from './Location';
import Dashboard from '../pages/Dashboard';
import Faq from '../pages/Faq';

const MainContent = () => {
  const routes = [
    { path: '/', element: <Dashboard /> },
    { path: '/faq', element: <Faq /> },
  ];

  const { issidebar, setissidebar } = useContext(MainContext);

  return (
    <BrowserRouter>
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
              {routes.map((item, index) => (
                <Route key={index} path={item.path} element={item.element} />
              ))}
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default MainContent;