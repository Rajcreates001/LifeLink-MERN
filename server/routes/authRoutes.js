const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Ensure you have installed this: npm install bcryptjs
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
require('dotenv').config();
const { signup, login } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
// @route   POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role, location, phone, regNumber, hospitalType } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Verification Logic
        const isVerified = role === 'public' || role === 'government'; 

        // Create Object
        const newUserObj = {
            name,
            email,
            password: hashedPassword,
            role: role.toLowerCase(), // Save as lowercase
            location,
            phone,
            isVerified
        };

        if (role === 'hospital') {
            newUserObj.hospitalProfile = {
                regNumber: regNumber || '',
                type: hospitalType || 'General'
            };
        }

        user = new User(newUserObj);
        await user.save();

        // Create Hospital document if role is hospital
        if (role === 'hospital') {
            const hospital = new Hospital({
                user: user._id
            });
            await hospital.save();
            console.log('[authRoutes] Hospital created with ID:', hospital._id, 'for user:', user._id);
            return res.status(201).json({ message: "Signup successful! Pending Government verification." });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token, user: { id: user._id, name: user.name, role: user.role } });

    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // 1. Validation
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        // 2. Find User
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // 3. Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // 4. ROBUST ROLE CHECK (Case Insensitive)
        // This prevents the "Server Error" if cases don't match exactly
        if (role) {
            const normalizedInputRole = role.toLowerCase();
            const normalizedDbRole = user.role.toLowerCase();
            
            if (normalizedInputRole !== normalizedDbRole) {
                return res.status(400).json({ 
                    message: `This email is registered as '${normalizedDbRole.toUpperCase()}', not '${normalizedInputRole.toUpperCase()}'. Please switch tabs.` 
                });
            }
        }

        // 5. Verification Check
        if (user.role === 'hospital' && !user.isVerified) {
            return res.status(403).json({ message: "Account pending Government verification." });
        }

        // 6. Generate Token
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                role: user.role, 
                location: user.location 
            } 
        });

    } catch (err) {
        console.error("Login Error:", err); // CHECK YOUR SERVER TERMINAL IF ERROR PERSISTS
        res.status(500).json({ message: "Server error during login" });
    }
});

module.exports = router;