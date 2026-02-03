import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DashboardCard } from './Common';
import L from 'leaflet';

// Fix for default Leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AuthorityMap = () => {
    const [center, setCenter] = useState([12.9716, 77.5946]); // Default Bengaluru
    const mockSOS = [
        { id: 1, pos: [12.9716, 77.5946], type: 'Accident', location: 'Bengaluru' },
        { id: 2, pos: [15.3647, 75.1240], type: 'Cardiac', location: 'Hubli' },
        { id: 3, pos: [12.2958, 76.6394], type: 'Respiratory', location: 'Mysuru' },
        { id: 4, pos: [15.8497, 74.4977], type: 'Trauma', location: 'Belagavi' }
    ];

    useEffect(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
            setCenter([pos.coords.latitude, pos.coords.longitude]);
        });
    }, []);

    return (
        <DashboardCard className="p-0 overflow-hidden">
            <div className="h-[600px] w-full relative">
                <MapContainer center={center} zoom={7} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    {/* User Current Location */}
                    <Circle center={center} radius={5000} pathOptions={{ color: 'blue', fillColor: 'blue' }} />
                    
                    {/* Karnataka Mock Data */}
                    {mockSOS.map(sos => (
                        <Marker key={sos.id} position={sos.pos}>
                            <Popup>
                                <div className="p-1">
                                    <p className="font-bold text-red-600">{sos.type}</p>
                                    <p className="text-xs">{sos.location}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
                
                <div className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-lg shadow-lg border">
                    <h4 className="text-xs font-bold uppercase text-gray-400">Live Status</h4>
                    <p className="text-sm font-bold text-red-600 animate-pulse">● Monitoring Karnataka</p>
                </div>
            </div>
        </DashboardCard>
    );
};

export default AuthorityMap;