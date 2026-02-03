import React, { useState, useEffect, Suspense } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { DashboardCard, TabButton, LoadingSpinner } from '../components/Common';

// Direct Imports for Stability
import AuthorityOverview from '../components/AuthorityOverview';
import AuthorityMap from '../components/AuthorityMap';
import AuthorityAI from '../components/AuthorityAI';
import AuthorityResources from '../components/AuthorityResources';
import AuthorityUserMgmt from '../components/AuthorityUserMgmt';
import AuthorityOutbreak from '../components/AuthorityOutbreak';

const GovernmentDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ pending: 0, verified: 12, zones: 8 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/dashboard/admin/pending-hospitals');
                if (res.ok) {
                    const data = await res.json();
                    setStats(prev => ({ ...prev, pending: data.length }));
                }
            } catch (err) { console.error("Stats Fetch Error:", err); }
        };
        fetchStats();
    }, []);

    const renderContent = () => {
        // Wrapper for safe rendering
        const TabWrapper = ({ children }) => (
            <div className="animate-fade-in">{children}</div>
        );

        try {
            switch(activeTab) {
                case 'overview': 
                    return <TabWrapper><AuthorityOverview /></TabWrapper>;
                case 'map': 
                    return <TabWrapper><AuthorityMap /></TabWrapper>;
                case 'analytics': 
                    return (
                        <TabWrapper>
                            <div className="space-y-6">
                                <AuthorityAI />
                                <AuthorityOutbreak />
                            </div>
                        </TabWrapper>
                    );
                case 'resources': 
                    return <TabWrapper><AuthorityResources /></TabWrapper>;
                case 'users': 
                    return <TabWrapper><AuthorityUserMgmt /></TabWrapper>;
                default: 
                    return <TabWrapper><AuthorityOverview /></TabWrapper>;
            }
        } catch (error) {
            return (
                <div className="p-20 text-center bg-red-50 rounded-2xl border border-red-200">
                    <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                    <h3 className="text-xl font-bold text-red-800">Interface Error</h3>
                    <p className="text-red-600">A component failed to render. Check your console for details.</p>
                </div>
            );
        }
    };

    return (
        <DashboardLayout title="LifeLink Authority Portal">
            <div className="space-y-6 pb-10">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DashboardCard className="border-l-4 border-blue-500">
                        <p className="text-xs font-bold text-blue-600 uppercase">Pending Approvals</p>
                        <p className="text-3xl font-black text-blue-900">{stats.pending || 0}</p>
                    </DashboardCard>
                    <DashboardCard className="border-l-4 border-green-500">
                        <p className="text-xs font-bold text-green-600 uppercase">Registered Hospitals</p>
                        <p className="text-3xl font-black text-green-900">{stats.verified}</p>
                    </DashboardCard>
                    <DashboardCard className="border-l-4 border-purple-500">
                        <p className="text-xs font-bold text-purple-600 uppercase">Total Zones</p>
                        <p className="text-3xl font-black text-purple-900">{stats.zones}</p>
                    </DashboardCard>
                </div>

                {/* Tab Navigation */}
                <DashboardCard className="p-2 sticky top-20 z-30 shadow-md border-t border-indigo-100">
                    <div className="flex flex-wrap gap-1">
                        <TabButton label="Overview" icon="fa-chart-line" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                        <TabButton label="Live Map" icon="fa-map-location-dot" isActive={activeTab === 'map'} onClick={() => setActiveTab('map')} />
                        <TabButton label="AI Analytics" icon="fa-brain" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                        <TabButton label="Resources" icon="fa-truck-medical" isActive={activeTab === 'resources'} onClick={() => setActiveTab('resources')} />
                        <TabButton label="User Mgmt" icon="fa-user-shield" isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    </div>
                </DashboardCard>

                {/* Dynamic Content */}
                <Suspense fallback={<LoadingSpinner />}>
                    {renderContent()}
                </Suspense>
            </div>
        </DashboardLayout>
    );
};

export default GovernmentDashboard;