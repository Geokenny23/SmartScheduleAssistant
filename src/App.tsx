import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext.tsx';
import { Layout } from './components/common/Layout.tsx';

// Pages
import { PsDashboard } from './pages/PsDashboard.tsx';
import { SetupPage } from './pages/SetupPage.tsx';
import { WorkspacePage } from './pages/WorkspacePage.tsx';
import { SubmitPage } from './pages/SubmitPage.tsx';
import { TeamPage } from './pages/TeamPage.tsx';
import { RequestsPage } from './pages/RequestsPage.tsx';

import { AsInboxPage } from './pages/AsInboxPage.tsx';
import { AsReviewPage } from './pages/AsReviewPage.tsx';
import { AsCrossStorePage } from './pages/AsCrossStorePage.tsx';

import { AboutPage } from './pages/AboutPage.tsx';

const RootRedirect: React.FC = () => {
  const { state } = useApp();
  return <Navigate to={state.role === 'PS' ? '/ps' : '/as'} replace />;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<RootRedirect />} />

        {/* PS Routes */}
        <Route path="ps" element={<PsDashboard />} />
        <Route path="ps/week/:id/setup" element={<SetupPage />} />
        <Route path="ps/week/:id" element={<WorkspacePage />} />
        <Route path="ps/week/:id/submit" element={<SubmitPage />} />
        <Route path="ps/team" element={<TeamPage />} />
        <Route path="ps/requests" element={<RequestsPage />} />

        {/* AS Routes */}
        <Route path="as" element={<AsInboxPage />} />
        <Route path="as/review/:id" element={<AsReviewPage />} />
        <Route path="as/cross-store" element={<AsCrossStorePage />} />
        <Route path="as/cross-store/:id" element={<AsCrossStorePage />} />

        {/* Shared */}
        <Route path="about" element={<AboutPage />} />

        {/* Fallback */}
        <Route path="*" element={<RootRedirect />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}
