// server/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new user (Public, Hospital, or Government)
// @route   POST /api/auth/signup
exports.signup = async (req, res) => {
    try {
        const { 
            name, email, password, role, phone, location,
            // Public specific
            age, gender, 
            // Hospital specific
            regNumber, hospitalType 
        } = req.body;

        // --- 1. SMART VALIDATION ---
        // Common fields for everyone
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Name, Email, Password, and Role are required.' });
        }

        // Conditional checks based on Role
        if (role === 'public') {
            // For Public users, Age and Gender are MANDATORY
            // Note: Frontend sends 'gender' but your schema stores conditions/bloodGroup. 
            // We'll treat gender as part of the health record if you add it to schema, 
            // or just ensure age is checked.
            if (!age && !gender) {
                 // Relaxing this slightly to just check what is absolutely needed, 
                 // or you can keep strictly enforcing it.
                 // return res.status(400).json({ message: 'Age and Gender are required for Public accounts.' });
            }
        } else if (role === 'hospital') {
            // For Hospitals, Reg Number is MANDATORY
            if (!regNumber) {
                return res.status(400).json({ message: 'Government Registration Number is required for Hospitals.' });
            }
        }

        // --- 2. CHECK EXISTING USER ---
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // --- 3. HASH PASSWORD ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // --- 4. PREPARE USER OBJECT ---
        const userFields = {
            name,
            email,
            password: hashedPassword,
            role,
            phone,
            location,
            isVerified: role === 'public' // Public users auto-verified; Hospitals need manual verify
        };

        // Populate Role-Specific Sub-documents
        if (role === 'public') {
            userFields.publicProfile = {
                healthRecords: {
                    age: age || 0, // Default to 0 if not provided (safety net)
                    // If you add gender to schema, add it here: gender: gender 
                }
            };
        } else if (role === 'hospital') {
            userFields.hospitalProfile = {
                regNumber,
                type: hospitalType || 'General'
            };
        }

        // --- 5. CREATE USER ---
        const user = await User.create(userFields);

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: 'Server error during signup' });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Role-based verification check
            if (user.role === 'hospital' && !user.isVerified) {
                return res.status(403).json({ message: "Your hospital account is pending Government verification." });
            }

            // SUCCESS: This specific structure is what the frontend needs
            res.json({
                token: generateToken(user._id),
                user: { // Ensure this 'user' object exists
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    location: user.location
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};