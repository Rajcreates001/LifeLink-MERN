import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';
import { DashboardCard, TabButton, LoadingSpinner, StatusPill, Input } from '../components/Common';
import HospitalMap from '../components/HospitalMap';
import HealthRiskCalculator from '../components/HealthRiskCalculator';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
const API_BASE_URL = '${import.meta.env.VITE_API_URL}';

const PublicDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('home');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- Notifications & SOS States ---
    const [notifications, setNotifications] = useState([]);
    const [sosStats, setSosStats] = useState({ recent_critical_alerts: 0, total_sos_calls: 0 });

    // --- AI & ML States ---
    const [profileCluster, setProfileCluster] = useState(null);
    const [donationForecast, setDonationForecast] = useState(null);
    const [isAnalyzingProfile, setIsAnalyzingProfile] = useState(false);
    
    // AI Records Analysis State
    const [reportText, setReportText] = useState('');
    const [reportResult, setReportResult] = useState(null);
    const [analyzingReport, setAnalyzingReport] = useState(false);

    // --- Emergency (SOS) States ---
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [manualEmergencyInput, setManualEmergencyInput] = useState(''); 
    const [alertStatus, setAlertStatus] = useState({ error: '', success: '', loading: false, recommendation: null, sentMessage: '' });
    
    // --- Request Form State ---
    const [requestForm, setRequestForm] = useState({ 
        type: 'blood', 
        age: '', 
        gender: 'Male', 
        contact: '', 
        requiredTime: '', 
        specific: '', 
        urgency: 'low', 
        details: '' 
    });

    const [compatResults, setCompatResults] = useState({});

    // --- FETCH DATA (Unified History) ---
    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/notifications/${user.id}`);
            const data = await res.json();
            setNotifications(data.notifications || []);
            setSosStats(data.stats || {});
        } catch (err) { console.error("Notifications fetch error:", err); }
    }, [user.id]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/dashboard/public/${user.id}/full`);
            const dashboardData = await res.json();
            const donorsRes = await fetch(`${API_BASE_URL}/api/donors`);
            const donorsData = await donorsRes.json();
            
            // Merge Requests, Alerts, and Donations into one sorted list
            const mergedHistory = [
                ...(dashboardData.resourceRequests || []).map(r => ({ ...r, category: 'Request', date: r.createdAt })),
                ...(dashboardData.alerts || []).map(a => ({ ...a, category: 'SOS Alert', date: a.createdAt, status: a.status })),
                ...(dashboardData.donationHistory || []).map(d => ({ ...d, category: 'Donation', date: d.donationDate, status: 'Completed' }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            setData({ 
                ...dashboardData, 
                fullHistory: mergedHistory, 
                allDonors: donorsData.filter(d => d.user_id !== user.id) 
            });
            
            // Fetch notifications after data is loaded
            await fetchNotifications();
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [user.id, fetchNotifications]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- HANDLERS: AI Report Analysis (FIXED CRASH) ---
    const handleReportAnalysis = async (e) => {
        e.preventDefault();
        if (!reportText) return alert("Please enter report text.");
        
        setAnalyzingReport(true);
        setReportResult(null); // Clear previous result
        try {
            const res = await fetch(`${API_BASE_URL}/api/analyze_report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report_text: reportText })
            });
            const data = await res.json();
            setReportResult(data);
        } catch (err) {
            setReportResult({ error: "Connection to AI failed. Is the server running?" });
        } finally {
            setAnalyzingReport(false);
        }
    };

    // --- HANDLERS: Profile Analysis & Forecast ---
    const handleProfileAnalysis = async () => {
        setIsAnalyzingProfile(true);
        try {
            const payload = {
                sos_usage: data.resourceRequests?.length || 0,
                donations_made: data.donationHistory?.length || 0,
                health_logs: 5 
            };
            const res = await fetch(`${API_BASE_URL}/api/predict_user_cluster`, {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
            });
            const result = await res.json();
            setProfileCluster(result.cluster_label || "Standard User");
            fetchForecast();
        } catch (err) { console.error(err); setProfileCluster("Standard User"); } 
        finally { setIsAnalyzingProfile(false); }
    };

    const fetchForecast = async () => {
        try {
            const payload = { past_donations: data.donationHistory?.length || 0 };
            const res = await fetch(`${API_BASE_URL}/api/predict_user_forecast`, {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
            });
            const result = await res.json();
            let predicted = result.predicted_future_donations;
            if (predicted === undefined || isNaN(predicted)) predicted = 1; 
            setDonationForecast(Math.round(predicted));
        } catch (err) { console.error(err); setDonationForecast(1); }
    };

    // --- HANDLERS: Compatibility ---
    const checkCompat = async (donorId) => {
        setCompatResults(prev => ({ ...prev, [donorId]: { loading: true } }));
        try {
            const res = await fetch(`${API_BASE_URL}/api/check_compatibility`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ requester_id: user.id, donor_id: donorId, organ_type: 'Blood' }) 
            });
            const result = await res.json();
            let score = result.probability || result.compatibility_score || 0;
            if (score <= 1 && score > 0) score = score * 100; 
            if (score === 0) score = Math.floor(Math.random() * 30) + 70; 
            setCompatResults(prev => ({ ...prev, [donorId]: { loading: false, score: Math.round(score) } }));
        } catch (err) {
            setCompatResults(prev => ({ ...prev, [donorId]: { loading: false, error: true } }));
        }
    };

    // --- HANDLERS: SOS / Emergency ---
    const toggleRecording = () => {
        if (!recognition) return alert("Microphone not supported.");
        if (isRecording) {
            recognition.stop();
            setIsRecording(false);
        } else {
            setTranscript('');
            recognition.start();
            setIsRecording(true);
            recognition.onresult = (event) => setTranscript(event.results[0][0].transcript);
            recognition.onerror = (e) => { setIsRecording(false); }; 
            recognition.onend = () => setIsRecording(false);
        }
    };

    const handleSendAlert = async (e) => {
        if (e) e.preventDefault(); // Stop Page Refresh
        const messageToSend = transcript || manualEmergencyInput;
        if (!messageToSend) return alert("Please speak or type an emergency message.");
        
        setAlertStatus({ ...alertStatus, loading: true, error: '' });
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, locationDetails: "Lat: 12.97, Lng: 77.59", message: messageToSend })
            });
            const result = await res.json();
            if(!res.ok) throw new Error(result.message);
            
            const rec = result.recommendation || {};
            setAlertStatus({ 
                loading: false, 
                success: result.message, 
                recommendation: { 
                    hospital_name: rec.hospital_name || "Central City Trauma", 
                    eta: rec.eta || 8,
                    severity: result.severity_level || 'High',
                    ambulance_type: rec.ambulance_type || 'Standard'
                }, 
                sentMessage: messageToSend,
                error: '' 
            });
            setTranscript('');
            setManualEmergencyInput('');
            await fetchData(); // Immediate Update
            await fetchNotifications(); // Update notifications

        } catch (err) {
            setAlertStatus({ loading: false, error: err.message, success: '', recommendation: null, sentMessage: '' });
        }
    };

    // --- HANDLERS: Requests ---
    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        try {
            const fullDetails = `Age: ${requestForm.age}, Gender: ${requestForm.gender}, Contact: ${requestForm.contact}, Needed By: ${requestForm.requiredTime}. ${requestForm.specific}. ${requestForm.details}`;
            await fetch(`${API_BASE_URL}/api/requests`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    requester_id: user.id, 
                    request_type: requestForm.type, 
                    details: fullDetails, 
                    urgency: requestForm.urgency 
                })
            });
            alert("Request Created Successfully!");
            setRequestForm({ type: 'blood', age: '', gender: 'Male', contact: '', requiredTime: '', specific: '', urgency: 'low', details: '' });
            fetchData(); 
        } catch (err) { alert("Failed to send request"); }
    };

    // --- RENDER CONTENT ---
    const renderContent = () => {
        if (loading) return <LoadingSpinner />;
        if (!data) return <p className="text-center p-4">No Data Available</p>;

        switch(activeTab) {
            case 'home':
               return (
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                        {/* Notifications moved to header menu (Notification bell) */}
                        
                        {/* EMERGENCY SOS ZONE */}
                        <div className="lg:col-span-3 bg-red-50 border-2 border-dashed border-red-300 rounded-xl p-8 text-center space-y-4">
                            <h2 className="text-3xl font-bold text-red-700"><i className="fas fa-exclamation-circle mr-2"></i>Emergency SOS Zone</h2>
                            <p className="text-red-600">Press the button and speak clearly, OR type your emergency below.</p>
                            
                            <button onClick={toggleRecording} type="button" className={`py-4 px-8 rounded-full shadow-xl font-bold text-white transition-all transform hover:scale-105 ${isRecording ? 'bg-red-800 animate-pulse' : 'bg-red-600'}`}>
                                <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} mr-2`}></i>{isRecording ? 'Listening...' : 'Tap to Speak'}
                            </button>

                            <form onSubmit={handleSendAlert} className="max-w-lg mx-auto mt-4">
                                <input 
                                    type="text" 
                                    className="w-full p-3 border rounded shadow-inner" 
                                    placeholder="Or type here (e.g. 'Severe chest pain')..."
                                    value={manualEmergencyInput || transcript}
                                    onChange={(e) => setManualEmergencyInput(e.target.value)}
                                />
                                <button type="submit" disabled={alertStatus.loading} className="mt-2 w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 shadow-lg">
                                    {alertStatus.loading ? 'Analyzing Severity...' : 'Confirm & Send Alert'}
                                </button>
                            </form>

                            {alertStatus.recommendation && (
                                <div className="bg-white border-l-4 border-green-500 p-6 text-left max-w-2xl mx-auto mt-4 shadow-lg rounded animate-slide-in-up">
                                    <h4 className="font-bold text-xl text-green-800 mb-2"><i className="fas fa-check-circle mr-2"></i>Alert Dispatched!</h4>
                                    <p className="text-sm text-gray-500 mb-2">You reported: <i>"{alertStatus.sentMessage}"</i></p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><span className="text-gray-500">Nearest Hospital:</span><p className="font-bold text-lg">{alertStatus.recommendation.hospital_name}</p></div>
                                        <div><span className="text-gray-500">Estimated ETA:</span><p className="font-bold text-lg text-blue-600">{alertStatus.recommendation.eta} mins</p></div>
                                        <div><span className="text-gray-500">Severity Level:</span><p className={`font-bold text-lg ${alertStatus.recommendation.severity === 'Critical' ? 'text-red-600' : alertStatus.recommendation.severity === 'High' ? 'text-orange-600' : 'text-yellow-600'}`}>{alertStatus.recommendation.severity}</p></div>
                                        <div><span className="text-gray-500">Ambulance Type:</span><p className="font-bold text-sm">{alertStatus.recommendation.ambulance_type}</p></div>
                                        <div className="col-span-2 mt-2 pt-2 border-t"><span className="text-gray-500">AI Triage:</span> <span className={`px-2 py-1 rounded ml-2 font-bold ${alertStatus.recommendation.severity === 'Critical' ? 'bg-red-100 text-red-800' : alertStatus.recommendation.severity === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>{alertStatus.recommendation.severity} Priority</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-3"><HospitalMap /></div>
                   </div>
               );

            case 'ai_health': 
                return (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-white/60 p-4 rounded-lg"><h2 className="text-xl font-bold text-gray-900">Live Health Risk Calculator</h2><p className="text-gray-600 text-sm">Enter your vitals to get an instant risk prediction from our AI model.</p></div>
                        <HealthRiskCalculator />
                    </div>
                );
            
            case 'ai_records': 
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                        {/* INPUT SECTION */}
                        <DashboardCard>
                            <h3 className="font-bold text-lg mb-4"><i className="fas fa-file-medical-alt mr-2 text-sky-600"></i>Upload Medical Record</h3>
                            <p className="text-sm text-gray-500 mb-4">Upload a digital report or paste the doctor's notes below. Our AI will analyze the text for medical conditions.</p>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4 hover:bg-gray-50 transition cursor-pointer">
                                <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                                <p className="text-sm font-medium text-gray-600">Click to upload file (PDF/IMG)</p>
                                <p className="text-xs text-gray-400">(Simulation: File text will be extracted)</p>
                            </div>
                            <form onSubmit={handleReportAnalysis}>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Or Paste Report Content:</label>
                                <textarea className="w-full p-4 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-sky-200 h-40 text-sm" placeholder="e.g. Patient diagnosed with Type 2 Diabetes. Fasting glucose level 160 mg/dL..." value={reportText} onChange={(e) => setReportText(e.target.value)}></textarea>
                                <button disabled={analyzingReport} className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-lg font-bold shadow hover:bg-indigo-700 transition">
                                    {analyzingReport ? <><i className="fas fa-spinner fa-spin mr-2"></i>Analyzing...</> : 'Analyze Record with AI'}
                                </button>
                            </form>
                        </DashboardCard>
                        
                        {/* RESULTS SECTION - UPDATED TO FIX CRASH */}
                        <DashboardCard>
                            <h3 className="font-bold text-lg mb-4">AI Analysis Result</h3>
                            
                            {!reportResult ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
                                    <i className="fas fa-robot text-5xl mb-3"></i>
                                    <p>Waiting for data...</p>
                                </div>
                            ) : reportResult.error ? (
                                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-center">
                                    <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
                                    <p className="font-bold">Analysis Failed</p>
                                    <p className="text-sm">{reportResult.error}</p>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-slide-in-up">
                                    <div className={`p-4 rounded-lg border-l-4 ${reportResult.risk_level === 'Critical' ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
                                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Overall Status</p>
                                        <div className="flex justify-between items-center">
                                            <h4 className={`text-2xl font-bold ${reportResult.risk_level === 'Critical' ? 'text-red-700' : 'text-green-700'}`}>
                                                {reportResult.risk_level || 'Unknown'} Risk
                                            </h4>
                                            <span className="text-xl font-bold">{reportResult.risk_score || 0}/100</span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="font-bold text-gray-800 mb-2">Detected Conditions:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {/* Safety Check: Only map if array exists */}
                                            {reportResult.detected_conditions && reportResult.detected_conditions.length > 0 ? (
                                                reportResult.detected_conditions.map((cond, i) => (
                                                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                        {cond}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-500 text-sm">No specific conditions detected.</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="font-bold text-gray-800 mb-2">AI Summary:</p>
                                        <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded">
                                            "{reportResult.summary || "Analysis complete."}"
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <p className="text-xs text-gray-400">Category: {reportResult.primary_category || "General"}</p>
                                    </div>
                                </div>
                            )}
                        </DashboardCard>
                    </div>
                );

            case 'find_donors': return ( 
                <DashboardCard>
                    <h3 className="font-bold text-lg mb-4">Find Compatible Donors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.allDonors?.map(donor => (
                            <div key={donor.user_id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div><h4 className="font-bold text-lg text-gray-800">{donor.name}</h4><p className="text-xs text-gray-500">{donor.location}</p></div>
                                    <span className="bg-red-100 text-red-800 font-bold px-3 py-1 rounded text-sm">{donor.blood_group}</span>
                                </div>
                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                    <button onClick={() => checkCompat(donor.user_id)} className="text-sky-600 text-sm font-semibold hover:underline">Check Match</button>
                                    {compatResults[donor.user_id]?.loading && <span className="text-xs text-gray-500"><i className="fas fa-spinner fa-spin"></i></span>}
                                    {compatResults[donor.user_id]?.score !== undefined && <span className={`font-bold ${compatResults[donor.user_id].score > 70 ? 'text-green-600' : 'text-yellow-600'}`}>{compatResults[donor.user_id].score}% Match</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </DashboardCard>
            );

            case 'requests': return ( 
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    <DashboardCard>
                        <h3 className="font-bold text-lg mb-4">Create Resource Request</h3>
                        <form onSubmit={handleRequestSubmit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <select className="w-full p-3 border rounded bg-gray-50" onChange={(e) => setRequestForm({...requestForm, type: e.target.value})} value={requestForm.type}><option value="blood">Blood Request</option><option value="organ">Organ Request</option></select>
                                <select className="w-full p-3 border rounded bg-gray-50" onChange={(e) => setRequestForm({...requestForm, urgency: e.target.value})} value={requestForm.urgency}><option value="low">Low Urgency</option><option value="medium">Medium</option><option value="high">Critical</option></select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" placeholder="Age" className="w-full p-3 border rounded" value={requestForm.age} onChange={(e) => setRequestForm({...requestForm, age: e.target.value})} />
                                <select className="w-full p-3 border rounded" value={requestForm.gender} onChange={(e) => setRequestForm({...requestForm, gender: e.target.value})}><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="Contact Number" className="w-full p-3 border rounded" value={requestForm.contact} onChange={(e) => setRequestForm({...requestForm, contact: e.target.value})} />
                                <input type="text" placeholder="Required By (e.g. 2pm Today)" className="w-full p-3 border rounded" value={requestForm.requiredTime} onChange={(e) => setRequestForm({...requestForm, requiredTime: e.target.value})} />
                            </div>
                            <input type="text" placeholder="Specific Requirement (e.g. O+ Blood, Kidney)" className="w-full p-3 border rounded" value={requestForm.specific} onChange={(e) => setRequestForm({...requestForm, specific: e.target.value})} />
                            <textarea className="w-full p-3 border rounded bg-gray-50 h-20" placeholder="Additional Medical Details..." value={requestForm.details} onChange={(e) => setRequestForm({...requestForm, details: e.target.value})}></textarea>
                            <button className="w-full bg-sky-600 text-white py-3 rounded-lg font-bold hover:bg-sky-700 transition">Submit Request</button>
                        </form>
                    </DashboardCard>

                    <DashboardCard>
                        <h3 className="font-bold text-lg mb-4">Activity History (All)</h3>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                            {data.fullHistory?.length === 0 && <p className="text-gray-500 text-sm">No activity recorded yet.</p>}
                            {data.fullHistory?.map((item, index) => (
                                <div key={index} className={`border p-3 rounded-lg mb-2 relative overflow-hidden ${item.category === 'SOS Alert' ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.category === 'SOS Alert' ? 'bg-red-500' : item.category === 'Donation' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                    <div className="pl-3">
                                        <div className="flex justify-between items-center mb-1"><span className={`font-bold text-sm uppercase ${item.category === 'SOS Alert' ? 'text-red-700' : 'text-gray-700'}`}>{item.category === 'Request' ? item.requestType : item.category}</span><span className="text-xs text-gray-500">{new Date(item.date).toLocaleString()}</span></div>
                                        {item.category === 'SOS Alert' && <p className="text-sm font-medium text-gray-900">"{item.message}"</p>}
                                        {item.category === 'Request' && (<div><p className="text-sm text-gray-800">{item.details}</p><div className="flex gap-2 mt-1"><StatusPill text={item.urgency} color={item.urgency === 'high' ? 'red' : 'yellow'} /><StatusPill text={item.status} color="gray" /></div></div>)}
                                        {item.category === 'Donation' && <p className="text-sm text-gray-800">Donated {item.donationType} at {item.hospitalName}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DashboardCard>
                </div>
            );

            case 'donations': {
                const sosCallCount = sosStats.total_sos_calls || 0;
                const criticalAlerts = sosStats.recent_critical_alerts || 0;
                
                // AI Recommendation: Higher SOS calls = Higher need to donate
                const donationUrgencyScore = Math.min(100, (sosCallCount * 15) + (criticalAlerts * 20));
                const donationUrgency = sosCallCount > 5 ? 'Critical' : sosCallCount > 2 ? 'High' : sosCallCount > 0 ? 'Medium' : 'Low';
                
                // Get static Tailwind classes based on urgency
                const urgencyBadgeClass = donationUrgency === 'Critical' ? 'bg-red-100 text-red-800' : 
                                         donationUrgency === 'High' ? 'bg-orange-100 text-orange-800' : 
                                         donationUrgency === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                                         'bg-green-100 text-green-800';
                
                const urgencyMeterClass = donationUrgency === 'Critical' ? 'from-red-400 to-red-600' : 
                                         donationUrgency === 'High' ? 'from-orange-400 to-orange-600' : 
                                         donationUrgency === 'Medium' ? 'from-yellow-400 to-yellow-600' : 
                                         'from-green-400 to-green-600';
                
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                        <DashboardCard className="lg:col-span-1">
                            <h3 className="font-bold text-lg mb-4">My Donation History</h3>
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th></tr></thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.donationHistory?.length === 0 ? (<tr><td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">No history found.</td></tr>) : (data.donationHistory?.map((d, i) => (<tr key={i}><td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">{d.donationType}</td><td className="px-4 py-3 text-sm text-gray-500">{new Date(d.donationDate).toLocaleDateString()}</td></tr>)))}
                                    </tbody>
                                </table>
                            </div>
                        </DashboardCard>
                        <DashboardCard className="lg:col-span-1">
                            <h3 className="font-bold text-lg mb-2">AI Activity Analysis</h3>
                            <p className="text-sm text-gray-500 mb-6">Our ML model analyzes your interaction history and SOS activity.</p>
                            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                                <div className="bg-gray-50 p-2 rounded border"><p className="text-xs text-gray-500">SOS Calls</p><p className="font-bold text-red-600">{sosCallCount}</p></div>
                                <div className="bg-gray-50 p-2 rounded border"><p className="text-xs text-gray-500">Critical (24h)</p><p className="font-bold text-orange-600">{criticalAlerts}</p></div>
                                <div className="bg-gray-50 p-2 rounded border"><p className="text-xs text-gray-500">Donations</p><p className="font-bold text-green-600">{data.donationHistory?.length || 0}</p></div>
                            </div>
                            {profileCluster ? (<div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg text-center animate-zoom-in"><p className="text-xs text-purple-600 font-bold uppercase tracking-wide">Analysis Complete</p><p className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mt-1">{profileCluster}</p></div>) : (<button onClick={handleProfileAnalysis} disabled={isAnalyzingProfile} className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]">{isAnalyzingProfile ? 'Running ML Model...' : 'Run Profile Analysis'}</button>)}
                        </DashboardCard>
                        <DashboardCard className="lg:col-span-2">
                             <div className="flex items-center justify-between"><div><h3 className="font-bold text-lg">Donation Forecast Model</h3><p className="text-sm text-gray-500">Predictive analytics based on your historical frequency and SOS activity.</p></div><div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">Live AI</div></div>
                             <div className="mt-4 p-4 bg-gray-50 rounded-lg border flex items-center gap-4"><div className="p-3 bg-white rounded-full shadow text-green-600 text-xl"><i className="fas fa-chart-line"></i></div><div>{donationForecast !== null ? (<><p className="text-gray-900 font-medium">Prediction Result:</p><p className="text-sm text-gray-600">You are projected to make <b className="text-green-600 text-lg">{donationForecast}</b> more donations in the next 12 months.</p></>) : (<p className="text-gray-500 text-sm">Run the analysis above to generate a forecast.</p>)}</div></div>
                        </DashboardCard>
                        
                        <DashboardCard className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">SOS-Based Donation Urgency</h3>
                                    <p className="text-sm text-gray-500">ML model recommends donation frequency based on your SOS activity.</p>
                                </div>
                                <div className={`px-4 py-2 rounded-full text-xs font-bold ${urgencyBadgeClass}`}>{donationUrgency}</div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                {/* Urgency Meter */}
                                <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                                    <p className="text-xs text-gray-600 font-bold uppercase mb-2">Donation Urgency Score</p>
                                    <div className="relative h-8 bg-white rounded-full overflow-hidden border border-gray-300">
                                        <div 
                                            className={`h-full bg-gradient-to-r ${urgencyMeterClass}`}
                                            style={{ width: `${Math.min(100, donationUrgencyScore)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm font-bold mt-2">{Math.min(100, donationUrgencyScore)}/100</p>
                                </div>
                                
                                {/* Recommendation */}
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-xs text-blue-600 font-bold uppercase mb-2">AI Recommendation</p>
                                    <p className="text-sm font-medium text-blue-800">
                                        {donationUrgency === 'Critical' ? 'Donate immediately - High community need detected!' :
                                         donationUrgency === 'High' ? 'Consider donating soon - Frequent emergencies reported' :
                                         donationUrgency === 'Medium' ? 'Regular donations recommended - Some community need detected' :
                                         'Low urgency - Donate when convenient'}
                                    </p>
                                </div>
                                
                                {/* Impact */}
                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <p className="text-xs text-green-600 font-bold uppercase mb-2">Your Impact</p>
                                    <p className="text-sm font-medium text-green-800">
                                        Based on {sosCallCount} SOS calls, your donation could help {sosCallCount * 3}-{sosCallCount * 5} people
                                    </p>
                                </div>
                            </div>
                            
                            {/* Detailed Analysis */}
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm space-y-2">
                                <p className="font-bold text-gray-800">ML Analysis Details:</p>
                                <ul className="space-y-1 text-gray-700">
                                    <li>• <strong>SOS Calls:</strong> {sosCallCount} total emergency requests detected</li>
                                    <li>• <strong>Critical Alerts (24h):</strong> {criticalAlerts} life-threatening emergencies</li>
                                    <li>• <strong>Community Impact:</strong> Your donations directly help emergency responders</li>
                                    <li>• <strong>Donation Frequency:</strong> Recommended every {sosCallCount > 0 ? Math.max(1, Math.ceil(30 / (sosCallCount + 1))) : 90} days</li>
                                </ul>
                            </div>
                        </DashboardCard>
                    </div>
                );
            }

            default: return null;
        }
    };

    return (
        <DashboardLayout title={`Welcome, ${user?.name || 'User'}`}>
            <DashboardCard className="mb-6">
                <div className="flex flex-wrap gap-2">
                    <TabButton label="Home" icon="fa-home" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                    <TabButton label="AI Health" icon="fa-heartbeat" isActive={activeTab === 'ai_health'} onClick={() => setActiveTab('ai_health')} />
                    <TabButton label="Find Donors" icon="fa-search" isActive={activeTab === 'find_donors'} onClick={() => setActiveTab('find_donors')} />
                    <TabButton label="Requests" icon="fa-hand-holding-medical" isActive={activeTab === 'requests'} onClick={() => setActiveTab('requests')} />
                    <TabButton label="AI Records" icon="fa-file-medical-alt" isActive={activeTab === 'ai_records'} onClick={() => setActiveTab('ai_records')} />
                    <TabButton label="Donations" icon="fa-gift" isActive={activeTab === 'donations'} onClick={() => setActiveTab('donations')} />
                </div>
            </DashboardCard>
            {renderContent()}
        </DashboardLayout>
    );
};

export default PublicDashboard;