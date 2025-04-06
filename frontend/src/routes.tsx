// frontend/src/routes.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';

// Main pages
import Dashboard from './pages/Dashboard';
import ApkAnalysis from './pages/ApkAnalysis';
import GithubAnalysis from './pages/GithubAnalysis';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Knowledge pages
import KnowledgeBase from './pages/Knowledge/KnowledgeBase';
import VulnerabilityGuide from './pages/Knowledge/VulnerabilityGuide';
import BestPractices from './pages/Knowledge/BestPractices';
import TechnologyGuide from './pages/Knowledge/TechnologyGuide';

// Error pages
import NotFound from './pages/Error/NotFound';

interface RoutesProps {
    isAuthenticated: boolean;
    darkMode: boolean;
    toggleTheme: () => void;
}

const AppRoutes: React.FC<RoutesProps> = ({
                                              isAuthenticated,
                                              darkMode,
                                              toggleTheme
                                          }) => {
    return (
        <Routes>
            {/* Auth routes */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
            <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" /> : <ForgotPassword />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
                <Route element={<Layout darkMode={darkMode} toggleTheme={toggleTheme} />}>
                    {/* Main routes */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/apk-analysis" element={<ApkAnalysis />} />
                    <Route path="/github-analysis" element={<GithubAnalysis />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />

                    {/* Knowledge routes */}
                    <Route path="/knowledge" element={<KnowledgeBase />} />
                    <Route path="/knowledge/vulnerability-guide" element={<VulnerabilityGuide />} />
                    <Route path="/knowledge/best-practices" element={<BestPractices />} />
                    <Route path="/knowledge/technology-guide" element={<TechnologyGuide />} />
                </Route>
            </Route>

            {/* Redirect root to dashboard or login */}
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;