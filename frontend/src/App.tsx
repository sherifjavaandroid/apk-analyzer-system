// frontend/src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Theme
import { lightTheme, darkTheme } from './theme';

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

// Redux store
import { RootState } from './store';
import { checkAuth } from './store/slices/authSlice';
import { AppDispatch } from './store';

// Error pages
import NotFound from './pages/Error/NotFound';

const App: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
    const [darkMode, setDarkMode] = useState<boolean>(false);

    // Check if user is authenticated on app load
    useEffect(() => {
        dispatch(checkAuth());
    }, [dispatch]);

    // Load theme preference from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme !== null) {
            setDarkMode(savedTheme === 'true');
        } else {
            // Check user's system preference
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setDarkMode(prefersDarkMode);
        }
    }, []);

    // Toggle theme
    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('darkMode', String(newMode));
    };

    // Show loading state
    if (loading) {
        return (
            <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
                <CssBaseline />
                <div className="loading-spinner">
                    {/* Loading spinner */}
                </div>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <Router>
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
                        </Route>
                    </Route>

                    {/* Redirect root to dashboard or login */}
                    <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

                    {/* 404 route */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
};

export default App;