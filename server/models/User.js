const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['public', 'hospital', 'government'], required: true }, // Added 'government'
    
    // VERIFICATION FLAG (New)
    isVerified: { type: Boolean, default: false }, 

    location: { type: String },
    phone: { type: String },

    // 1. PUBLIC PROFILE (Individual Health Data)
    publicProfile: {
        // In User.js inside publicProfile.healthRecords:
healthRecords: {
    age: { type: Number },
    gender: { type: String }, // Add this line if you want to save gender
    bloodGroup: { type: String },
    // ...
}
    },

    // 2. HOSPITAL PROFILE (Organization Data - New)
    hospitalProfile: {
        regNumber: { type: String }, // Government Registration ID
        type: { type: String, default: 'General' }, // General, Trauma, etc.
        totalBeds: { type: Number, default: 0 },
        ambulances: { type: Number, default: 0 },
        specialties: [{ type: String }],
        website: { type: String }
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);