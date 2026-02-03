require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import Models
const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Donation = require('./models/Donation');
const ResourceRequest = require('./models/ResourceRequest');
const Alert = require('./models/Alert');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🌱 Connected to MongoDB...');

        // 1. Clear existing data
        await User.deleteMany({});
        await Hospital.deleteMany({});
        await Donation.deleteMany({});
        await ResourceRequest.deleteMany({});
        await Alert.deleteMany({});
        console.log('🧹 Database cleared.');

        // 2. Create Users (Password hashing is automatic in User model)
        
        // --- Public User ---
        const publicUser = await User.create({
            name: 'Maharaj Public',
            email: 'public@test.com',
            password: 'password123',
            role: 'public',
            age: 25,
            gender: 'Male',
            publicProfile: {
                isDonor: true,
                bloodGroup: 'O+',
                location: 'Downtown, Central City',
                healthRecords: [{ recordType: 'Checkup', description: 'Annual Physical', date: new Date() }]
            }
        });

        // --- Hospital User ---
        const hospitalUser = await User.create({
            name: 'Dr. Sarah Smith',
            email: 'hospital@test.com',
            password: 'password123',
            role: 'hospital',
            hospitalProfile: {
                hospitalName: 'Central City General',
                registrationId: 'HOSP-778899',
                contactNumber: '555-0123',
                isVerified: true,
                jurisdiction: 'Central City'
            }
        });

        // --- Gov User ---
        const govUser = await User.create({
            name: 'Officer John Doe',
            email: 'gov@test.com',
            password: 'password123',
            role: 'government',
            govProfile: {
                department: 'Health Department',
                designation: 'Senior Analyst',
                officialId: 'GOV-112233',
                jurisdiction: 'Central City'
            }
        });

        console.log('✅ Users Created');

        // 3. Create Hospital Operational Data
        await Hospital.create({
            user: hospitalUser._id,
            status: {
                erCapacity: 75,
                icuBedsAvailable: 4,
                generalBedsAvailable: 12,
                onDutyDoctors: 8
            },
            inventory: [
                { itemName: 'O+ Blood Bags', itemType: 'blood_unit', quantity: 45 },
                { itemName: 'Ventilators', itemType: 'medical_supply', quantity: 10 }
            ],
            staffRoster: {
                onDuty: [{ name: 'Dr. Smith', role: 'ER', status: 'Busy' }],
                onCall: [{ name: 'Dr. Jones', role: 'Surgeon' }]
            }
        });
        console.log('✅ Hospital Data Created');

        // 4. Create Donations & Requests
        await Donation.create({
            donor: publicUser._id,
            donationType: 'blood',
            hospital: hospitalUser._id,
            details: '450ml Whole Blood'
        });

        await ResourceRequest.create({
            requester: hospitalUser._id,
            requestType: 'organ',
            details: 'Kidney needed urgently for patient #404',
            urgency: 'high',
            status: 'pending'
        });
        console.log('✅ Activity Data Created');

        console.log('🚀 Database Seeded Successfully!');
        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();