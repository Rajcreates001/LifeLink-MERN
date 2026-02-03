const mongoose = require('mongoose');

const HospitalMessageSchema = new mongoose.Schema({
  fromHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  toHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  messageType: {
    type: String,
    enum: ['staff', 'doctor', 'resource'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  requestDetails: {
    staffCount: {
      type: Number,
      default: 0
    },
    specialization: String,
    resourceName: String,
    resourceQuantity: Number,
    urgencyLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    preferredDate: Date,
    duration: String // e.g., "1 day", "3 days", "1 week"
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'resolved'],
    default: 'pending'
  },
  response: {
    message: String,
    responseDate: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HospitalMessage', HospitalMessageSchema);
