import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DashboardCard, LoadingSpinner } from './Common';

const API_BASE_URL = '${import.meta.env.VITE_API_URL}';

// Custom icons for density levels
const createIcon = (color) => new L.DivIcon({
    html: `<i class="fas fa-exclamation-circle" style="color: ${color}; font-size: 24px; text-shadow: 0 0 5px rgba(0,0,0,0.5);"></i>`,
    className: 'bg-transparent',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const icons = {
    'High-Density Zone': createIcon('#ef4444'),   // Red
    'Medium-Density Zone': createIcon('#f97316'), // Orange
    'Low-Density Zone': createIcon('#eab308'),    // Yellow
    'Unknown': createIcon('#9ca3af')              // Grey
};

const EmergencyHotspotMap = () => {
    const [hotspots, setHotspots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHotspots = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/gov/emergency_hotspots`);
                if (res.ok) setHotspots(await res.json());
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        fetchHotspots();
    }, []);

    return (
        <DashboardCard className="h-full min-h-[500px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-900">Live Emergency Hotspots</h3>
                {loading && <LoadingSpinner />}
            </div>
            
            <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '500px', width: '100%', borderRadius: '0.75rem' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {hotspots.map((h, idx) => (
                    <Marker key={idx} position={[h.lat, h.lng]} icon={icons[h.cluster_label] || icons['Unknown']}>
                        <Popup>
                            <b>{h.emergency_type}</b><br/>
                            Severity: {h.severity}<br/>
                            Cluster: {h.cluster_label}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <div className="flex gap-4 mt-4 text-sm justify-center">
                <span className="flex items-center gap-1"><i className="fas fa-circle text-red-500"></i> High Density</span>
                <span className="flex items-center gap-1"><i className="fas fa-circle text-orange-500"></i> Medium Density</span>
                <span className="flex items-center gap-1"><i className="fas fa-circle text-yellow-500"></i> Low Density</span>
            </div>
        </DashboardCard>
    );
};

export default EmergencyHotspotMap;