import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // <--- NEW IMPORT FOR PORTAL
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const MOCK_RESOURCES = [
    { _id: 'b1', name: 'A+ Blood', category: 'Blood', quantity: 15, unit: 'bags', minThreshold: 10 },
    { _id: 'b2', name: 'O- Blood', category: 'Blood', quantity: 2, unit: 'bags', minThreshold: 8 },
    { _id: 'o1', name: 'Kidney', category: 'Organ', quantity: 2, unit: 'units', minThreshold: 1 },
    { _id: 'm1', name: 'Paracetamol', category: 'Medicine', quantity: 800, unit: 'strips', minThreshold: 100 },
    { _id: 'm2', name: 'Insulin', category: 'Medicine', quantity: 45, unit: 'vials', minThreshold: 50 },
    { _id: 'e1', name: 'Ventilator', category: 'Equipment', quantity: 8, unit: 'units', minThreshold: 3 },
    { _id: 'e3', name: 'PPE Kits', category: 'Equipment', quantity: 1500, unit: 'kits', minThreshold: 500 },
];

// --- HELPER: MODAL PORTAL COMPONENT ---
// This forces the modal to render attached to document.body, bypassing all z-index issues
const ModalPortal = ({ children }) => {
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-fade-in"></div>
            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-md">
                {children}
            </div>
        </div>,
        document.body
    );
};

