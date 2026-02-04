// Seed script to add 100 ambulances around Mangalore taluk and nearby areas

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB - use MONGO_URI from .env
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lifelink_db');

const Ambulance = require('./models/Ambulance');
const Hospital = require('./models/Hospital');

// Key areas in Mangalore taluk and nearby areas - SAFE INLAND COORDINATES
// Mangalore coast ocean boundary is ~74.80E, so all coordinates MUST be > 74.90E (inland/east)
// Latitude: 12.65-13.42N (north-south range across taluk)
const areaCoordinates = [
    // Mangalore City - Inland (East of coast)
    { name: 'Bendore', lat: 12.8400, lng: 74.9200 },
    { name: 'Urwa', lat: 12.8600, lng: 74.9100 },
    { name: 'Attavar', lat: 12.8500, lng: 74.9300 },
    { name: 'Kadri', lat: 12.8550, lng: 74.9400 },
    { name: 'Pumpwell', lat: 12.8450, lng: 74.9250 },
    
    // Mangalore - South/East (Inland)
    { name: 'Talapady', lat: 12.8200, lng: 74.9300 },
    { name: 'Deralakatte', lat: 12.8100, lng: 74.9400 },
    { name: 'Ullal', lat: 12.8000, lng: 74.9500 },
    
    // Mangalore - North/East (Inland)
    { name: 'Falnir', lat: 12.8900, lng: 74.9250 },
    { name: 'Bajpe', lat: 12.9100, lng: 74.9150 },
    
    // Mulki Area - North (Inland)
    { name: 'Mulki', lat: 12.9500, lng: 74.9000 },
    { name: 'Parappanangadi', lat: 12.9600, lng: 74.9100 },
    
    // Surathkal - Far North (Inland)
    { name: 'Surathkal', lat: 13.0200, lng: 74.8900 },
    { name: 'Thottam', lat: 13.0100, lng: 74.9000 },
    
    // Vitla Area - Far East/Inland
    { name: 'Vitla', lat: 12.8300, lng: 75.0500 },
    { name: 'Shirva', lat: 12.8400, lng: 75.0400 },
    
    // Moodabidri Area - South-East/Inland
    { name: 'Moodabidri', lat: 12.7500, lng: 75.0200 },
    { name: 'Bhainsavali', lat: 12.7600, lng: 75.0100 },
    
    // Bantwal Area - South-East/Inland
    { name: 'Bantwal', lat: 12.6800, lng: 75.0000 },
    { name: 'Beltangady', lat: 12.6700, lng: 74.9950 },
    
    // Puttur Area - East/Inland
    { name: 'Puttur', lat: 12.7400, lng: 75.0800 },
    { name: 'Oksoor', lat: 12.7500, lng: 75.0700 },
    
    // Kundapura Area - Far North
    { name: 'Kundapura', lat: 13.4200, lng: 74.7500 },
    
    // Additional scattered areas far inland
    { name: 'Kankanady', lat: 12.8000, lng: 74.9600 },
    { name: 'Hampankatta', lat: 12.8350, lng: 74.9350 },
    { name: 'Nantoor', lat: 12.7900, lng: 75.0300 },
    { name: 'Kuthar', lat: 12.7700, lng: 75.0100 }
];

// Generate random coordinates by picking random area and adding small variation
const generateRandomCoordinates = () => {
    // Pick a random area
    const area = areaCoordinates[Math.floor(Math.random() * areaCoordinates.length)];
    
    // Add small random variation (±0.01 degrees ≈ ±1km) to scatter better within area
    const latVariation = (Math.random() - 0.5) * 0.01;
    const lngVariation = (Math.random() - 0.5) * 0.01;
    
    const lat = area.lat + latVariation;
    const lng = area.lng + lngVariation;
    
    return { latitude: lat, longitude: lng, areaName: area.name };
};

// Driver names array
const driverNames = [
    'Rajesh Kumar', 'Amit Singh', 'Pradeep Nair', 'Rohit Verma', 'Sanjay Reddy',
    'Vikram Sharma', 'Arun Kumar', 'Manoj Singh', 'Deepak Patel', 'Suresh Gupta',
    'Ravi Shankar', 'Harish Kumar', 'Nitin Yadav', 'Arjun Singh', 'Varun Sharma',
    'Pawan Kumar', 'Sandeep Singh', 'Akshay Reddy', 'Ramesh Nair', 'Dinesh Patel',
    'Ashish Kumar', 'Bhavesh Singh', 'Chandra Mohan', 'Darshan Reddy', 'Eshan Kumar',
    'Faizan Ali', 'Gaurav Singh', 'Harsh Verma', 'Inder Kumar', 'Jagdeep Singh'
];

