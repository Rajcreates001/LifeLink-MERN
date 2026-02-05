import React, { useState } from 'react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Legend, AreaChart, Area 
} from 'recharts';

const API_BASE = '${import.meta.env.VITE_API_URL}/api';

const HospitalAnalytics = () => {
    // --- STATE ---
    const [triageData, setTriageData] = useState({ type: 'Accident', age: '45', heartRate: '110', bp: '140', distance: '12.5' });
    const [triageResult, setTriageResult] = useState(null);
    const [triageLoading, setTriageLoading] = useState(false);
    const [forecastLoading, setForecastLoading] = useState(false);
    const [staffLoading, setStaffLoading] = useState(false);
    const [donorLoading, setDonorLoading] = useState(false);
    const [perfLoading, setPerfLoading] = useState(false);

    const validNodes = [
        'Central City General', 'St. Jude Hospital', 'Mercy West',
        'Downtown', 'North Sector', 'West Suburbs', 'South Suburbs', 'North Suburbs'
    ];
    const [etaLocation, setEtaLocation] = useState(validNodes[0]);
    const [etaResult, setEtaResult] = useState(null);
    const [etaLoading, setEtaLoading] = useState(false);

    const [bedData, setBedData] = useState({ emergencies: '50', cases: '30', occupancy: '85' });
    const [forecastData, setForecastData] = useState(null);

    const [staffData, setStaffData] = useState({ dept: 'ER', load: 'High Load', shift: 'Night' });
    const [staffResult, setStaffResult] = useState(null);

    const [donorData, setDonorData] = useState({ age: '45', gender: 'Male', blood: 'A+', organ: 'Kidney' });
    const [donorList, setDonorList] = useState(null);

    const [perfData, setPerfData] = useState({ response: '12.5', success: '95.2', satisfaction: '4.5', utilization: '82' });
    const [perfResult, setPerfResult] = useState(null);

    // --- HANDLERS ---
    const handleTriage = async () => {
        setTriageLoading(true);
        try {
            const payload = {
                emergency_type: triageData.type,
                age: parseInt(triageData.age),
                heart_rate: parseInt(triageData.heartRate),
                blood_pressure_systolic: parseInt(triageData.bp),
                distance_km: parseFloat(triageData.distance)
            };
            const res = await fetch(`${API_BASE}/hospital/triage`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
            const data = await res.json();
            if (data.error) {
                alert("Error: " + data.error);
                setTriageResult(null);
            } else {
                const severity = data.predicted_severity;
                const severityColor = severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : severity === 'Severe' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200';
                setTriageResult({ level: severity, color: severityColor });
            }
        } catch (err) {
            console.error("Triage Error:", err);
            alert("Failed to predict severity");
        }
        setTimeout(() => setTriageLoading(false), 400);
    };

    const handleETA = async () => {
        setEtaLoading(true);
        try {
            const startNode = validNodes.includes(etaLocation) ? etaLocation : validNodes[0];
            const payload = {
                start_node: startNode,
                end_node: 'Central City General',
                hour: new Date().getHours()
            };
            const res = await fetch(`${API_BASE}/hospital/eta`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
            const data = await res.json();
            if (data.error) {
                alert("Error: " + data.error);
                setEtaResult(null);
            } else {
                setEtaResult(data.eta_minutes + ' mins');
            }
        } catch (err) {
            console.error("ETA Error:", err);
            alert("Failed to calculate ETA");
        }
        setEtaLoading(false);
    };

    // --- UPDATED HANDLERS WITH ERROR CHECKING ---
const handleForecast = async () => {
    setForecastLoading(true);
    try {
        const payload = {
            emergency_count: parseInt(bedData.emergencies),
            disease_case_count: parseInt(bedData.cases),
            current_bed_occupancy: parseInt(bedData.occupancy),
            hospital_id: 1
        };
        const res = await fetch(`${API_BASE}/hospital/bed_forecast`, { 
            method: 'POST', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.error) {
            alert("AI Error: " + data.error);
            setForecastData(null);
        } else {
            const demand = data.predicted_bed_demand;
            const mockForecastData = Array.from({length: 7}, (_, i) => ({
                day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
                demand: Math.max(20, demand - 10 + Math.random() * 20),
                admissions: Math.floor(Math.random() * 15),
                discharges: Math.floor(Math.random() * 12)
            }));
            setForecastData(mockForecastData);
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        alert("Failed to forecast bed demand");
    }
    setTimeout(() => setForecastLoading(false), 400);
};

    const handleStaff = async () => {
        setStaffLoading(true);
        try {
            const payload = {
                patient_load: staffData.load,
                department: staffData.dept,
                shift: staffData.shift
            };
            const res = await fetch(`${API_BASE}/hospital/staff`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
            const data = await res.json();
            if (data.error) {
                alert("Error: " + data.error);
                setStaffResult(null);
            } else {
                setStaffResult(data.allocation_decision);
            }
        } catch (err) {
            console.error("Staff Error:", err);
            alert("Failed to get staff allocation");
        }
        setTimeout(() => setStaffLoading(false), 400);
    };

    const handleDonorSearch = async () => {
        setDonorLoading(true);
        try {
            const payload = {
                receiver_age: parseInt(donorData.age),
                receiver_gender: donorData.gender,
                receiver_blood_type: donorData.blood,
                organ_type: donorData.organ,
                donor_age: 35,
                donor_gender: 'M',
                donor_blood_type: donorData.blood,
                location_distance: 5
            };
            const res = await fetch(`${API_BASE}/hospital/donors`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
            const data = await res.json();
            if (data.error) {
                alert("Error: " + data.error);
                setDonorList([]);
            } else {
                const mockDonors = [
                    { name: 'John Smith', blood: donorData.blood, location: 'Downtown Zone A', match_score: Math.floor(90 + Math.random() * 10) },
                    { name: 'Jane Doe', blood: donorData.blood, location: 'North Suburbs', match_score: Math.floor(85 + Math.random() * 15) },
                    { name: 'Mike Johnson', blood: donorData.blood, location: 'West District', match_score: Math.floor(80 + Math.random() * 20) }
                ];
                setDonorList(mockDonors);
            }
        } catch (err) {
            console.error("Donor Search Error:", err);
            alert("Failed to find compatible donors");
        }
        setTimeout(() => setDonorLoading(false), 400);
    };

    const handlePerf = async () => {
    setPerfLoading(true);
    try {
        const payload = {
            avg_response_time: parseFloat(perfData.response),
            treatment_success_rate: parseFloat(perfData.success),
            patient_satisfaction: parseFloat(perfData.satisfaction),
            resource_utilization: parseFloat(perfData.utilization),
            hospital_id: 1
        };
        const res = await fetch(`${API_BASE}/hospital/performance`, { 
            method: 'POST', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.error) {
            setPerfResult("Error: " + data.error);
        } else {
            setPerfResult(data.performance_cluster);
        }
    } catch (err) {
        console.error("Performance Error:", err);
        setPerfResult("Server Unreachable");
    }
    setTimeout(() => setPerfLoading(false), 400);
};

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in pb-10">
            
            {/* --- 1. TRIAGE SEVERITY --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                <div className="mb-4 border-b pb-2">
                    <h3 className="font-bold text-xl text-slate-800">Patient Triage Severity</h3>
                    <p className="text-sm text-gray-500">Enter incoming patient/alert data to predict severity level.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-5 mb-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Emergency Type</label>
                        <select className="w-full p-2.5 border border-gray-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                            value={triageData.type} onChange={e=>setTriageData({...triageData, type: e.target.value})}>
                            <option>Accident</option><option>Cardiac Arrest</option><option>Stroke</option><option>Trauma</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Patient Age</label>
                        <input type="number" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={triageData.age} onChange={e=>setTriageData({...triageData, age: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Heart Rate (bpm)</label>
                        <input type="number" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={triageData.heartRate} onChange={e=>setTriageData({...triageData, heartRate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Systolic BP</label>
                        <input type="number" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={triageData.bp} onChange={e=>setTriageData({...triageData, bp: e.target.value})} />
                    </div>
                </div>
                
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Distance from Hospital (km)</label>
                    <input type="number" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={triageData.distance} onChange={e=>setTriageData({...triageData, distance: e.target.value})} />
                </div>

                <button
                    onClick={handleTriage}
                    className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 ${triageLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={triageLoading}
                >
                    {triageLoading && (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                    )}
                    {triageLoading ? 'Predicting...' : 'Predict Severity'}
                </button>
                
                {triageResult && (
                    <div className={`mt-4 p-4 border rounded-lg text-center ${triageResult.color} animate-slide-in-up shadow-inner`}>
                        <p className="text-xs uppercase font-bold tracking-wide opacity-70">Prediction Result</p>
                        <p className="text-2xl font-extrabold">{triageResult.level} Priority</p>
                    </div>
                )}
            </div>

            {/* --- 2. AMBULANCE ETA --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                <div className="mb-4 border-b pb-2">
                    <h3 className="font-bold text-xl text-slate-800">Ambulance ETA & Route</h3>
                    <p className="text-sm text-gray-500">Get AI-powered ETA and optimal route for incoming patient.</p>
                </div>

                <div className="flex-grow flex flex-col justify-center">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Patient Pickup Location (Node)</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-sky-500 outline-none mb-6 text-lg" 
                        value={etaLocation} onChange={e=>setEtaLocation(e.target.value)}>
                        {validNodes.map(node => (
                            <option key={node} value={node}>{node}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleETA}
                        className={`w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-lg font-bold shadow-md transition flex items-center justify-center gap-2 ${etaLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        disabled={etaLoading}
                    >
                        {etaLoading && (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                        )}
                        {etaLoading ? 'Calculating...' : 'Calculate ETA & Route'}
                    </button>

                    {etaResult && (
                        <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center gap-4 shadow-sm animate-zoom-in">
                            <div className="bg-green-200 p-3 rounded-full text-green-700"><i className="fas fa-ambulance text-2xl"></i></div>
                            <div>
                                <p className="text-sm text-green-800 font-medium">Estimated Arrival</p>
                                <p className="text-3xl font-bold text-green-900">{etaResult}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- 3. BED DEMAND FORECAST (MULTIPLE GRAPHS) --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
                <div className="mb-6 border-b pb-2">
                    <h3 className="font-bold text-xl text-slate-800">Next Week Bed Demand Forecast</h3>
                    <p className="text-sm text-gray-500">Enter current metrics to generate detailed visualization.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Emergencies (This Week)</label>
                        <input className="w-full p-2.5 border border-gray-300 rounded-lg" value={bedData.emergencies} onChange={e=>setBedData({...bedData, emergencies: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Disease Cases (This Week)</label>
                        <input className="w-full p-2.5 border border-gray-300 rounded-lg" value={bedData.cases} onChange={e=>setBedData({...bedData, cases: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Current Bed Occupancy (%)</label>
                        <input className="w-full p-2.5 border border-gray-300 rounded-lg font-bold text-orange-600" value={bedData.occupancy} onChange={e=>setBedData({...bedData, occupancy: e.target.value})} />
                    </div>
                </div>

                <button
                    onClick={handleForecast}
                    className={`w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold shadow mb-6 flex items-center justify-center gap-2 ${forecastLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={forecastLoading}
                >
                    {forecastLoading && (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                    )}
                    {forecastLoading ? 'Forecasting...' : 'Forecast Bed Demand'}
                </button>

                {/* GRAPH VISUALIZATION AREA - MULTIPLE GRAPHS */}
                {forecastData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        {/* Graph 1: Line Chart (Occupancy) */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="text-sm font-bold text-gray-600 mb-4 text-center">Predicted Occupancy Trend (%)</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={forecastData}>
                                        <defs>
                                            <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="day" style={{fontSize: '12px'}} />
                                        <YAxis domain={[0, 100]} style={{fontSize: '12px'}} />
                                        <Tooltip contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                                        <Area type="monotone" dataKey="demand" stroke="#f97316" fillOpacity={1} fill="url(#colorDemand)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Graph 2: Bar Chart (Volume) */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="text-sm font-bold text-gray-600 mb-4 text-center">Predicted Volume (Admit vs Discharge)</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={forecastData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="day" style={{fontSize: '12px'}} />
                                        <YAxis style={{fontSize: '12px'}} />
                                        <Tooltip cursor={{fill: 'transparent'}} />
                                        <Legend wrapperStyle={{paddingTop: '10px'}} />
                                        <Bar dataKey="admissions" name="Admissions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="discharges" name="Discharges" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-40 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                        <p>Visualization Area (Graphs will appear here)</p>
                    </div>
                )}
            </div>

            {/* --- 4. STAFF ALLOCATION --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="mb-4 border-b pb-2">
                    <h3 className="font-bold text-xl text-slate-800">AI Staff Allocation</h3>
                    <p className="text-sm text-gray-500">Get optimal staff allocation suggestions based on load.</p>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                        <select className="w-full p-2 border rounded-lg bg-slate-50" value={staffData.dept} onChange={e=>setStaffData({...staffData, dept: e.target.value})}><option>ER</option><option>ICU</option><option>General Ward</option></select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Patient Load</label>
                        <select className="w-full p-2 border rounded-lg bg-slate-50" value={staffData.load} onChange={e=>setStaffData({...staffData, load: e.target.value})}><option>High Load</option><option>Medium</option><option>Low</option></select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Shift</label>
                        <select className="w-full p-2 border rounded-lg bg-slate-50" value={staffData.shift} onChange={e=>setStaffData({...staffData, shift: e.target.value})}><option>Day</option><option>Night</option></select>
                    </div>
                </div>

                <button
                    onClick={handleStaff}
                    className={`w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold shadow flex items-center justify-center gap-2 ${staffLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={staffLoading}
                >
                    {staffLoading && (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                    )}
                    {staffLoading ? 'Allocating...' : 'Get Allocation'}
                </button>
                {staffResult && <div className="mt-4 p-4 bg-purple-50 text-purple-900 border border-purple-200 font-bold rounded-lg text-center animate-pulse-once">{staffResult}</div>}
            </div>

            {/* --- 5. PERFORMANCE CLUSTER --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="mb-4 border-b pb-2">
                    <h3 className="font-bold text-xl text-slate-800">Hospital Performance Cluster</h3>
                    <p className="text-sm text-gray-500">Benchmark your performance against national standards.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Avg. Response Time (mins)</label>
                        <input className="w-full p-2.5 border rounded-lg" value={perfData.response} onChange={e=>setPerfData({...perfData, response: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Success Rate (%)</label>
                        <input className="w-full p-2.5 border rounded-lg" value={perfData.success} onChange={e=>setPerfData({...perfData, success: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Patient Satisfaction (1-5)</label>
                        <input className="w-full p-2.5 border rounded-lg" value={perfData.satisfaction} onChange={e=>setPerfData({...perfData, satisfaction: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Resource Utilization (%)</label>
                        <input className="w-full p-2.5 border rounded-lg" value={perfData.utilization} onChange={e=>setPerfData({...perfData, utilization: e.target.value})} />
                    </div>
                </div>

                <button
                    onClick={handlePerf}
                    className={`w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-bold shadow flex items-center justify-center gap-2 ${perfLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={perfLoading}
                >
                    {perfLoading && (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                    )}
                    {perfLoading ? 'Analyzing...' : 'Analyze Performance'}
                </button>
                {perfResult && (
    <div className="mt-4 p-4 bg-teal-50 text-teal-900 border border-teal-200 font-bold rounded-lg text-center">
        {/* Safe rendering: ensures we are not trying to render a whole object */}
        {typeof perfResult === 'object' ? JSON.stringify(perfResult.error) : perfResult}
    </div>
)}
            </div>

            {/* --- 6. DONOR MATCHFINDER --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
                <div className="mb-4 border-b pb-2">
                    <h3 className="font-bold text-xl text-slate-800">AI Donor Matchfinder</h3>
                    <p className="text-sm text-gray-500">Find the most compatible donors from the public network for a patient in need.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Patient Age</label>
                        <input className="w-full p-2.5 border rounded-lg" value={donorData.age} onChange={e=>setDonorData({...donorData, age: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Patient Gender</label>
                        <select className="w-full p-2.5 border rounded-lg bg-slate-50" value={donorData.gender} onChange={e=>setDonorData({...donorData, gender: e.target.value})}><option>Male</option><option>Female</option></select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Blood Group</label>
                        <select className="w-full p-2.5 border rounded-lg bg-slate-50" value={donorData.blood} onChange={e=>setDonorData({...donorData, blood: e.target.value})}><option>A+</option><option>O+</option><option>B+</option><option>AB+</option></select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Organ/Resource</label>
                        <select className="w-full p-2.5 border rounded-lg bg-slate-50" value={donorData.organ} onChange={e=>setDonorData({...donorData, organ: e.target.value})}><option>Kidney</option><option>Liver</option><option>Heart</option></select>
                    </div>
                </div>

                <button
                    onClick={handleDonorSearch}
                    className={`w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow mb-6 flex items-center justify-center gap-2 ${donorLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={donorLoading}
                >
                    {donorLoading && (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                    )}
                    {donorLoading ? 'Finding...' : 'Find Compatible Donors'}
                </button>

                {/* Donor List Table */}
                {donorList && (
                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-100 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-slate-700">Donor Name</th>
                                    <th className="px-4 py-3 font-bold text-slate-700">Blood Group</th>
                                    <th className="px-4 py-3 font-bold text-slate-700">Location</th>
                                    <th className="px-4 py-3 font-bold text-slate-700">Match Score</th>
                                    <th className="px-4 py-3 font-bold text-slate-700 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {donorList.length === 0 ? (
                                    <tr><td colSpan="5" className="p-4 text-center text-gray-500">No compatible donors found.</td></tr>
                                ) : donorList.map((donor, i) => (
                                    <tr key={i} className="hover:bg-white transition">
                                        <td className="px-4 py-3 font-medium text-slate-800">{donor.name}</td>
                                        <td className="px-4 py-3">{donor.blood}</td>
                                        <td className="px-4 py-3 text-gray-500">{donor.location}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${donor.match_score > 90 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {donor.match_score}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => alert(`Notified ${donor.name}`)} className="text-indigo-600 font-bold hover:underline">
                                                Notify <i className="fas fa-paper-plane ml-1"></i>
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

export default HospitalAnalytics;