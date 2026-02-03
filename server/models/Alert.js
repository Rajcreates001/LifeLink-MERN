const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    locationDetails: { type: String, required: true },
    coordinates: {
        lat: Number,
        lng: Number
    },
    message: { type: String, required: true },
    emergencyType: { type: String, default: 'Unclassified' }, // Predicted by Python
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'High' }, // Predicted by Python
    status: { 
        type: String, 
        enum: ['pending', 'dispatched', 'resolved', 'cancelled'], 
        default: 'pending' 
    },
    // AI/ML fields (added so ML results persist and can be shown in notifications)
    severity_score: { type: Number, default: null },
    ai_confidence: { type: Number, default: null },
    ambulance_type: { type: String, default: 'Standard' },
    recommended_hospital: { type: String, default: null },
    dispatchedHospital: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);