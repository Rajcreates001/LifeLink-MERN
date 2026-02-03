const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Links to the Hospital User
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    contact: { type: String },
    
    // Medical Info
    dept: { type: String, required: true },
    room: { type: String, required: true },
    condition: { type: String, required: true },
    severity: { type: String, enum: ['Critical', 'High', 'Moderate', 'Stable'], default: 'Stable' },
    status: { type: String, default: 'Admitted' },
    
    // Vitals (For AI)
    oxygen: { type: Number, default: 98 },
    heartRate: { type: Number, default: 80 },
    bp: { type: String, default: '120/80' },
    
    admitDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);