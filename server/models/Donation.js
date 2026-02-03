const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    donationType: { 
        type: String, 
        enum: ['blood', 'organ'], 
        required: true 
    },
    donationDate: { type: Date, default: Date.now },
    hospital: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // Linking to the Hospital User
        required: true 
    },
    details: String // e.g., "450ml extracted"
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);