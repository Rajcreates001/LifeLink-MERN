import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // <--- 1. NEW IMPORT
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Mock Data
const MOCK_PATIENTS = [
    { _id: 'mock-1', name: 'John Doe', age: 45, gender: 'Male', dept: 'Cardiology', room: 'ICU-04', admitDate: '2025-01-10', condition: 'Cardiac Arrest', severity: 'Critical', oxygen: 92, heartRate: 110, status: 'Admitted' },
    { _id: 'mock-2', name: 'Sarah Smith', age: 29, gender: 'Female', dept: 'Trauma', room: 'Ward-A2', admitDate: '2025-01-12', condition: 'Fracture - Leg', severity: 'Moderate', oxygen: 98, heartRate: 72, status: 'Stable' },
    { _id: 'mock-3', name: 'Mike Ross', age: 62, gender: 'Male', dept: 'Neurology', room: 'ICU-01', admitDate: '2025-01-08', condition: 'Stroke', severity: 'High', oxygen: 88, heartRate: 65, status: 'Critical' },
    { _id: 'mock-4', name: 'Emily Clark', age: 34, gender: 'Female', dept: 'General', room: 'Ward-B1', admitDate: '2025-01-14', condition: 'Viral Fever', severity: 'Stable', oxygen: 99, heartRate: 80, status: 'Stable' },
    { _id: 'mock-5', name: 'David Miller', age: 55, gender: 'Male', dept: 'Cardiology', room: 'ICU-02', admitDate: '2025-01-15', condition: 'Angina', severity: 'High', oxygen: 94, heartRate: 95, status: 'Observation' },
];

// --- 2. HELPER: PORTAL COMPONENT ---
// This moves the modal outside the dashboard layout so it sits on top of the navbar
const ModalPortal = ({ children }) => {
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-fade-in"></div>
            <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl shadow-2xl">
                {children}
            </div>
        </div>,
        document.body
    );
};

const HospitalPatients = () => {
    const { user } = useAuth();
    
    // State
    const [patients, setPatients] = useState(MOCK_PATIENTS);
    const [loading, setLoading] = useState(false);
    
    // UI States
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isAdmitOpen, setIsAdmitOpen] = useState(false);
    
    // AI States
    const [aiRecovery, setAiRecovery] = useState(null);
    const [aiStay, setAiStay] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false);

    // Form State
    const [newPatient, setNewPatient] = useState({
        name: '', age: '', gender: 'Male', dept: 'General', room: '', condition: '', severity: 'Stable', oxygen: '98', heartRate: '80', bp: '120/80'
    });

    // 1. Fetch Patients
    useEffect(() => {
        const fetchRealPatients = async () => {
            if (!user?.id) return;
            try {
                const res = await fetch(`${API_BASE}/dashboard/hospital/patients/${user.id}`);
                const dbPatients = await res.json();
                if (Array.isArray(dbPatients)) {
                    setPatients([...dbPatients, ...MOCK_PATIENTS]);
                }
            } catch (err) { console.error("Fetch Error:", err); } 
        };
        fetchRealPatients();
    }, [user?.id]);

    // 2. Chart Helpers
    const getDeptData = () => {
        const counts = {};
        patients.forEach(p => { counts[p.dept] = (counts[p.dept] || 0) + 1; });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    };

    const getAgeData = () => {
        const groups = { '0-18': 0, '19-40': 0, '41-60': 0, '60+': 0 };
        patients.forEach(p => {
            if (p.age <= 18) groups['0-18']++;
            else if (p.age <= 40) groups['19-40']++;
            else if (p.age <= 60) groups['41-60']++;
            else groups['60+']++;
        });
        return Object.keys(groups).map(key => ({ name: key, count: groups[key] }));
    };

    // 3. Admit Submit
    const handleAdmitSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/dashboard/hospital/patient/admit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newPatient, hospitalId: user.id })
            });
            const addedPatient = await res.json();
            
            if (res.ok) {
                setPatients([addedPatient, ...patients]); 
                setIsAdmitOpen(false);
                setNewPatient({ name: '', age: '', gender: 'Male', dept: 'General', room: '', condition: '', severity: 'Stable', oxygen: '98', heartRate: '80', bp: '120/80' });
            }
        } catch (err) { alert("Failed to admit patient"); }
    };

    // 4. View & AI
    // Inside HospitalPatients.jsx -> handleViewPatient
