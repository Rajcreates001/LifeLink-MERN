import React, { useState, useEffect } from 'react';
import { DashboardCard, Input, ProgressBar } from './Common';
import { Line } from 'react-chartjs-2';

const API_BASE_URL = 'http://localhost:3001';

// --- 1. Outbreak Forecast Chart ---
export const OutbreakForecast = () => {
    const [formData, setFormData] = useState({ disease_name: 'Influenza', region: 'Central City', days_to_predict: 30 });
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/gov/predict_outbreak`, {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(formData)
            });
            const data = await res.json();
            if(data.forecast) {
                setChartData({
                    labels: data.forecast.map(d => d.date),
                    datasets: [
                        { label: 'Predicted Cases', data: data.forecast.map(d => d.predicted_cases), borderColor: 'rgb(239, 68, 68)', backgroundColor: 'rgba(239, 68, 68, 0.5)' },
                        { label: 'Upper Confidence', data: data.forecast.map(d => d.confidence_high), borderColor: 'rgba(59, 130, 246, 0.2)', fill: false, borderDash: [5, 5] }
                    ]
                });
            }
        } catch (err) { alert('Forecast failed'); } finally { setLoading(false); }
    };

    return (
        <DashboardCard>
            <h3 className="font-bold text-lg mb-4">Disease Outbreak Forecast</h3>
            <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                <Input name="disease_name" placeholder="Disease" value={formData.disease_name} onChange={e => setFormData({...formData, disease_name: e.target.value})} />
                <Input name="region" placeholder="Region" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} />
                <button disabled={loading} className="bg-red-600 text-white px-4 rounded font-bold">{loading ? '...' : 'Forecast'}</button>
            </form>
            <div className="h-64">
                {chartData ? <Line options={{responsive: true, maintainAspectRatio: false}} data={chartData} /> : <p className="text-center pt-20 text-gray-400">Enter details to see forecast</p>}
            </div>
        </DashboardCard>
    );
};

// --- 2. Allocation Predictor ---
export const AllocationPredictor = () => {
    const [formData, setFormData] = useState({ emergency_count: 5, hospital_capacity_percent: 65 });
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/api/gov/predict_allocation`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(formData) });
            setResult(await res.json());
        } catch (err) { console.error(err); }
    };

    return (
        <DashboardCard>
            <h3 className="font-bold text-lg mb-4">Resource Allocation</h3>
            <form onSubmit={handleSubmit} className="space-y-2">
                <Input type="number" placeholder="Active Emergencies" value={formData.emergency_count} onChange={e => setFormData({...formData, emergency_count: e.target.value})} />
                <Input type="number" placeholder="Hospital Capacity %" value={formData.hospital_capacity_percent} onChange={e => setFormData({...formData, hospital_capacity_percent: e.target.value})} />
                <button className="w-full bg-blue-600 text-white py-2 rounded font-bold">Optimize Allocation</button>
            </form>
            {result && <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-600 font-bold text-blue-800">{result.optimal_action}</div>}
        </DashboardCard>
    );
};

// --- 3. Policy Advisor ---
export const PolicyAdvisor = () => {
    const [formData, setFormData] = useState({ emergency_rate: 10.2, avg_response_time: 15.5, hospital_bed_occupancy: 85.0 });
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const [segRes, perfRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/gov/predict_policy_segment`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(formData) }),
                fetch(`${API_BASE_URL}/api/gov/predict_performance_score`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(formData) })
            ]);
            setResult({ segment: await segRes.json(), performance: await perfRes.json() });
        } catch (err) { console.error(err); }
    };

    return (
        <DashboardCard>
            <h3 className="font-bold text-lg mb-4">Policy Insights</h3>
            <form onSubmit={handleSubmit} className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                    <Input type="number" placeholder="Emerg. Rate" value={formData.emergency_rate} onChange={e => setFormData({...formData, emergency_rate: e.target.value})} />
                    <Input type="number" placeholder="Resp. Time" value={formData.avg_response_time} onChange={e => setFormData({...formData, avg_response_time: e.target.value})} />
                    <Input type="number" placeholder="Occupancy %" value={formData.hospital_bed_occupancy} onChange={e => setFormData({...formData, hospital_bed_occupancy: e.target.value})} />
                </div>
                <button className="w-full bg-purple-600 text-white py-2 rounded font-bold">Generate Policy</button>
            </form>
            {result && (
                <div className="mt-4 space-y-2">
                    <p className="font-semibold">Region Status: <span className="text-purple-600">{result.segment.segment_label}</span></p>
                    <div>
                        <p className="text-sm text-gray-600">Performance Score: {result.performance.predicted_performance_score}/100</p>
                        <ProgressBar value={result.performance.predicted_performance_score} colorClass="bg-purple-500" />
                    </div>
                </div>
            )}
        </DashboardCard>
    );
};

// --- 4. Availability Predictor ---
export const AvailabilityPredictor = () => {
    const [formData, setFormData] = useState({ region: 'Central', month: 11, resource_type: 'Blood O+', donation_frequency: 150, hospital_stock_level: 75 });
    const [score, setScore] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/api/gov/predict_availability`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(formData) });
            const data = await res.json();
            setScore(data.predicted_availability_score);
        } catch (err) { console.error(err); }
    };

    return (
        <DashboardCard>
            <h3 className="font-bold text-lg mb-4">Resource Availability Forecast</h3>
            <form onSubmit={handleSubmit} className="space-y-2">
                <Input placeholder="Resource Type" value={formData.resource_type} onChange={e => setFormData({...formData, resource_type: e.target.value})} />
                <button className="w-full bg-green-600 text-white py-2 rounded font-bold">Predict Availability</button>
            </form>
            {score !== null && (
                <div className="mt-4 text-center">
                    <p className="text-2xl font-bold text-green-700">{score}/100</p>
                    <p className="text-xs text-gray-500">Predicted Availability Score</p>
                </div>
            )}
        </DashboardCard>
    );
};