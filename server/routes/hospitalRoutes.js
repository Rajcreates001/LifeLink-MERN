const express = require('express');
const router = express.Router();
const { runPythonModel } = require('../utils/pythonRunner');

// --- CONFIGURATION ---
// All routes now use the consolidated ML models from ai_ml.py
const ML_SCRIPT = 'ai_ml.py';


// =================================================================
// SECTION 1: ROUTES FOR "HospitalAnalytics.jsx" (The Analytics Tab)
// Uses ai_ml.py (Real ML Models)
// =================================================================

// 1. Patient Triage - using hospital severity prediction
router.post('/triage', async (req, res) => {
    try {
        const result = await runPythonModel('predict_hosp_severity', req.body, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 2. Ambulance ETA
router.post('/eta', async (req, res) => {
    try {
        const result = await runPythonModel('predict_eta', req.body, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 3. Bed Forecast
router.post('/bed_forecast', async (req, res) => {
    try {
        // Map hospitalId for bed forecast model
        const inputData = { ...req.body, hospital_id: 1 };
        const result = await runPythonModel('predict_bed_forecast', inputData, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 4. Staff Allocation
router.post('/staff', async (req, res) => {
    try {
        const result = await runPythonModel('predict_staff_alloc', req.body, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 5. Donor Search - using compatibility prediction
router.post('/donors', async (req, res) => {
    try {
        const result = await runPythonModel('predict_compat', req.body, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 6. Hospital Performance
router.post('/performance', async (req, res) => {
    try {
        const result = await runPythonModel('predict_hosp_perf', req.body, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});


// =================================================================
// SECTION 2: ROUTES FOR "HospitalAI.jsx" (The Dashboard Widgets)
// Uses ai_ml.py (ML Models)
// =================================================================

// 1. Ambulance ETA & Route
router.post('/predict_eta', async (req, res) => {
    try {
        // Frontend sends start_node and end_node directly
        const result = await runPythonModel('predict_eta', req.body, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 2. Bed Demand Forecast
router.post('/predict_bed_forecast', async (req, res) => {
    try {
        const result = await runPythonModel('predict_bed_forecast', req.body, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 3. Staff Allocation
router.post('/predict_staff_allocation', async (req, res) => {
    try {
        const result = await runPythonModel('predict_staff_alloc', req.body, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 4. Disease Forecast Chart
router.post('/predict_disease_forecast', async (req, res) => {
    try {
        const result = await runPythonModel('predict_hosp_disease', req.body, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 5. Patient Recovery Probability
router.post('/predict_recovery', async (req, res) => {
    try {
        const result = await runPythonModel('predict_recovery', req.body, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 6. Length of Stay Duration
router.post('/predict_stay_duration', async (req, res) => {
    try {
        const result = await runPythonModel('predict_stay', req.body, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 7. Hospital Performance
router.post('/predict_performance', async (req, res) => {
    try {
        const result = await runPythonModel('predict_hosp_perf', req.body, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 8. Inventory Prediction
router.post('/inventory', async (req, res) => {
    try {
        const result = await runPythonModel('predict_inventory', req.body, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;

