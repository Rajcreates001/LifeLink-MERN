import React, { useState } from 'react';
import { DashboardCard, Input } from './Common';

// --- FIX: Define this OUTSIDE the main component ---
const LabeledInput = ({ label, name, type, placeholder, icon, value, onChange }) => (
    <div className="mb-3">
        <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">{label}</label>
        <Input 
            name={name} 
            type={type} 
            placeholder={placeholder} 
            icon={icon} 
            value={value} 
            onChange={onChange} // Ensure onChange is passed down
        />
    </div>
);

const HealthRiskCalculator = () => {
    const [formData, setFormData] = useState({
        age: '45', bmi: '28.5', blood_pressure: '140', heart_rate: '75',
        has_condition: '1', lifestyle_factor: 'Sedentary'
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/predict_health_risk`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            alert('Prediction Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardCard>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Inputs will now maintain focus perfectly */}
                    <LabeledInput label="Age (Years)" name="age" type="number" placeholder="45" icon="fa-calendar" value={formData.age} onChange={handleChange} />
                    <LabeledInput label="BMI (Body Mass Index)" name="bmi" type="number" placeholder="28.5" icon="fa-weight" value={formData.bmi} onChange={handleChange} />
                    <LabeledInput label="Systolic BP (mmHg)" name="blood_pressure" type="number" placeholder="120" icon="fa-heartbeat" value={formData.blood_pressure} onChange={handleChange} />
                    <LabeledInput label="Heart Rate (BPM)" name="heart_rate" type="number" placeholder="75" icon="fa-heart" value={formData.heart_rate} onChange={handleChange} />
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Existing Conditions</label>
                        <select name="has_condition" value={formData.has_condition} onChange={handleChange} className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-sky-200 outline-none">
                            <option value="1">Yes (Diabetes, Hypertension, etc.)</option>
                            <option value="0">No / None</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Lifestyle / Activity</label>
                        <select name="lifestyle_factor" value={formData.lifestyle_factor} onChange={handleChange} className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-sky-200 outline-none">
                            <option value="Sedentary">Sedentary (Low Activity)</option>
                            <option value="Average">Average</option>
                            <option value="Healthy">Active / Athletic</option>
                            <option value="Unhealthy">Unhealthy Habits</option>
                        </select>
                    </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold shadow-md hover:scale-[1.02] transition-transform">
                    {loading ? 'Analyzing Vitals...' : 'Calculate Health Risk'}
                </button>
            </form>

            {result && (
                <div className={`mt-6 p-4 rounded-lg border-l-4 ${result.risk_level === 'High' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'} animate-fade-in shadow-sm`}>
                    <h4 className="font-bold text-gray-900">AI Analysis Result:</h4>
                    <p className={`text-2xl font-bold ${result.risk_level === 'High' ? 'text-red-600' : 'text-green-600'}`}>
                        {result.risk_level} Risk Level
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Based on provided vitals, please consult a doctor for verification.</p>
                </div>
            )}
        </DashboardCard>
    );
};

export default HealthRiskCalculator;