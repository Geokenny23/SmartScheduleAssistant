import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar.tsx';
import { Sidebar } from './Sidebar.tsx';
import { ToastContainer } from './ToastContainer.tsx';
import { useApp } from '../../store/AppContext.tsx';

export const Layout: React.FC = () => {
  const { state } = useApp();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <main className="content-body">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};
