import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- FIX LEAFLET ICONS ---
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
    iconRetinaUrl: iconRetina,
    iconUrl: iconMarker,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

// Custom "You Are Here" Icon (Red)
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// --- MASSIVE KARNATAKA DATASET ---
const HOSPITALS = [
    // --- MANGALORE & COASTAL ---
    { id: 1, name: "Alva's Health Centre", location: "Moodbidri", lat: 13.0705, lng: 74.9985, phone: "08258-238111" },
    { id: 2, name: "KMC Hospital", location: "Mangalore", lat: 12.8730, lng: 74.8430, phone: "0824-2444590" },
    { id: 3, name: "Wenlock District Hospital", location: "Mangalore", lat: 12.8683, lng: 74.8415, phone: "0824-2425949" },
    { id: 4, name: "AJ Hospital", location: "Mangalore", lat: 12.9037, lng: 74.8442, phone: "0824-2225533" },
    { id: 5, name: "Manipal Hospital", location: "Udupi", lat: 13.3525, lng: 74.7865, phone: "0820-2922761" },
    
    // --- BANGALORE (CAPITAL) ---
    { id: 10, name: "Victoria Hospital", location: "Bangalore (Central)", lat: 12.9634, lng: 77.5750, phone: "080-26701150" },
    { id: 11, name: "NIMHANS", location: "Bangalore", lat: 12.9392, lng: 77.5959, phone: "080-26995000" },
    { id: 12, name: "Manipal Hospital", location: "Bangalore (Old Airport)", lat: 12.9592, lng: 77.6478, phone: "1800-102-5555" },
    { id: 13, name: "St. John's Medical College", location: "Bangalore (Koramangala)", lat: 12.9298, lng: 77.6210, phone: "080-22065000" },
    { id: 14, name: "Narayana Health City", location: "Bangalore (Electronic City)", lat: 12.8166, lng: 77.6917, phone: "1800-309-0309" },

    // --- MYSORE REGION ---
    { id: 20, name: "K.R. Hospital", location: "Mysore", lat: 12.3117, lng: 76.6527, phone: "0821-2422554" },
    { id: 21, name: "Apollo BGS Hospitals", location: "Mysore", lat: 12.2965, lng: 76.6295, phone: "0821-2568888" },
    { id: 22, name: "JSS Hospital", location: "Mysore", lat: 12.2968, lng: 76.6575, phone: "0821-2335555" },
    { id: 23, name: "District Hospital", location: "Mandya", lat: 12.5236, lng: 76.8966, phone: "108" },
    { id: 24, name: "Hassan Institute of Medical Sciences", location: "Hassan", lat: 13.0067, lng: 76.1014, phone: "08172-231666" },

    // --- NORTH KARNATAKA (HUBLI-DHARWAD) ---
    { id: 30, name: "KIMS Hospital", location: "Hubli", lat: 15.3524, lng: 75.1435, phone: "0836-2373348" },
    { id: 31, name: "SDM College of Medical Sciences", location: "Dharwad", lat: 15.4243, lng: 75.0503, phone: "0836-2477777" },
    { id: 32, name: "District Civil Hospital", location: "Belgaum", lat: 15.8645, lng: 74.5056, phone: "0831-2420803" },
    { id: 33, name: "KLE Dr. Prabhakar Kore Hospital", location: "Belgaum", lat: 15.8872, lng: 74.5168, phone: "0831-2473777" },

    // --- NORTH EAST (GULBARGA/RAICHUR) ---
    { id: 40, name: "Gulbarga Institute of Medical Sciences", location: "Kalaburagi", lat: 17.3297, lng: 76.8343, phone: "08472-220307" },
    { id: 41, name: "RIMS Teaching Hospital", location: "Raichur", lat: 16.2008, lng: 77.3556, phone: "08532-235488" },
    { id: 42, name: "Bidar Institute of Medical Sciences", location: "Bidar", lat: 17.9154, lng: 77.5186, phone: "08482-228366" },

    // --- CENTRAL KARNATAKA ---
    { id: 50, name: "McGann Teaching Hospital", location: "Shimoga", lat: 13.9299, lng: 75.5681, phone: "08182-222222" },
    { id: 51, name: "SS Institute of Medical Sciences", location: "Davangere", lat: 14.4448, lng: 75.9228, phone: "08192-261807" },
    { id: 52, name: "Chitradurga District Hospital", location: "Chitradurga", lat: 14.2263, lng: 76.4005, phone: "108" }
];

// Helper: Calculate Distance
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
};

const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        // Zoom out slightly (level 7) to show the whole state if needed
        map.setView([lat, lng], 8); 
    }, [lat, lng, map]);
    return null;
};

const HospitalMap = () => {
    // Default Center: Karnataka State Center (near Davangere)
    const [userPos, setUserPos] = useState({ lat: 14.2, lng: 75.8 }); 
    const [gpsEnabled, setGpsEnabled] = useState(false);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserPos({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setGpsEnabled(true);
                },
                (error) => console.error("GPS Error:", error),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    // Sort hospitals by distance to user
    const sortedHospitals = [...HOSPITALS].sort((a, b) => {
        return getDistance(userPos.lat, userPos.lng, a.lat, a.lng) - getDistance(userPos.lat, userPos.lng, b.lat, b.lng);
    });

    return (
        <div className="bg-white p-4 rounded-xl border shadow-sm h-[600px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="font-bold text-lg text-gray-800">
                        <i className="fas fa-hospital-alt text-red-600 mr-2"></i>
                        Karnataka Hospital Network
                    </h3>
                    <p className="text-xs text-gray-500">
                        {gpsEnabled ? "Showing nearest hospitals to you" : "Showing major hospitals across Karnataka"}
                    </p>
                </div>
                {gpsEnabled && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">● GPS Active</span>}
            </div>

            <div className="flex-grow rounded-lg overflow-hidden border border-gray-300 relative z-0">
                <MapContainer center={[userPos.lat, userPos.lng]} zoom={7} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* User Marker */}
                    {gpsEnabled && (
                        <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
                            <Popup><strong>You are here</strong></Popup>
                        </Marker>
                    )}
                    
                    {/* Auto Center Map */}
                    <RecenterMap lat={userPos.lat} lng={userPos.lng} />

                    {/* Hospital Markers */}
                    {HOSPITALS.map((h) => (
                        <Marker key={h.id} position={[h.lat, h.lng]}>
                            <Popup>
                                <div className="text-center">
                                    <strong className="text-red-700">{h.name}</strong><br/>
                                    <span className="text-xs text-gray-600">{h.location}</span><br/>
                                    <div className="mt-2 text-sm font-bold">
                                        {getDistance(userPos.lat, userPos.lng, h.lat, h.lng)} km away
                                    </div>
                                    <a href={`tel:${h.phone}`} className="block mt-1 bg-green-600 text-white text-xs px-2 py-1 rounded">Call: {h.phone}</a>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
            
            {/* List of 4 Nearest Hospitals */}
            <div className="mt-3">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Nearest to you:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    {sortedHospitals.slice(0, 4).map(h => (
                         <div key={h.id} className="text-xs bg-gray-50 p-2 rounded border border-gray-200 flex justify-between items-center">
                             <span className="font-semibold text-gray-700 truncate w-32">{h.name}</span>
                             <span className="text-blue-600 font-bold">{getDistance(userPos.lat, userPos.lng, h.lat, h.lng)} km</span>
                         </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HospitalMap;