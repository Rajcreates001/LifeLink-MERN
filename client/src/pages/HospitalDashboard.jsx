import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';
import { DashboardCard, TabButton } from '../components/Common';

// --- CHECK THESE IMPORTS CAREFULLY ---
import HospitalOverview from '../components/HospitalOverview';
import HospitalAnalytics from '../components/HospitalAnalytics'; // Ensure this points to the Analytics file
import HospitalPatients from '../components/HospitalPatients';
import HospitalResources from '../components/HospitalResources';
import HospitalCommunications from '../components/HospitalCommunications';
import MyHospital from '../components/MyHospital';
import AmbulanceETARoute from '../components/AmbulanceETARoute';

const HospitalDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('home');

    // --- DEBUGGING LOG ---
    // Open Chrome Console (F12) to see which tab is actually active
    console.log("Current Active Tab:", activeTab);

    const renderContent = () => {
        switch(activeTab) {
            case 'home':
                return <HospitalOverview />;
            case 'analytics':
                // FIX: Ensure this is <HospitalAnalytics />, NOT <HospitalResources />
                return <HospitalAnalytics />; 
            case 'patients':
                return <HospitalPatients />;
            case 'resources':
                return <HospitalResources />;
            case 'my-hospital':
                return <MyHospital />;
            case 'ambulance-eta':
                return <AmbulanceETARoute currentHospitalId={user?._id || user?.id} currentHospitalName={user?.name} hospitalLocation={{lat: 12.9716, lng: 77.5946}} />;
            case 'communications':
                return <HospitalCommunications currentHospitalId={user?._id || user?.id} currentHospitalName={user?.name} />;
            default:
                return <HospitalOverview />;
        }
    };

    return (
        <DashboardLayout title={`Hospital Portal - ${user?.name || 'General'}`}>
            <DashboardCard className="mb-6 sticky top-20 z-30 shadow-md border-t border-blue-100">
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {/* 1. Overview */}
                    <TabButton 
                        label="Overview" 
                        icon="fa-chart-pie" 
                        isActive={activeTab === 'home'} 
                        onClick={() => setActiveTab('home')} 
                    />
                    
                    {/* 2. AI Analytics (Check the onClick sets 'analytics') */}
                    <TabButton 
                        label="AI Analytics" 
                        icon="fa-brain" 
                        isActive={activeTab === 'analytics'} 
                        onClick={() => setActiveTab('analytics')} 
                    />
                    
                    {/* 3. Patient Mgmt */}
                    <TabButton 
                        label="Patient Mgmt" 
                        icon="fa-user-injured" 
                        isActive={activeTab === 'patients'} 
                        onClick={() => setActiveTab('patients')} 
                    />
                    
                    {/* 4. Resources */}
                    <TabButton 
                        label="Inventory & Resources" 
                        icon="fa-boxes" 
                        isActive={activeTab === 'resources'} 
                        onClick={() => setActiveTab('resources')} 
                    />

                    {/* 5. My Hospital */}
                    <TabButton 
                        label="My Hospital" 
                        icon="fa-hospital" 
                        isActive={activeTab === 'my-hospital'} 
                        onClick={() => setActiveTab('my-hospital')} 
                    />

                    {/* 6. Ambulance ETA & Route */}
                    <TabButton 
                        label="Ambulance ETA" 
                        icon="fa-ambulance" 
                        isActive={activeTab === 'ambulance-eta'} 
                        onClick={() => setActiveTab('ambulance-eta')} 
                    />

                    {/* 7. Communications */}
                    <TabButton 
                        label="Communications" 
                        icon="fa-message" 
                        isActive={activeTab === 'communications'} 
                        onClick={() => setActiveTab('communications')} 
                    />
                </div>
            </DashboardCard>

            <div className="min-h-[60vh] animate-fade-in">
                {renderContent()}
            </div>
        </DashboardLayout>
    );
};

export default HospitalDashboard;