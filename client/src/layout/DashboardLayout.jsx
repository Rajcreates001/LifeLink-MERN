import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationMenu from '../components/NotificationMenu';

// Import ALL 3 Profile Components
import ProfileModal from '../components/ProfileModal';               // Public (Medical)
import HospitalProfileModal from '../components/HospitalProfileModal'; // Hospital (Organization)
import GovernmentProfileModal from '../components/GovernmentProfileModal'; // Government (Official)

const DashboardLayout = ({ children, title }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    // UI States
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false); 

    // Notification Check Logic
    useEffect(() => {
        const checkUnread = async () => {
            if (!user?.id) return;
            try {
                // Adjust endpoint based on role if needed, currently using public endpoint for alerts
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/public/${user.id}/full`); 
                const data = await res.json();
                const lastRead = localStorage.getItem('lastReadTime');
                const lastReadDate = lastRead ? new Date(lastRead) : new Date(0);
                const allItems = [...(data.alerts || []), ...(data.resourceRequests || [])];
                const hasNew = allItems.some(item => new Date(item.createdAt) > lastReadDate);
                setHasUnread(hasNew);
            } catch (err) { console.error(err); }
        };
        // Only run notification check for Public/Hospital roles usually
        if(user?.role !== 'government') checkUnread();
    }, [user?.id, user?.role]);

    const handleLogout = () => { logout(); navigate('/'); };

    // --- DYNAMIC PROFILE RENDERER ---
    const renderProfileModal = () => {
        if (!isProfileOpen) return null;

        switch (user?.role) {
            case 'hospital':
                return <HospitalProfileModal onClose={() => setIsProfileOpen(false)} />;
            case 'government':
                return <GovernmentProfileModal onClose={() => setIsProfileOpen(false)} />;
            case 'public':
            default:
                return <ProfileModal onClose={() => setIsProfileOpen(false)} />;
        }
    };

    return (
        <div className="gradient-background-universal min-h-screen font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-40 border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2 rounded-lg shadow-lg">
                                <i className="fas fa-heartbeat text-xl"></i>
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">LifeLink</h1>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    {user?.role === 'hospital' ? 'Hospital Portal' : user?.role === 'government' ? 'Authority Portal' : 'Public Portal'}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4 relative">
                            
                            {/* Notification Button (Hide for Govt for now) */}
                            {user?.role !== 'government' && (
                                <div className="relative">
                                    <button 
                                        onClick={() => setIsNotifOpen(!isNotifOpen)} 
                                        className={`relative p-2 transition-colors ${isNotifOpen ? 'text-indigo-600 bg-indigo-50 rounded-full' : 'text-gray-400 hover:text-indigo-600'}`}
                                    >
                                        <i className="fas fa-bell text-xl"></i>
                                        {hasUnread && <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                                    </button>
                                    {isNotifOpen && <NotificationMenu onClose={() => setIsNotifOpen(false)} onMarkRead={() => setHasUnread(false)} />}
                                </div>
                            )}

                            {/* Profile Button */}
                            <div 
                                onClick={() => setIsProfileOpen(true)}
                                className="flex items-center gap-3 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-full cursor-pointer transition-all border border-transparent hover:border-slate-300"
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                                    user?.role === 'hospital' ? 'bg-teal-500' : user?.role === 'government' ? 'bg-slate-700' : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                                }`}>
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="text-sm font-semibold text-gray-700 hidden md:block">
                                    {user?.name || 'User'}
                                </span>
                                <i className="fas fa-chevron-down text-xs text-gray-400"></i>
                            </div>

                            {/* Logout */}
                            <button onClick={handleLogout} className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition" title="Logout">
                                <i className="fas fa-sign-out-alt text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-0">
                {children}
            </main>

            {/* Render the Correct Profile Modal */}
            {renderProfileModal()}
        </div>
    );
};

export default DashboardLayout;