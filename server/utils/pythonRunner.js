// server/utils/pythonRunner.js
const { spawn } = require('child_process');
const path = require('path');

// Added 'scriptName' parameter (defaults to ai_ml.py if not provided)
const runPythonModel = (command, jsonInput, scriptName = 'ai_ml.py') => {
    return new Promise((resolve, reject) => {
        const mlFolder = path.join(__dirname, '..', 'ml');
        const scriptPath = path.join(mlFolder, scriptName);
        const pythonExec = process.env.PYTHON_PATH || 'python3';
        
        // --- FIXED LOGIC ---
        // We must ensure 'jsonInput' is always an object so Python can use .get()
        let finalInput = jsonInput;

        // If jsonInput is just a number or a string (primitive), wrap it in an object
        if (typeof jsonInput !== 'object' || jsonInput === null) {
            // Map common commands to their expected keys
            if (command === 'predict_bed') {
                finalInput = { occupancy: jsonInput };
            } else if (command === 'predict_eta') {
                finalInput = { location: jsonInput };
            } else {
                finalInput = { value: jsonInput };
            }
        }

        const inputString = JSON.stringify(finalInput);
        // -------------------

        // Spawn process
        const pythonProcess = spawn(pythonExec, [scriptPath, command, inputString], { cwd: mlFolder });

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python Error (${scriptName} - ${command}):`, errorString || dataString);
                return reject(new Error(errorString || dataString || 'Python script execution failed'));
            }
            try {
                // Attempt to parse JSON
                const jsonResult = JSON.parse(dataString || '{}');
                resolve(jsonResult);
            } catch (e) {
                console.error("Failed to parse Python output:", dataString);
                reject(new Error(`Invalid JSON from Python: ${dataString}`));
            }
        });
    });
};

module.exports = { runPythonModel };