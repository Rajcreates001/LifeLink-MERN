const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true }, // e.g., 'Paracetamol', 'O+ Blood'
    category: { type: String, enum: ['Medicine', 'Blood', 'Organ', 'Equipment'], required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'units' }, // e.g., 'vials', 'bags', 'units'
    minThreshold: { type: Number, default: 10 }, // AI trigger point
    expiryDate: { type: Date },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', resourceSchema);