require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import Models
const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Alert = require('./models/Alert');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🌱 Connected to MongoDB for Super Seeding...');

        // 1. Wipe clean
        await User.deleteMany({});
        await Hospital.deleteMany({});
        await Alert.deleteMany({});

        // 2. Create the Main Users (The ones you log in with)
        const passwordHash = await bcrypt.hash('password123', 10);

        const myHospital = await User.create({
            name: 'Central City General', email: 'hospital@test.com', password: passwordHash, role: 'hospital',
            hospitalProfile: { hospitalName: 'Central City General', registrationId: 'H-100', contactNumber: '555-0199', isVerified: false, jurisdiction: 'Central City' }
        });

        await User.create({
            name: 'Officer Barbrady', email: 'gov@test.com', password: passwordHash, role: 'government',
            govProfile: { department: 'Health Dept', designation: 'Director', officialId: 'GOV-99', jurisdiction: 'Central City' }
        });

        const mePublic = await User.create({
            name: 'Maharaj User', email: 'public@test.com', password: passwordHash, role: 'public', age: 25, gender: 'Male',
            publicProfile: { isDonor: false, bloodGroup: 'B+', location: 'Downtown' }
        });

        // 3. Create "Other" Donors (So "Find Donors" isn't empty)
        const donors = [
            { name: "Alice Green", bg: "O+", loc: "North Sector" },
            { name: "Bob White", bg: "A-", loc: "West Suburbs" },
            { name: "Charlie Black", bg: "AB+", loc: "Downtown" },
            { name: "Diana Prince", bg: "O-", loc: "South City" },
            { name: "Evan Wright", bg: "B+", loc: "Uptown" }
        ];

        for (const d of donors) {
            await User.create({
                name: d.name, email: `${d.name.split(' ')[0].toLowerCase()}@example.com`, password: passwordHash, role: 'public', age: Math.floor(Math.random() * 40) + 20, gender: 'Female',
                publicProfile: { isDonor: true, bloodGroup: d.bg, organDonor: true, location: d.loc }
            });
        }
        console.log('✅ Created 5 Public Donors');

        // 4a. Create multiple additional hospital accounts for communications testing
        const hospitalsToCreate = [
            { name: 'Northside Medical Center', reg: 'H-101', contact: '555-0101', jurisdiction: 'North Sector' },
            { name: 'Mercy West Hospital', reg: 'H-102', contact: '555-0102', jurisdiction: 'West Suburbs' },
            { name: 'St. Jude Hospital', reg: 'H-103', contact: '555-0103', jurisdiction: 'Downtown' },
            { name: 'Riverside Community Hospital', reg: 'H-104', contact: '555-0104', jurisdiction: 'South City' },
            { name: 'Uptown Health Center', reg: 'H-105', contact: '555-0105', jurisdiction: 'Uptown' }
        ];

        for (const h of hospitalsToCreate) {
            const user = await User.create({
                name: h.name,
                email: `${h.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')}@hospital.local`,
                password: passwordHash,
                role: 'hospital',
                hospitalProfile: { hospitalName: h.name, registrationId: h.reg, contactNumber: h.contact, isVerified: false, jurisdiction: h.jurisdiction }
            });

            await Hospital.create({
                user: user._id,
                status: { erCapacity: Math.floor(Math.random() * 50) + 30, icuBedsAvailable: Math.floor(Math.random() * 10), generalBedsAvailable: Math.floor(Math.random() * 40) + 10, onDutyDoctors: Math.floor(Math.random() * 20) + 5 },
                inventory: [
                    { itemName: 'O+ Blood', itemType: 'blood_unit', quantity: Math.floor(Math.random() * 30) },
                    { itemName: 'Ventilators', itemType: 'equipment', quantity: Math.floor(Math.random() * 5) },
                    { itemName: 'PPE Kits', itemType: 'medical_supply', quantity: Math.floor(Math.random() * 100) }
                ],
                staffRoster: {
                    onDuty: [{ name: `Dr. ${h.name.split(' ')[0]}Lead`, role: 'Physician', status: 'Available' }],
                    onCall: [{ name: `Dr. OnCall ${h.reg}`, role: 'Surgeon' }]
                }
            });
        }
        console.log('✅ Created 5 additional hospital accounts and their hospital records');

        // 4. Populate Hospital Data (So dashboard isn't empty)
        await Hospital.create({
            user: myHospital._id,
            status: { erCapacity: 65, icuBedsAvailable: 3, generalBedsAvailable: 15, onDutyDoctors: 12 },
            inventory: [
                { itemName: 'O+ Blood', itemType: 'blood_unit', quantity: 20 },
                { itemName: 'A- Blood', itemType: 'blood_unit', quantity: 8 },
                { itemName: 'Surgical Kits', itemType: 'medical_supply', quantity: 50 }
            ],
            staffRoster: {
                onDuty: [{ name: "Dr. House", role: "Diagnostician", status: "Busy" }, { name: "Nurse Joy", role: "ER Nurse", status: "Available" }],
                onCall: [{ name: "Dr. Strange", role: "Surgeon" }]
            }
        });
        console.log('✅ Created Hospital Inventory & Roster');

        // 5. Create Active Alerts (So Gov/Hospital have alerts to show)
        await Alert.create({
            user: mePublic._id,
            locationDetails: "Lat: 12.9716, Lng: 77.5946",
            message: "Severe chest pain, difficulty breathing.",
            emergencyType: "cardiac_issue",
            priority: "High",
            status: "pending"
        });
        console.log('✅ Created Emergency Alerts');

        // ... (keep previous code)

        // 6. Create Resource Requests (For Public Dashboard)
        await require('./models/ResourceRequest').create({
            requester: mePublic._id,
            requestType: 'blood',
            details: 'Need O+ donors for scheduled surgery',
            urgency: 'medium',
            status: 'pending'
        });

        await require('./models/ResourceRequest').create({
            requester: mePublic._id,
            requestType: 'organ',
            details: 'Kidney transplant waiting list inquiry',
            urgency: 'low',
            status: 'pending'
        });
        console.log('✅ Created Resource Requests');

        // ... (end of script)
        console.log('🚀 Super Seed Complete! You can now log in.');
        process.exit();
        
    } catch (err) { console.error(err); process.exit(1); }
    
};

seedDB();