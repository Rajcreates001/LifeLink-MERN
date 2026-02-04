const mongoose = require('mongoose');
const Ambulance = require('./models/Ambulance');
const Hospital = require('./models/Hospital');
require('dotenv').config();

const MANGALORE_AMBULANCES = [
    {
        ambulanceId: 'AMB-KMC-001',
        registrationNumber: 'KA05AB0001',
        status: 'available',
        currentLocation: {
            latitude: 12.8752,
            longitude: 74.8470,
            address: 'KMC Hospital Mangalore'
        },
        driver: {
            name: 'Rajesh Kumar',
            phone: '9876543210',
            licenseNumber: 'DL2223KA0112345'
        },
        medicalCrew: [
            { name: 'Dr. Priya Sharma', role: 'Paramedic' },
            { name: 'Anil Verma', role: 'EMT' }
        ],
        equipment: [
            { name: 'Stretcher', quantity: 2, status: 'available' },
            { name: 'Oxygen Tank', quantity: 3, status: 'available' },
            { name: 'Defibrillator', quantity: 1, status: 'available' }
        ]
    },
    {
        ambulanceId: 'AMB-KMC-002',
        registrationNumber: 'KA05AB0002',
        status: 'available',
        currentLocation: {
            latitude: 12.9276,
            longitude: 74.9276,
            address: 'Balmatta Road, Mangalore'
        },
        driver: {
            name: 'Mohammed Ali',
            phone: '9876543220',
            licenseNumber: 'DL2223KA0112346'
        },
        medicalCrew: [
            { name: 'Nurse Fatima', role: 'Paramedic' },
            { name: 'Suresh Singh', role: 'EMT' }
        ],
        equipment: [
            { name: 'Stretcher', quantity: 2, status: 'available' },
            { name: 'Oxygen Tank', quantity: 3, status: 'available' },
            { name: 'Defibrillator', quantity: 1, status: 'available' }
        ]
    },
    {
        ambulanceId: 'AMB-KMC-003',
        registrationNumber: 'KA05AB0003',
        status: 'available',
        currentLocation: {
            latitude: 12.8350,
            longitude: 74.8500,
            address: 'Pumpwell, Mangalore'
        },
        driver: {
            name: 'Vishal Nair',
            phone: '9876543230',
            licenseNumber: 'DL2223KA0112347'
        },
        medicalCrew: [
            { name: 'Dr. Ashok Kumar', role: 'Paramedic' },
            { name: 'Ravi Teja', role: 'EMT' }
        ],
        equipment: [
            { name: 'Stretcher', quantity: 2, status: 'available' },
            { name: 'Oxygen Tank', quantity: 3, status: 'available' },
            { name: 'Defibrillator', quantity: 1, status: 'available' }
        ]
    },
    {
        ambulanceId: 'AMB-KMC-004',
        registrationNumber: 'KA05AB0004',
        status: 'available',
        currentLocation: {
            latitude: 12.9050,
            longitude: 74.8200,
            address: 'Jeppinamogru, Mangalore'
        },
        driver: {
            name: 'Shankar Reddy',
            phone: '9876543240',
            licenseNumber: 'DL2223KA0112348'
        },
        medicalCrew: [
            { name: 'Nurse Divya', role: 'Paramedic' },
            { name: 'Sandeep Patel', role: 'EMT' }
        ],
        equipment: [
            { name: 'Stretcher', quantity: 2, status: 'available' },
            { name: 'Oxygen Tank', quantity: 3, status: 'available' },
            { name: 'Defibrillator', quantity: 1, status: 'available' }
        ]
    },
    {
        ambulanceId: 'AMB-KMC-005',
        registrationNumber: 'KA05AB0005',
        status: 'available',
        currentLocation: {
            latitude: 12.8600,
            longitude: 74.8700,
            address: 'Kadri, Mangalore'
        },
        driver: {
            name: 'Prakash Rao',
            phone: '9876543250',
            licenseNumber: 'DL2223KA0112349'
        },
        medicalCrew: [
            { name: 'Dr. Meera Singh', role: 'Paramedic' },
            { name: 'Deepak Kumar', role: 'EMT' }
        ],
        equipment: [
            { name: 'Stretcher', quantity: 2, status: 'available' },
            { name: 'Oxygen Tank', quantity: 3, status: 'available' },
            { name: 'Defibrillator', quantity: 1, status: 'available' }
        ]
    },
    {
        ambulanceId: 'AMB-KMC-006',
        registrationNumber: 'KA05AB0006',
        status: 'available',
        currentLocation: {
            latitude: 12.8900,
            longitude: 74.8600,
            address: 'Kavoor, Mangalore'
        },
        driver: {
            name: 'Amit Chakraborty',
            phone: '9876543260',
            licenseNumber: 'DL2223KA0112350'
        },
        medicalCrew: [
            { name: 'Nurse Anjali', role: 'Paramedic' },
            { name: 'Gaurav Singh', role: 'EMT' }
        ],
        equipment: [
            { name: 'Stretcher', quantity: 2, status: 'available' },
            { name: 'Oxygen Tank', quantity: 3, status: 'available' },
            { name: 'Defibrillator', quantity: 1, status: 'available' }
        ]
    }
];

const seedAmbulances = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelink');

        console.log('✅ Connected to MongoDB');

        // Get first hospital or create dummy ID
        let hospitalId;
        let hospital = await Hospital.findOne();
        
        if (hospital) {
            hospitalId = hospital._id;
            console.log('✅ Using existing hospital');
        } else {
            // Use a placeholder ID - in production, you'd link to actual hospitals
            hospitalId = new mongoose.Types.ObjectId();
            console.log('⚠️  No hospital found. Using placeholder ID. Link ambulances to actual hospital later.');
        }

        // Add hospital ID to all ambulances
        const ambulancesWithHospital = MANGALORE_AMBULANCES.map(amb => ({
            ...amb,
            hospital: hospitalId
        }));

        // Check if ambulances already exist
        const existingCount = await Ambulance.countDocuments({
            ambulanceId: { $in: MANGALORE_AMBULANCES.map(a => a.ambulanceId) }
        });

        if (existingCount > 0) {
            console.log(`⚠️  ${existingCount} ambulances already exist. Deleting old ones...`);
            await Ambulance.deleteMany({ ambulanceId: { $in: MANGALORE_AMBULANCES.map(a => a.ambulanceId) } });
        }

        // Insert ambulances
        const result = await Ambulance.insertMany(ambulancesWithHospital);
        console.log(`✅ Successfully seeded ${result.length} ambulances in Mangalore`);
        
        result.forEach(amb => {
            const location = amb.currentLocation;
            console.log(`   🚑 ${amb.ambulanceId} (${amb.registrationNumber}) - ${location.address}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding ambulances:', error.message);
        process.exit(1);
    }
};

seedAmbulances();