// Status options
const statuses = ['available', 'en_route', 'at_location', 'returning', 'maintenance'];

// Areas for realistic address descriptions
const areas = [
    // Mangalore City Areas
    'Bendore', 'Urwa', 'Attavar', 'Kadri', 'Pumpwell', 'Balmatta',
    'Pandeshwar', 'Falnir', 'Deralakatte', 'Kotekar', 'Ullal', 'Talapady',
    'Nantoor', 'Kuthar', 'Vamanjoor', 'Gurupura', 'Thumbay', 'Bajpe',
    // Surathkal and nearby
    'Surathkal', 'Thottam', 'Yenepoya',
    // Vitla area
    'Vitla', 'Shirva',
    // Bantwal and nearby  
    'Bantwal, Taluk', 'Beltangady',
    // Moodabidri area
    'Moodabidri', 'Bhainsavali',
    // Mulki area
    'Mulki', 'Parappnangadi',
    // Puttur area
    'Puttur', 'Oksoor',
    // Subramanya area
    'Subramanya',
    // Kundapura area
    'Kundapura', 'Gangolli'
];

async function seedAmbulances() {
    try {
        console.log('Starting ambulance seeding...');

        // Get existing hospital or create a user-associated one
        let hospital = await Hospital.findOne();
        
        if (!hospital) {
            console.log('Finding or creating hospital with user...');
            
            // Try to find any user first
            const User = require('./models/User');
            let user = await User.findOne();
            
            if (!user) {
                console.log('Creating default admin user...');
                user = await User.create({
                    name: 'Admin User',
                    email: 'admin@lifelink.com',
                    password: 'admin123',
                    phone: '9999999999',
                    role: 'hospital'
                });
            }

            console.log('Creating hospital with user...');
            hospital = await Hospital.create({
                hospitalName: 'KMC Hospital Mangalore',
                user: user._id,
                location: {
                    address: 'KMC Hospital, Light House Hill Road, Mangalore',
                    latitude: 12.8752,
                    longitude: 74.8470
                }
            });
        }

        console.log(`Using hospital: ${hospital.hospitalName}`);

        // Delete existing ambulances
        await Ambulance.deleteMany({});
        console.log('Cleared existing ambulances');

        const ambulancesToCreate = [];

        // Generate 100 ambulances
        for (let i = 1; i <= 100; i++) {
            const coordinates = generateRandomCoordinates();
            const driverName = driverNames[Math.floor(Math.random() * driverNames.length)];
            const area = areas[Math.floor(Math.random() * areas.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const regNumber = `KA01AB${String(i).padStart(4, '0')}`;
            const licenseNumber = `KA-${String(i).padStart(6, '0')}`;
            const phone = `+91${String(Math.floor(Math.random() * 9000000000) + 1000000000).slice(0, 10)}`;

            ambulancesToCreate.push({
                ambulanceId: `AMB-${String(i).padStart(3, '0')}`,
                registrationNumber: regNumber,
                hospital: hospital._id,
                currentLocation: {
                    address: `${area}, Mangalore`,
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude
                },
                driver: {
                    name: driverName,
                    licenseNumber: licenseNumber,
                    phone: phone,
                    email: `${driverName.toLowerCase().replace(/\s/g, '.')}@lifelink.com`
                },
                status: status,
                capacity: 4,
                equipmentList: ['Stretcher', 'Monitor', 'Oxygen', 'Defibrillator'],
                lastMaintenanceDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                createdAt: new Date()
            });
        }

        // Create ambulances in batches to avoid memory issues
        const batchSize = 50;
        for (let i = 0; i < ambulancesToCreate.length; i += batchSize) {
            const batch = ambulancesToCreate.slice(i, i + batchSize);
            await Ambulance.insertMany(batch);
            console.log(`Created ${Math.min(i + batchSize, ambulancesToCreate.length)}/100 ambulances`);
        }

        console.log('✅ Successfully seeded 100 ambulances!');
        
        // Verify
        const count = await Ambulance.countDocuments();
        console.log(`Total ambulances in database: ${count}`);

        // Show sample
        const samples = await Ambulance.find().limit(5);
        console.log('\nSample ambulances:');
        samples.forEach(amb => {
            console.log(`  - ${amb.ambulanceId}: ${amb.driver.name} at ${amb.currentLocation.address} (${amb.status})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error seeding ambulances:', error);
        process.exit(1);
    }
}

seedAmbulances();