const HospitalResources = () => {
    const { user } = useAuth();
    
    // Data States
    const [resources, setResources] = useState(MOCK_RESOURCES);
    
    // UI States
    const [isAddOpen, setIsAddOpen] = useState(false);
    
    // AI Modal States
    const [isAiModalOpen, setIsAiModalOpen] = useState(false); 
    const [aiLoading, setAiLoading] = useState(false);         
    const [aiResult, setAiResult] = useState(null);            
    const [aiError, setAiError] = useState(null);              
    const [selectedItemName, setSelectedItemName] = useState('');

    // Form State
    const [newItem, setNewItem] = useState({
        name: '', category: 'Medicine', quantity: '', unit: 'units', minThreshold: '10'
    });

    // 1. Fetch Resources
    useEffect(() => {
        const fetchResources = async () => {
            if (!user?.id) return;
            try {
                const res = await fetch(`${API_BASE}/dashboard/hospital/resources/${user.id}`);
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setResources([...data, ...MOCK_RESOURCES]);
                }
            } catch (err) { console.error("Resource fetch error:", err); }
        };
        fetchResources();
    }, [user?.id]);

    // 2. Chart Helpers
    const getCategoryData = () => {
        const data = { Medicine: 0, Blood: 0, Organ: 0, Equipment: 0 };
        resources.forEach(r => { 
            if (data[r.category] !== undefined) data[r.category] += Number(r.quantity); 
        });
        return Object.keys(data).map(key => ({ name: key, count: data[key] }));
    };

    const getLowStockData = () => {
        return resources
            .filter(r => Number(r.quantity) <= Number(r.minThreshold))
            .map(r => ({ name: r.name, quantity: Number(r.quantity), threshold: Number(r.minThreshold) }));
    };

    // 3. Add Item Handler
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/dashboard/hospital/resource/add`, {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ ...newItem, hospitalId: user.id })
            });
            const data = await res.json();
            if (res.ok) {
                setResources([data, ...resources]);
                setIsAddOpen(false);
                setNewItem({ name: '', category: 'Medicine', quantity: '', unit: 'units', minThreshold: '10' });
            }
        } catch (err) { alert("Failed to add resource"); }
    };

    // 4. AI Analysis Handler
    const runAIAnalysis = async (e, item) => {
        e.preventDefault();
        e.stopPropagation();

        setIsAiModalOpen(true);
        setAiLoading(true);
        setAiError(null);
        setAiResult(null);
        setSelectedItemName(item.name);

        try {
            const res = await fetch(`${API_BASE}/hospital/inventory/predict`, {
                method: 'POST', 
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ 
                    name: item.name, 
                    quantity: Number(item.quantity), 
                    category: item.category, 
                    minThreshold: Number(item.minThreshold) 
                })
            });

            const data = await res.json();

            setTimeout(() => {
                if (!res.ok) {
                    setAiError("AI Service Unavailable. Please ensure the Python backend is running.");
                    setAiLoading(false);
                    return;
                }
                setAiResult(data);
                setAiLoading(false);
            }, 800);

        } catch (err) {
            setTimeout(() => {
                console.error(err);
                setAiError("Connection Error. AI Service Unreachable.");
                setAiLoading(false);
            }, 800);
        }
    };

    const closeAiModal = () => {
        setIsAiModalOpen(false);
        setAiResult(null);
        setAiError(null);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            
            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Inventory Overview (Log Scale)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getCategoryData()}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" style={{fontSize: '12px', fontWeight:'bold'}} />
                                <YAxis scale="sqrt" style={{fontSize: '12px'}} /> 
                                <Tooltip cursor={{fill: '#f1f5f9'}} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={50} name="Total Units">
                                    {getCategoryData().map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 text-red-600">
                            <i className="fas fa-exclamation-triangle"></i> Critical Stock Levels
                        </h3>
                        <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-bold">{getLowStockData().length} Items Low</span>
                    </div>
                    <div className="h-72 overflow-y-auto custom-scrollbar">
                        {getLowStockData().length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-green-500 opacity-60">
                                <i className="fas fa-check-circle text-5xl mb-3"></i>
                                <span className="font-bold">Inventory Healthy</span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={Math.max(300, getLowStockData().length * 60)}>
                                <BarChart data={getLowStockData()} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={110} style={{fontSize: '11px', fontWeight: 'bold'}} />
                                    <Tooltip />
                                    <Bar dataKey="quantity" fill="#ef4444" barSize={20} radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#ef4444', fontSize: 12 }} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-xl text-slate-800">Hospital Supply Chain</h3>
                    <button onClick={() => setIsAddOpen(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow flex items-center gap-2">
                        <i className="fas fa-plus-circle"></i> Add Supplies
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-600">Item Name</th>
                                <th className="px-6 py-4 font-bold text-slate-600">Category</th>
                                <th className="px-6 py-4 font-bold text-slate-600">Stock</th>
                                <th className="px-6 py-4 font-bold text-slate-600">Status</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-600">AI Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {resources.map((r, idx) => {
                                const isLow = Number(r.quantity) <= Number(r.minThreshold);
                                return (
                                    <tr key={r._id || idx} className="hover:bg-indigo-50/30 transition">
                                        <td className="px-6 py-4 font-bold text-slate-800">{r.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                r.category === 'Medicine' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                r.category === 'Blood' ? 'bg-red-50 text-red-700 border-red-200' :
                                                r.category === 'Organ' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                                            }`}>{r.category}</span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-700">{r.quantity} {r.unit}</td>
                                        <td className="px-6 py-4">
                                            {isLow ? <span className="text-red-600 font-bold flex items-center gap-1"><i className="fas fa-arrow-down"></i> Critical</span> : 
                                            <span className="text-green-600 font-bold flex items-center gap-1"><i className="fas fa-check"></i> Healthy</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                type="button"
                                                onClick={(e) => runAIAnalysis(e, r)} 
                                                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-4 py-1.5 rounded-lg font-bold transition shadow-sm border border-indigo-100"
                                            >
                                                <i className="fas fa-magic mr-1"></i> Predict
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD ITEM MODAL (USING PORTAL) */}
            {isAddOpen && (
                <ModalPortal>
                    <div className="bg-white rounded-2xl shadow-2xl w-full border-t-8 border-indigo-600 animate-zoom-in">
                        <div className="p-5 flex justify-between items-center border-b">
                            <h3 className="font-bold text-xl text-slate-800">Add Inventory</h3>
                            <button onClick={() => setIsAddOpen(false)}><i className="fas fa-times text-xl text-gray-400 hover:text-red-500"></i></button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6 space-y-5 bg-slate-50 rounded-b-2xl">
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Item Name</label><input required className="w-full p-3 border rounded-lg" value={newItem.name} onChange={e=>setNewItem({...newItem, name: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 uppercase">Category</label><select className="w-full p-3 border rounded-lg" value={newItem.category} onChange={e=>setNewItem({...newItem, category: e.target.value})}><option>Medicine</option><option>Blood</option><option>Organ</option><option>Equipment</option></select></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">Unit</label><input className="w-full p-3 border rounded-lg" placeholder="e.g. boxes" value={newItem.unit} onChange={e=>setNewItem({...newItem, unit: e.target.value})} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 uppercase">Quantity</label><input required type="number" className="w-full p-3 border rounded-lg font-bold" value={newItem.quantity} onChange={e=>setNewItem({...newItem, quantity: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-red-500 uppercase">Min Threshold</label><input required type="number" className="w-full p-3 border border-red-200 bg-red-50 rounded-lg text-red-900" value={newItem.minThreshold} onChange={e=>setNewItem({...newItem, minThreshold: e.target.value})} /></div>
                            </div>
                            <button className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg">Confirm & Add</button>
                        </form>
                    </div>
                </ModalPortal>
            )}

            {/* AI PREDICTION MODAL (USING PORTAL) */}
            {isAiModalOpen && (
                <ModalPortal>
                    <div className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden relative border-t-8 border-indigo-500 transform transition-all animate-zoom-in">
                        
                        {/* 1. LOADING STATE */}
                        {aiLoading && (
                            <div className="p-12 text-center">
                                <div className="relative w-20 h-20 mx-auto mb-6">
                                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                                    <i className="fas fa-robot absolute inset-0 flex items-center justify-center text-indigo-500 text-2xl"></i>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Analyzing {selectedItemName}...</h3>
                                <p className="text-slate-500 mt-2 text-sm">Calculating depletion rate & supply chain data</p>
                            </div>
                        )}

                        {/* 2. ERROR STATE */}
                        {!aiLoading && aiError && (
                             <div className="p-8 text-center animate-slide-in-up">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl shadow-xl mb-6 bg-red-100 text-red-600">
                                    <i className="fas fa-times-circle"></i>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Analysis Failed</h3>
                                <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{aiError}</p>
                                <button onClick={closeAiModal} className="mt-6 w-full bg-slate-800 text-white py-3 rounded-xl font-bold">Close</button>
                             </div>
                        )}

                        {/* 3. SUCCESS RESULT STATE */}
                        {!aiLoading && !aiError && aiResult && (
    <div className="animate-slide-in-up">
        {/* Check if the AI actually returned an error from Python logic */}
        {aiResult.error ? (
            <div className="p-8 text-center">
                <i className="fas fa-exclamation-triangle text-orange-500 text-4xl mb-4"></i>
                <h3 className="text-lg font-bold">AI Processing Error</h3>
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded mt-2">{aiResult.error}</p>
                <button onClick={closeAiModal} className="mt-6 w-full bg-slate-800 text-white py-3 rounded-xl font-bold">Close</button>
            </div>
        ) : (
            <>
                <div className="absolute top-4 right-4">
                    <button onClick={closeAiModal} className="text-slate-300 hover:text-slate-500"><i className="fas fa-times text-xl"></i></button>
                </div>
                <div className="p-8 text-center pb-6">
                    {/* SAFE ACCESS: aiResult?.status?.includes prevents the blank page crash */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl shadow-xl mb-6 border-4 border-white ring-4 ${aiResult?.status?.includes('Critical') || aiResult?.status?.includes('Low') ? 'bg-red-100 text-red-600 ring-red-50' : 'bg-emerald-100 text-emerald-600 ring-emerald-50'}`}>
                        <i className={`fas ${aiResult?.status?.includes('Critical') || aiResult?.status?.includes('Low') ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-800">{aiResult.item}</h2>
                    <p className={`font-bold mt-2 inline-block px-3 py-1 rounded-full text-xs uppercase tracking-wide ${aiResult?.status?.includes('Critical') || aiResult?.status?.includes('Low') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        Status: {aiResult.status}
                    </p>
                </div>
                <div className="bg-slate-50 px-8 py-6 border-t border-b border-slate-100">
                    <div className="grid grid-cols-2 gap-6 mb-4">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Stockout In</p>
                            <p className="text-3xl font-extrabold text-indigo-600 mt-1">{aiResult.days_left > 900 ? '99+' : aiResult.days_left} <span className="text-sm text-slate-400">Days</span></p>
                        </div>
                        <div className="text-center border-l border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Usage Rate</p>
                            <p className="text-3xl font-extrabold text-indigo-600 mt-1">{aiResult.usage_rate_per_day}</p>
                            <p className="text-xs text-slate-500">Units / Day</p>
                        </div>
                    </div>
                    <div className={`p-4 rounded-xl text-sm font-bold border flex items-start gap-3 text-left ${aiResult?.status?.includes('Critical') || aiResult?.status?.includes('Low') ? 'bg-red-50 text-red-800 border-red-100' : 'bg-blue-50 text-blue-800 border-blue-100'}`}>
                        <i className="fas fa-lightbulb mt-1 text-lg"></i>
                        <div>
                            <span className="block text-xs opacity-70 uppercase mb-0.5">AI Recommendation</span>
                            {aiResult.recommendation}
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <button onClick={closeAiModal} className="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-bold shadow-lg transition">Acknowledge & Close</button>
                </div>
            </>
        )}
    </div>
)}
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default HospitalResources;