const handleViewPatient = async (patient) => {
    setSelectedPatient(patient);
    setLoadingAI(true); 
    
    try {
        const [recRes, stayRes] = await Promise.all([
            fetch(`${API_BASE}/hospital/patient/recovery`, {
                method: 'POST', 
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ 
                    age: patient.age, 
                    bmi: 24, // Default or from patient data
                    heart_rate: patient.heartRate || 75, 
                    blood_pressure: 120, // Default or from patient data
                    diagnosis: patient.condition || 'General', 
                    treatment_type: 'Standard'  // Default or from patient data
                })
            }),
            fetch(`${API_BASE}/hospital/patient/stay`, {
                method: 'POST', 
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ 
                    age: patient.age, 
                    bmi: 24, // Default or from patient data
                    heart_rate: patient.heartRate || 75, 
                    blood_pressure: 120, // Default or from patient data
                    diagnosis: patient.condition || 'General', 
                    treatment_type: 'Standard'  // Default or from patient data
                })
            })
        ]);
        
        const recData = await recRes.json();
        const stayData = await stayRes.json();
        
        if (recData.error) {
            setAiRecovery({ error: recData.error });
        } else {
            setAiRecovery(recData);
        }
        
        if (stayData.error) {
            setAiStay({ error: stayData.error });
        } else {
            setAiStay(stayData);
        }
    } catch (err) { 
        console.error("AI Insight Error", err); 
        setAiRecovery({ error: `Failed to get recovery prediction: ${err.message}` });
        setAiStay({ error: `Failed to get stay prediction: ${err.message}` });
    } finally { 
        setLoadingAI(false); 
    }
};

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            
            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Patients by Department</h3>
                    <div className="h-64">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={getDeptData()} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                                    {getDeptData().map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Age Demographics</h3>
                    <div className="h-64">
                        <ResponsiveContainer>
                            <BarChart data={getAgeData()}>
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* LIST */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">Admitted Patients Directory</h3>
                        <p className="text-xs text-gray-500">Managing {patients.length} active records</p>
                    </div>
                    <button 
                        onClick={() => setIsAdmitOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow flex items-center gap-2"
                    >
                        <i className="fas fa-plus"></i> Admit New Patient
                    </button>
                </div>
                
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-600">Name / Age</th>
                            <th className="px-6 py-4 font-bold text-slate-600">Department</th>
                            <th className="px-6 py-4 font-bold text-slate-600">Room</th>
                            <th className="px-6 py-4 font-bold text-slate-600">Condition</th>
                            <th className="px-6 py-4 font-bold text-slate-600">Status</th>
                            <th className="px-6 py-4 text-right font-bold text-slate-600">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {patients.map((p, idx) => (
                            <tr key={p._id || idx} className="hover:bg-blue-50/50 transition">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800">{p.name}</p>
                                    <p className="text-xs text-slate-500">{p.age} yrs • {p.gender}</p>
                                </td>
                                <td className="px-6 py-4 text-slate-700">{p.dept}</td>
                                <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{p.room}</span></td>
                                <td className="px-6 py-4 text-slate-700">{p.condition}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        p.severity === 'Critical' ? 'bg-red-100 text-red-700' : 
                                        p.severity === 'High' ? 'bg-orange-100 text-orange-700' : 
                                        'bg-green-100 text-green-700'
                                    }`}>
                                        {p.severity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleViewPatient(p)} className="text-indigo-600 font-bold hover:underline">View AI Insights</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ADMIT MODAL (USING PORTAL) */}
            {isAdmitOpen && (
                <ModalPortal>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border-t-4 border-blue-600 animate-zoom-in">
                        <div className="bg-slate-50 p-4 flex justify-between items-center border-b">
                            <h3 className="font-bold text-lg text-slate-800">Admit New Patient</h3>
                            <button onClick={() => setIsAdmitOpen(false)} className="text-gray-400 hover:text-red-500"><i className="fas fa-times text-xl"></i></button>
                        </div>
                        <form onSubmit={handleAdmitSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 uppercase">Full Name</label><input required className="w-full p-2 border rounded" value={newPatient.name} onChange={e=>setNewPatient({...newPatient, name: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">Age</label><input required type="number" className="w-full p-2 border rounded" value={newPatient.age} onChange={e=>setNewPatient({...newPatient, age: e.target.value})} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 uppercase">Gender</label><select className="w-full p-2 border rounded bg-white" value={newPatient.gender} onChange={e=>setNewPatient({...newPatient, gender: e.target.value})}><option>Male</option><option>Female</option></select></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">Department</label><select className="w-full p-2 border rounded bg-white" value={newPatient.dept} onChange={e=>setNewPatient({...newPatient, dept: e.target.value})}><option>General</option><option>Cardiology</option><option>Neurology</option><option>Trauma</option><option>ICU</option></select></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 uppercase">Room No</label><input required className="w-full p-2 border rounded" value={newPatient.room} onChange={e=>setNewPatient({...newPatient, room: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">Severity</label><select className="w-full p-2 border rounded bg-white" value={newPatient.severity} onChange={e=>setNewPatient({...newPatient, severity: e.target.value})}><option>Stable</option><option>Moderate</option><option>High</option><option>Critical</option></select></div>
                            </div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Medical Condition</label><input required className="w-full p-2 border rounded" placeholder="e.g. Cardiac Arrest" value={newPatient.condition} onChange={e=>setNewPatient({...newPatient, condition: e.target.value})} /></div>
                            
                            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3 rounded border">
                                <div><label className="text-xs font-bold text-gray-500">Oxygen %</label><input type="number" className="w-full p-1 border rounded bg-white" value={newPatient.oxygen} onChange={e=>setNewPatient({...newPatient, oxygen: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-gray-500">Heart Rate</label><input type="number" className="w-full p-1 border rounded bg-white" value={newPatient.heartRate} onChange={e=>setNewPatient({...newPatient, heartRate: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-gray-500">BP</label><input className="w-full p-1 border rounded bg-white" value={newPatient.bp} onChange={e=>setNewPatient({...newPatient, bp: e.target.value})} /></div>
                            </div>

                            <button className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 shadow-lg">Confirm Admission</button>
                        </form>
                    </div>
                </ModalPortal>
            )}

            {/* VIEW DETAILS MODAL (USING PORTAL) */}
            {selectedPatient && (
                <ModalPortal>
                    <div className="bg-white rounded-2xl w-full overflow-hidden border-t-8 border-indigo-600 animate-zoom-in">
                        <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
                            <div className="flex gap-4 items-center">
                                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-2xl font-bold">{selectedPatient.name.charAt(0)}</div>
                                <div><h2 className="text-2xl font-bold">{selectedPatient.name}</h2><p className="text-slate-300 text-sm">{selectedPatient.gender}, {selectedPatient.age} yrs • Admitted: {selectedPatient.admitDate ? new Date(selectedPatient.admitDate).toLocaleDateString() : 'Just Now'}</p></div>
                            </div>
                            <button onClick={() => setSelectedPatient(null)} className="text-white/70 hover:text-white"><i className="fas fa-times text-2xl"></i></button>
                        </div>
                        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                             <div className="lg:col-span-1 space-y-6">
                                <div><h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Vitals</h4><div className="grid grid-cols-2 gap-3"><div className="p-3 bg-slate-50 rounded border text-center"><p className="text-xs text-slate-400">Oxygen</p><p className="text-xl font-bold text-blue-600">{selectedPatient.oxygen}%</p></div><div className="p-3 bg-slate-50 rounded border text-center"><p className="text-xs text-slate-400">HR</p><p className="text-xl font-bold text-red-500">{selectedPatient.heartRate} bpm</p></div></div></div>
                                <div><h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Info</h4><ul className="text-sm space-y-2 text-slate-700"><li className="flex justify-between border-b pb-1"><span>Room:</span> <b>{selectedPatient.room}</b></li><li className="flex justify-between border-b pb-1"><span>Condition:</span> <b>{selectedPatient.condition}</b></li><li className="flex justify-between border-b pb-1"><span>Dept:</span> <b>{selectedPatient.dept}</b></li></ul></div>
                             </div>
<div className="lg:col-span-2 space-y-6">
    <h3 className="font-bold text-xl text-indigo-700 flex items-center gap-2">
        <i className="fas fa-robot"></i> AI Recovery Analytics
    </h3>
    
    {loadingAI ? (
        <div className="p-10 text-center">
            <i className="fas fa-dna fa-spin text-3xl text-indigo-500 mb-3"></i>
            <p className="font-bold text-slate-600">Analyzing Medical Data...</p>
        </div>
    ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Recovery Probability */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-5 rounded-xl border border-green-200">
                <p className="text-xs font-bold text-green-800 uppercase mb-1">Recovery Probability</p>
                {aiRecovery?.error ? (
                    <div className="text-sm text-red-600 font-semibold">
                        <i className="fas fa-exclamation-circle mr-2"></i>{aiRecovery.error}
                    </div>
                ) : (
                    <>
                        <h2 className="text-4xl font-extrabold text-green-700 mb-2">
                            {aiRecovery?.recovery_probability !== undefined ? `${(aiRecovery.recovery_probability * 100).toFixed(1)}%` : '--'}
                        </h2>
                        <p className="text-sm font-bold text-green-900">
                            {aiRecovery?.recovery_probability !== undefined 
                                ? (aiRecovery.recovery_probability > 0.7 ? 'High probability of recovery' : aiRecovery.recovery_probability > 0.4 ? 'Moderate probability' : 'Low probability')
                                : 'Analyzing...'}
                        </p>
                    </>
                )}
            </div>

            {/* 2. Est. Stay Duration */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-5 rounded-xl border border-blue-200">
                <p className="text-xs font-bold text-blue-800 uppercase mb-1">Est. Stay Duration</p>
                {aiStay?.error ? (
                    <div className="text-sm text-red-600 font-semibold">
                        <i className="fas fa-exclamation-circle mr-2"></i>{aiStay.error}
                    </div>
                ) : (
                    <>
                        <h2 className="text-4xl font-extrabold text-blue-700 mb-2">
                            {aiStay?.predicted_stay_days !== undefined ? aiStay.predicted_stay_days : '--'} 
                            <span className="text-lg ml-1">Days</span>
                        </h2>
                        <p className="text-xs text-blue-800 italic">
                            {aiStay?.predicted_stay_days !== undefined 
                                ? `Expected discharge in approximately ${aiStay.predicted_stay_days} days`
                                : 'Calculating...'}
                        </p>
                    </>
                )}
            </div>
        </div>
    )}
</div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default HospitalPatients;