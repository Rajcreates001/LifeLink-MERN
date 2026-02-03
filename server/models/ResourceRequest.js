const mongoose = require('mongoose');

const resourceRequestSchema = new mongoose.Schema({
    requester: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    requestType: { 
        type: String, 
        enum: ['blood', 'organ'], 
        required: true 
    },
    details: String, // e.g., "O+ Blood needed urgently"
    urgency: { 
        type: String, 
        enum: ['low', 'medium', 'high'], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'matched', 'fulfilled', 'cancelled'], 
        default: 'pending' 
    }
}, { timestamps: true });

module.exports = mongoose.model('ResourceRequest', resourceRequestSchema);