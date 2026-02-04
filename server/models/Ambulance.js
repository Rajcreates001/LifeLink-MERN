const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
    // Ambulance Identification
    ambulanceId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    registrationNumber: {
        type: String,
        required: true
    },
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true,
        index: true
    },

    // Current Status
    status: {
        type: String,
        enum: ['available', 'en_route', 'at_location', 'returning', 'maintenance'],
        default: 'available'
    },

    // Current Location & Tracking
    currentLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String },
        timestamp: { type: Date, default: Date.now }
    },

    // Route Information
    activeRoute: {
        startLocation: {
            latitude: Number,
            longitude: Number,
            address: String
        },
        destinationLocation: {
            latitude: Number,
            longitude: Number,
            address: String
        },
        routePath: [
            {
                latitude: Number,
                longitude: Number,
                timestamp: Date
            }
        ],
        distanceKm: Number,
        estimatedTimeMinutes: Number,
        startTime: Date,
        estimatedArrivalTime: Date,
        actualArrivalTime: Date
    },

    // ETA & Prediction Data
    etaPrediction: {
        estimatedMinutes: Number,
        confidenceLevel: {
            type: String,
            enum: ['High', 'Medium', 'Low'],
            default: 'Medium'
        },
        trafficFactor: Number, // 0-1, where 1 is no traffic
        weatherCondition: String,
        lastUpdated: Date
    },

    // Alternative Routes
    alternateRoutes: [
        {
            routeName: String,
            distanceKm: Number,
            estimatedMinutes: Number,
            trafficCondition: String,
            description: String
        }
    ],

    // Historical Data for ML Training
    travelHistory: [
        {
            date: Date,
            startLocation: {
                latitude: Number,
                longitude: Number,
                address: String
            },
            endLocation: {
                latitude: Number,
                longitude: Number,
                address: String
            },
            distanceKm: Number,
            actualTimeMinutes: Number,
            estimatedTimeMinutes: Number,
            trafficCondition: String,
            weather: String,
            predictionAccuracy: Number // percentage
        }
    ],

    // Driver Information
    driver: {
        name: String,
        licenseNumber: String,
        phone: String,
        availability: { type: Boolean, default: true }
    },

    // Medical Crew
    medicalCrew: [
        {
            name: String,
            role: { type: String, enum: ['Paramedic', 'EMT', 'Nurse', 'Doctor'] },
            specialization: String
        }
    ],

    // Equipment & Resources
    equipment: [
        {
            name: String,
            quantity: Number,
            status: { type: String, enum: ['available', 'in_use', 'needs_maintenance'], default: 'available' }
        }
    ],

    // Emergency Details
    currentEmergency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alert'
    },
    patientCount: { type: Number, default: 0 },
    emergencyType: String,
    priorityLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },

    // Real-time Metrics
    metrics: {
        averageResponseTime: Number, // in minutes
        onTimeDeliveryRate: Number, // percentage
        totalTripsToday: { type: Number, default: 0 },
        totalDistanceTodayKm: { type: Number, default: 0 }
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastLocationUpdate: Date
});

// Index for efficient querying
ambulanceSchema.index({ hospital: 1, status: 1 });
ambulanceSchema.index({ 'currentLocation.timestamp': 1 });
ambulanceSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Ambulance', ambulanceSchema);
