const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/ambulance',
    method: 'GET',
    timeout: 5000
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Success! Found', json.count, 'ambulances');
            if(json.count > 0) {
                console.log('First ambulance:', JSON.stringify(json.data[0], null, 2));
            }
        } catch (e) {
            console.log('Parse error:', e.message);
            console.log('Raw data:', data.substring(0, 500));
        }
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
    process.exit(1);
});

req.on('timeout', () => {
    console.error('Timeout');
    req.destroy();
    process.exit(1);
});

req.end();

