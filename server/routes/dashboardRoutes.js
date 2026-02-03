const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Alert = require('../models/Alert');
const ResourceRequest = require('../models/ResourceRequest');
const Patient = require('../models/Patient'); // <--- Import the new Model
const Resource = require('../models/Resource');
const HospitalMessage = require('../models/HospitalMessage');

// ==========================================
// 1. PUBLIC DASHBOARD ROUTES
// ==========================================

// @route   GET /api/dashboard/public/:userId/full
// @desc    Get User Full Profile + History (Alerts/Requests/Hospital Messages)
router.get('/public/:userId/full', async (req, res) => {
    try {
        const { userId } = req.params;
        // Alerts are stored with field `user` (ObjectId). ResourceRequests use `requester`.
        const alerts = await Alert.find({ user: userId }).sort({ createdAt: -1 });
        const requests = await ResourceRequest.find({ requester: userId }).sort({ createdAt: -1 });
        const hospitalMessages = await HospitalMessage.find({ 
            toHospital: userId,
            status: { $ne: 'resolved' }
        })
          .populate('fromHospital', 'name location email')
          .sort({ createdAt: -1 });
        
        // Return alerts, requests, hospital messages, and HEALTH RECORDS (from User model)
        const user = await User.findById(userId).select('publicProfile');

        res.json({ 
            alerts, 
            resourceRequests: requests,
            hospitalMessages,
            healthRecords: user?.publicProfile?.healthRecords || {} 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// @route   PUT /api/dashboard/profile/:userId
// @desc    Update Profile (Handles BOTH Public & Hospital)
router.put('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // Destructure all possible fields
        const { 
            name, email, phone, location, password,
            age, bloodGroup, medicalHistory, // Public
            regNumber, totalBeds, ambulances, specialties, type, website // Hospital
        } = req.body;

        const userUpdates = {};
        
        // Common
        if (name) userUpdates.name = name;
        if (email) userUpdates.email = email;
        if (phone) userUpdates.phone = phone;
        if (location) userUpdates.location = location;
        if (password) userUpdates.password = password; // Note: In prod, hash this!

        // Public Profile
        if (age) userUpdates['publicProfile.healthRecords.age'] = age;
        if (bloodGroup) userUpdates['publicProfile.healthRecords.bloodGroup'] = bloodGroup;
        if (phone) userUpdates['publicProfile.healthRecords.contact'] = phone;
        if (medicalHistory !== undefined) {
             const conditionsArray = medicalHistory.split(',').map(s => s.trim()).filter(s => s);
             userUpdates['publicProfile.healthRecords.conditions'] = conditionsArray;
        }

        // Hospital Profile
        if (regNumber) userUpdates['hospitalProfile.regNumber'] = regNumber;
        if (totalBeds) userUpdates['hospitalProfile.totalBeds'] = totalBeds;
        if (ambulances) userUpdates['hospitalProfile.ambulances'] = ambulances;
        if (type) userUpdates['hospitalProfile.type'] = type;
        if (website) userUpdates['hospitalProfile.website'] = website;
        if (specialties) {
             const specArray = Array.isArray(specialties) ? specialties : specialties.split(',').map(s => s.trim()).filter(s => s);
             userUpdates['hospitalProfile.specialties'] = specArray;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: userUpdates },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({ message: "Profile Updated", user: updatedUser });
    } catch (err) {
        console.error("Profile Update Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

// ==========================================
// 2. HOSPITAL DASHBOARD ROUTES
// ==========================================

// @route   GET /api/dashboard/hospital/stats
router.get('/hospital/stats', async (req, res) => {
    try {
        // Mock Data for now (replace with real DB aggregation later)
        const stats = {
            totalPatients: 142,
            availableBeds: 38,
            criticalCases: 9,
            activeAmbulances: 5,
            caseDistribution: [
                { name: 'Cardiac', value: 30 },
                { name: 'Trauma', value: 40 },
                { name: 'Viral', value: 20 },
                { name: 'Other', value: 10 }
            ],
            patientFlow: [
                { time: '08:00', admitted: 10, discharged: 5 },
                { time: '12:00', admitted: 20, discharged: 15 },
                { time: '16:00', admitted: 15, discharged: 10 },
                { time: '20:00', admitted: 25, discharged: 20 }
            ]
        };
        res.json(stats);
    } catch (err) { res.status(500).json({ message: "Server Error" }); }
});

// @route   GET /api/dashboard/hospital/alerts
router.get('/hospital/alerts', async (req, res) => {
    try {
        const alerts = await Alert.find({ status: { $ne: 'Resolved' } }).sort({ createdAt: -1 });
        res.json(alerts);
    } catch (err) { res.status(500).json({ message: "Server Error" }); }
});

// @route   PUT /api/dashboard/hospital/alert/:id
router.put('/hospital/alert/:id', async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(alert);
    } catch (err) { res.status(500).json({ message: "Update Failed" }); }
});


// ==========================================
// 3. GOVERNMENT DASHBOARD ROUTES (MISSING PART)
// ==========================================

// @route   GET /api/dashboard/admin/pending-hospitals
// @desc    Get all hospitals where isVerified is FALSE
router.get('/admin/pending-hospitals', async (req, res) => {
    try {
        // Find users with role 'hospital' AND isVerified is false
        const pending = await User.find({ role: 'hospital', isVerified: false });
        res.json(pending);
    } catch (err) {
        console.error("Admin Fetch Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

// @route   PUT /api/dashboard/admin/verify/:id
// @desc    Approve a hospital
router.put('/admin/verify/:id', async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isVerified: true });
        res.json({ message: "Hospital Verified Successfully" });
    } catch (err) {
        res.status(500).json({ message: "Verification Failed" });
    }
});

router.post('/hospital/patient/admit', async (req, res) => {
    try {
        const { hospitalId, name, age, gender, dept, room, condition, severity, oxygen, heartRate, bp } = req.body;

        const newPatient = new Patient({
            hospitalId, name, age, gender, dept, room, condition, severity, oxygen, heartRate, bp
        });

        await newPatient.save();
        res.status(201).json(newPatient);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to admit patient" });
    }
});

// @route   GET /api/dashboard/hospital/patients/:hospitalId
// @desc    Get all patients for a specific hospital
router.get('/hospital/patients/:hospitalId', async (req, res) => {
    try {
        const patients = await Patient.find({ hospitalId: req.params.hospitalId }).sort({ admitDate: -1 });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// ... (Keep existing routes)
router.post('/hospital/resource/add', async (req, res) => {
    try {
        const { hospitalId, name, category, quantity, unit, minThreshold, expiryDate } = req.body;
        const newResource = new Resource({ hospitalId, name, category, quantity, unit, minThreshold, expiryDate });
        await newResource.save();
        res.status(201).json(newResource);
    } catch (err) { res.status(500).json({ message: "Error adding resource" }); }
});

// @route   GET /api/dashboard/hospital/resources/:hospitalId
router.get('/hospital/resources/:hospitalId', async (req, res) => {
    try {
        const resources = await Resource.find({ hospitalId: req.params.hospitalId }).sort({ category: 1 });
        res.json(resources);
    } catch (err) { res.status(500).json({ message: "Server Error" }); }
});

// @route   DELETE /api/dashboard/notification/:type/:id
// @desc    Delete a notification item (alert, request, or hospital message)
router.delete('/notification/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        if (type === 'alert') {
            await Alert.findByIdAndDelete(id);
            return res.json({ message: 'Alert deleted' });
        } else if (type === 'request') {
            await ResourceRequest.findByIdAndDelete(id);
            return res.json({ message: 'Request deleted' });
        } else if (type === 'message') {
            await HospitalMessage.findByIdAndDelete(id);
            return res.json({ message: 'Hospital message deleted' });
        } else {
            return res.status(400).json({ message: 'Unknown notification type' });
        }
    } catch (err) {
        console.error('Delete notification error:', err);
        res.status(500).json({ message: 'Failed to delete notification' });
    }
});
module.exports = router;