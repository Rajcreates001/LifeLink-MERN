import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Signup from './pages/Signup';
import Login from './pages/Login';
import PublicDashboard from './pages/PublicDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import GovernmentDashboard from './pages/GovernmentDashboard'; // <--- Only ONE import here
import LandingPage from './pages/LandingPage';
import ApiTest from './pages/ApiTest';

// Protected Route Component
// ... existing imports

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    
    // 1. Wait for the AuthProvider to check sessionStorage
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 font-medium">Authenticating...</p>
                </div>
            </div>
        );
    }
    
    // 2. If session check is done and no user exists
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Check for role authorization (normalized to lowercase)
    if (allowedRoles && !allowedRoles.includes(user.role.toLowerCase())) {
        return <Navigate to="/" replace />;
    }

    return children;
};

// ... keep rest of App component as provided

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/login" element={<Login />} />

                    {/* Protected: Public User Dashboard */}
                    <Route 
                        path="/dashboard/public" 
                        element={
                            <ProtectedRoute allowedRoles={['public']}>
                                <PublicDashboard />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Protected: Hospital Dashboard */}
                    <Route 
                        path="/dashboard/hospital" 
                        element={
                            <ProtectedRoute allowedRoles={['hospital']}>
                                <HospitalDashboard />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Protected: Government Dashboard */}
                    <Route 
                        path="/dashboard/government" 
                        element={
                            <ProtectedRoute allowedRoles={['government']}>
                                <GovernmentDashboard />
                            </ProtectedRoute>
                        } 
                    />

                    {/* API Test Page */}
                    <Route path="/api-test" element={<ApiTest />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;