const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true 
    },
    
    // BEDS INFORMATION
    beds: {
        totalBeds: { type: Number, default: 0 },
        occupiedBeds: { type: Number, default: 0 },
        availableBeds: { type: Number, default: 0 }
    },

    // DOCTORS INFORMATION
    doctors: [{
        name: { type: String, required: true },
        department: { type: String, required: true },
        availability: { type: Boolean, default: true },
        specialization: String,
        phone: String,
        email: String
    }],

    // RESOURCES INFORMATION
    resources: [{
        name: { type: String, required: true },
        category: { type: String, required: true }, // e.g., "Equipment", "Blood", "Medicines"
        totalUnits: { type: Number, default: 0 },
        availableUnits: { type: Number, default: 0 },
        unit: { type: String, default: 'units' }, // e.g., "units", "liters", "bottles"
        description: String
    }],
    
    // Real-time Status (deprecated - kept for backward compatibility)
    status: {
        erCapacity: { type: Number, default: 0 },
        icuBedsAvailable: { type: Number, default: 0 },
        generalBedsAvailable: { type: Number, default: 0 },
        onDutyDoctors: { type: Number, default: 0 }
    },

    // Inventory List (keeping for backward compatibility)
    inventory: [{
        itemName: String,
        itemType: { type: String, enum: ['blood_unit', 'organ', 'medical_supply', 'equipment'] },
        quantity: Number,
        lastUpdated: { type: Date, default: Date.now }
    }],

    // Staff Roster (keeping for backward compatibility)
    staffRoster: {
        onDuty: [{ name: String, role: String, status: String }],
        onCall: [{ name: String, role: String }]
    }
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);