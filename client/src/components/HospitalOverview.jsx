import React, { useState, useEffect } from 'react';
import { 
    PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/dashboard/hospital`;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const HospitalOverview = () => {
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true); // Only for initial load

    const fetchData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const [statsRes, alertsRes] = await Promise.all([
                fetch(`${API_BASE}/stats`),
                fetch(`${API_BASE}/alerts`)
            ]);
            
            const statsData = await statsRes.json();
            const alertsData = await alertsRes.json();

            setStats(statsData);
            setAlerts(alertsData);
        } catch (err) {
            console.error(err);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    // Initial Load + Polling
    useEffect(() => {
        fetchData(false); // First load with spinner
        
        const interval = setInterval(() => {
            fetchData(true); // Background load (no spinner)
        }, 5000); // Poll every 5s for faster updates

        return () => clearInterval(interval);
    }, []);

    // FIX: Optimistic UI Update to prevent flickering
    const handleAction = async (id, newStatus) => {
        // 1. Update UI Immediately (Optimistic)
        const previousAlerts = [...alerts];
        setAlerts(prev => prev.map(a => 
            a._id === id ? { ...a, status: newStatus } : a
        ));

        // 2. Send to Backend
        try {
            await fetch(`${API_BASE}/alert/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            // Don't need to alert or refresh, it's already done visibly
        } catch (err) {
            // Revert if failed
            setAlerts(previousAlerts);
            alert("Action Failed - Connection Error");
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500"><i className="fas fa-spinner fa-spin mr-2"></i>Loading Hospital Data...</div>;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            
            {/* 1. KEY METRICS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500 flex justify-between items-center">
                    <div><p className="text-xs font-bold text-gray-500 uppercase">Total Patients</p><h3 className="text-2xl font-bold text-gray-800">{stats?.totalPatients || 0}</h3></div>
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600"><i className="fas fa-procedures"></i></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500 flex justify-between items-center">
                    <div><p className="text-xs font-bold text-gray-500 uppercase">Available Beds</p><h3 className="text-2xl font-bold text-gray-800">{stats?.availableBeds || 0}</h3></div>
                    <div className="p-3 bg-green-50 rounded-full text-green-600"><i className="fas fa-bed"></i></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500 flex justify-between items-center">
                    <div><p className="text-xs font-bold text-gray-500 uppercase">Critical Cases</p><h3 className="text-2xl font-bold text-gray-800">{stats?.criticalCases || 0}</h3></div>
                    <div className="p-3 bg-red-50 rounded-full text-red-600"><i className="fas fa-heartbeat"></i></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-500 flex justify-between items-center">
                    <div><p className="text-xs font-bold text-gray-500 uppercase">Ambulances Active</p><h3 className="text-2xl font-bold text-gray-800">{stats?.activeAmbulances || 0}</h3></div>
                    <div className="p-3 bg-yellow-50 rounded-full text-yellow-600"><i className="fas fa-ambulance"></i></div>
                </div>
            </div>

            {/* 2. CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Current Case Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats?.caseDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {stats?.caseDistribution?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Patient Flow (Admitted vs Discharged)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.patientFlow}>
                                <defs>
                                    <linearGradient id="colorAdmit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorDischarge" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                                </defs>
                                <XAxis dataKey="time" style={{fontSize: '12px'}} />
                                <YAxis style={{fontSize: '12px'}} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="admitted" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAdmit)" />
                                <Area type="monotone" dataKey="discharged" stroke="#10b981" fillOpacity={1} fill="url(#colorDischarge)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3. EMERGENCY RESPONSE SECTION */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-red-500">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-xl text-red-700"><i className="fas fa-exclamation-circle mr-2"></i>Live Emergency Alerts</h3>
                        <p className="text-sm text-gray-500">Incoming SOS signals from Public Dashboard.</p>
                    </div>
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        {alerts.filter(a => a.status !== 'Resolved').length} Active Alerts
                    </span>
                </div>

                {alerts.filter(a => a.status !== 'Resolved').length === 0 ? (
                    <div className="text-center p-10 bg-gray-50 rounded-lg text-gray-400">
                        <i className="fas fa-check-circle text-4xl mb-2 text-green-400"></i>
                        <p>No active emergencies. All clear.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-gray-700">Time</th>
                                    <th className="px-4 py-3 text-left font-bold text-gray-700">Location</th>
                                    <th className="px-4 py-3 text-left font-bold text-gray-700">Issue / Message</th>
                                    <th className="px-4 py-3 text-left font-bold text-gray-700">Status</th>
                                    <th className="px-4 py-3 text-right font-bold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {alerts.filter(a => a.status !== 'Resolved').map(alert => (
                                    <tr key={alert._id} className="hover:bg-red-50 transition animate-slide-in-up">
                                        <td className="px-4 py-3 text-gray-500">{new Date(alert.createdAt).toLocaleTimeString()}</td>
                                        <td className="px-4 py-3 font-medium">{alert.locationDetails || "Unknown"}</td>
                                        <td className="px-4 py-3 text-gray-800">"{alert.message}"</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${alert.status === 'Pending' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {alert.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            {alert.status === 'Pending' && (
                                                <button onClick={() => handleAction(alert._id, 'Ambulance Dispatched')} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-sm transition">
                                                    <i className="fas fa-ambulance mr-1"></i> Send Ambulance
                                                </button>
                                            )}
                                            <button onClick={() => handleAction(alert._id, 'Resolved')} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded font-bold shadow-sm transition">
                                                <i className="fas fa-check mr-1"></i> Resolve
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HospitalOverview;