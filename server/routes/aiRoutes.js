const { spawn } = require('child_process');
const express = require('express');
const router = express.Router();
const { runPythonModel } = require('../utils/pythonRunner');

// --- Map frontend endpoints to Python commands ---
// This generic handler saves us from writing 18 separate route functions
const createPredictionRoute = (endpoint, pythonCommand) => {
    router.post(endpoint, async (req, res) => {
        try {
            const result = await runPythonModel(pythonCommand, req.body);
            res.json(result);
        } catch (error) {
            console.error(`AI Error [${pythonCommand}]:`, error.message);
            res.status(500).json({ message: 'AI processing failed', error: error.message });
        }
    });
};

// --- Define Routes ---

// Public / Health
createPredictionRoute('/predict_health_risk', 'predict_risk');
createPredictionRoute('/check_compatibility', 'predict_compat');
// ... existing routes ...

// Public User AI Features
createPredictionRoute('/predict_user_cluster', 'predict_cluster'); // For "Find My Profile"
createPredictionRoute('/predict_user_forecast', 'predict_forecast'); // For "Donation Forecast"

// ... keep the rest ...

// Hospital Operations
createPredictionRoute('/hosp/predict_severity', 'predict_hosp_severity');
// Hospital Operations (Removed - using hospitalRoutes instead which has better handling)
// createPredictionRoute('/hosp/predict_eta', 'predict_eta');
// createPredictionRoute('/hosp/predict_bed_forecast', 'predict_bed_forecast');
// createPredictionRoute('/hosp/predict_staff_allocation', 'predict_staff_alloc');
// createPredictionRoute('/hosp/predict_performance', 'predict_hosp_perf');
// createPredictionRoute('/hosp/predict_recovery', 'predict_recovery');
// createPredictionRoute('/hosp/predict_stay_duration', 'predict_stay');
// createPredictionRoute('/hosp/predict_disease_forecast', 'predict_hosp_disease');
// createPredictionRoute('/hosp/find_matches', 'predict_compat'); // Reusing compatibility logic

// Government / Analytics
createPredictionRoute('/gov/predict_outbreak', 'predict_forecast_outbreak');
createPredictionRoute('/gov/predict_severity', 'predict_severity');
createPredictionRoute('/gov/predict_availability', 'predict_availability');
createPredictionRoute('/gov/predict_allocation', 'predict_allocation');
createPredictionRoute('/gov/predict_policy_segment', 'predict_policy_seg');
createPredictionRoute('/gov/predict_performance_score', 'predict_perf_score');
createPredictionRoute('/gov/predict_anomaly', 'predict_anomaly');
// --- NEW ROUTE FOR AI RECORDS (FIXED PATH) ---
router.post('/analyze_report', (req, res) => {
    const { report_text } = req.body;
    
    // Using consolidated ai_ml.py
    const pythonProcess = spawn('python', ['./ml/ai_ml.py', 'analyze_report', report_text]);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        try {
            // Check if we got empty data (which means python failed)
            if (!dataString) {
                throw new Error("No data received from AI engine");
            }
            const result = JSON.parse(dataString);
            res.json(result);
        } catch (e) {
            console.error("Parse Error:", e);
            // Send a standard error format that the frontend expects
            res.json({ 
                error: "AI Engine Failed. Please check the backend terminal for details.",
                risk_level: "Error",
                risk_score: 0,
                summary: "System could not process the report."
            });
        }
    });
});

// ... (Keep existing imports and analyze_report route)

// GENERIC AI HELPER FUNCTION
const runAI = (res, args) => {
    // Using consolidated ai_ml.py
    const pythonProcess = spawn('python', ['./ml/ai_ml.py', ...args]);
    let dataString = '';
    
    pythonProcess.stdout.on('data', (data) => dataString += data.toString());
    pythonProcess.stderr.on('data', (data) => console.error(`AI Error: ${data}`));
    
    pythonProcess.on('close', () => {
        try {
            res.json(JSON.parse(dataString || '{}'));
        } catch (e) {
            res.status(500).json({ error: "AI Processing Failed" });
        }
    });
};

// NOTE: Hospital routes (triage, eta, bed_forecast, staff, donors, performance, recovery, stay) 
// are now handled by hospitalRoutes.js for consistency with real ML models
// DO NOT duplicate these routes here - they will conflict

// 7. Patient Recovery (UPDATED to use JSON body)
router.post('/hospital/patient/recovery', async (req, res) => {
    try {
        const result = await runPythonModel('predict_recovery', req.body);
        res.json(result);
    } catch (error) {
        console.error('Recovery Prediction Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 8. Length of Stay (UPDATED to use JSON body)
router.post('/hospital/patient/stay', async (req, res) => {
    try {
        const result = await runPythonModel('predict_stay', req.body);
        res.json(result);
    } catch (error) {
        console.error('Stay Duration Prediction Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ... existing routes
// 9. Inventory Prediction
router.post('/hospital/inventory/predict', async (req, res) => {
    try {
        const result = await runPythonModel('predict_inventory', req.body);
        res.json(result);
    } catch (error) {
        console.error('Inventory Prediction Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;