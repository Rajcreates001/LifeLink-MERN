const express = require('express');
const router = express.Router();
const Ambulance = require('../models/Ambulance');
const Hospital = require('../models/Hospital');
const axios = require('axios');

// ===========================
// AMBULANCE TRACKING ROUTES
// ===========================
// 0. GET all ambulances (no filter)
router.get('/', async (req, res) => {
    try {
        const ambulances = await Ambulance.find()
            .select('ambulanceId registrationNumber status currentLocation etaPrediction activeRoute metrics driver')
            .lean();

        res.json({
            success: true,
            count: ambulances.length,
            data: ambulances
        });
    } catch (error) {
        console.error('[GET /ambulances] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 1. GET all ambulances for a hospital
router.get('/hospital/:hospitalId', async (req, res) => {
    try {
        const { hospitalId } = req.params;

        const ambulances = await Ambulance.find({ hospital: hospitalId })
            .select('ambulanceId registrationNumber status currentLocation etaPrediction activeRoute metrics')
            .lean();

        res.json({
            success: true,
            count: ambulances.length,
            data: ambulances
        });
    } catch (error) {
        console.error('[GET /ambulances/hospital] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 2. GET single ambulance details
router.get('/:ambulanceId', async (req, res) => {
    try {
        const { ambulanceId } = req.params;

        const ambulance = await Ambulance.findById(ambulanceId)
            .populate('hospital', 'user')
            .populate('currentEmergency');

        if (!ambulance) {
            return res.status(404).json({
                success: false,
                error: 'Ambulance not found'
            });
        }

        res.json({
            success: true,
            data: ambulance
        });
    } catch (error) {
        console.error('[GET /ambulances/:id] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 3. CREATE new ambulance
router.post('/create', async (req, res) => {
    try {
        const {
            ambulanceId,
            registrationNumber,
            hospitalId,
            driverName,
            licenseNumber,
            driverPhone
        } = req.body;

        // Validate required fields
        if (!ambulanceId || !registrationNumber || !hospitalId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: ambulanceId, registrationNumber, hospitalId'
            });
        }

        // Check if ambulance already exists
        const existing = await Ambulance.findOne({ ambulanceId });
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Ambulance with this ID already exists'
            });
        }

        // Create new ambulance
        const ambulance = new Ambulance({
            ambulanceId,
            registrationNumber,
            hospital: hospitalId,
            driver: {
                name: driverName || 'Unassigned',
                licenseNumber,
                phone: driverPhone
            }
        });

        await ambulance.save();

        res.status(201).json({
            success: true,
            message: 'Ambulance created successfully',
            data: ambulance
        });
    } catch (error) {
        console.error('[POST /ambulances/create] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 4. UPDATE ambulance location
router.post('/:ambulanceId/update-location', async (req, res) => {
    try {
        const { ambulanceId } = req.params;
        const { latitude, longitude, address } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude required'
            });
        }

        const ambulance = await Ambulance.findByIdAndUpdate(
            ambulanceId,
            {
                currentLocation: {
                    latitude,
                    longitude,
                    address: address || 'Location Updated',
                    timestamp: new Date()
                },
                lastLocationUpdate: new Date()
            },
            { new: true }
        );

        if (!ambulance) {
            return res.status(404).json({
                success: false,
                error: 'Ambulance not found'
            });
        }

        res.json({
            success: true,
            message: 'Location updated',
            data: ambulance.currentLocation
        });
    } catch (error) {
        console.error('[POST /update-location] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 5. START tracking (create active route)
router.post('/:ambulanceId/start-route', async (req, res) => {
    try {
        const { ambulanceId } = req.params;
        const {
            startLatitude,
            startLongitude,
            startAddress,
            destinationLatitude,
            destinationLongitude,
            destinationAddress,
            emergencyType,
            priorityLevel
        } = req.body;

        const ambulance = await Ambulance.findById(ambulanceId);

        if (!ambulance) {
            return res.status(404).json({
                success: false,
                error: 'Ambulance not found'
            });
        }

        // Calculate distance (simple formula - can be enhanced with real map API)
        const distanceKm = calculateDistance(
            startLatitude, startLongitude,
            destinationLatitude, destinationLongitude
        );

        // Estimate time based on distance and average speed
        const estimatedMinutes = Math.ceil(distanceKm / 1.5); // ~1.5 km/min average

        ambulance.status = 'en_route';
        ambulance.activeRoute = {
            startLocation: {
                latitude: startLatitude,
                longitude: startLongitude,
                address: startAddress
            },
            destinationLocation: {
                latitude: destinationLatitude,
                longitude: destinationLongitude,
                address: destinationAddress
            },
            routePath: [{
                latitude: startLatitude,
                longitude: startLongitude,
                timestamp: new Date()
            }],
            distanceKm,
            estimatedTimeMinutes: estimatedMinutes,
            startTime: new Date(),
            estimatedArrivalTime: new Date(Date.now() + estimatedMinutes * 60000)
        };

        ambulance.emergencyType = emergencyType;
        ambulance.priorityLevel = priorityLevel || 'Medium';
        ambulance.metrics.totalTripsToday += 1;
        ambulance.metrics.totalDistanceTodayKm += distanceKm;

        await ambulance.save();

        res.json({
            success: true,
            message: 'Route started',
            data: {
                ambulanceId: ambulance.ambulanceId,
                status: ambulance.status,
                activeRoute: ambulance.activeRoute,
                estimatedArrivalTime: ambulance.activeRoute.estimatedArrivalTime
            }
        });
    } catch (error) {
        console.error('[POST /start-route] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 6. PREDICT ETA using ML
router.post('/:ambulanceId/predict-eta', async (req, res) => {
    try {
        const { ambulanceId } = req.params;
        const { currentLatitude, currentLongitude, destinationLatitude, destinationLongitude, trafficLevel, weather } = req.body;

        // Calculate remaining distance
        const remainingDistance = calculateDistance(
            currentLatitude, currentLongitude,
            destinationLatitude, destinationLongitude
        );

        // Fallback estimation (ML service not available)
        const estimatedMinutes = Math.ceil((remainingDistance / 40) * 60); // ~40 km/h average speed

        const etaPrediction = {
            estimatedMinutes,
            confidenceLevel: 'Medium',
            trafficFactor: trafficLevel === 'high' ? 0.7 : (trafficLevel === 'medium' ? 0.85 : 0.95),
            weatherCondition: weather || 'clear',
            lastUpdated: new Date()
        };

        res.json({
            success: true,
            message: 'ETA calculated',
            data: {
                ambulanceId: ambulanceId,
                etaPrediction: etaPrediction,
                remainingDistance: remainingDistance.toFixed(2)
            }
        });
    } catch (error) {
        console.error('[POST /predict-eta] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 7. GET optimized route
router.post('/:ambulanceId/get-route', async (req, res) => {
    try {
        const { ambulanceId } = req.params;
        const { startLatitude, startLongitude, destinationLatitude, destinationLongitude } = req.body;

        if (!startLatitude || !startLongitude || !destinationLatitude || !destinationLongitude) {
            return res.status(400).json({
                success: false,
                error: 'Missing coordinates'
            });
        }

        // Generate route (simplified - can integrate with Google Maps/Mapbox)
        const distance = calculateDistance(startLatitude, startLongitude, destinationLatitude, destinationLongitude);
        const estimatedTime = Math.ceil(distance / 1.5);

        // Simple waypoints generation
        const routePath = generateRoutePath(
            startLatitude, startLongitude,
            destinationLatitude, destinationLongitude,
            10 // number of waypoints
        );

        res.json({
            success: true,
            data: {
                ambulanceId,
                distance: distance.toFixed(2),
                estimatedMinutes: estimatedTime,
                routePath,
                alternateRoutes: [
                    {
                        name: 'Fastest Route',
                        distance: (distance * 0.95).toFixed(2),
                        estimatedMinutes: Math.ceil(estimatedTime * 0.9)
                    },
                    {
                        name: 'Scenic Route',
                        distance: (distance * 1.15).toFixed(2),
                        estimatedMinutes: Math.ceil(estimatedTime * 1.1)
                    }
                ]
            }
        });
    } catch (error) {
        console.error('[POST /get-route] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 8. COMPLETE route (arrival)
router.post('/:ambulanceId/complete-route', async (req, res) => {
    try {
        const { ambulanceId } = req.params;

        const ambulance = await Ambulance.findById(ambulanceId);

        if (!ambulance) {
            return res.status(404).json({
                success: false,
                error: 'Ambulance not found'
            });
        }

        if (!ambulance.activeRoute) {
            return res.status(400).json({
                success: false,
                error: 'No active route'
            });
        }

        // Calculate actual time
        const startTime = ambulance.activeRoute.startTime;
        const actualTimeMinutes = (Date.now() - startTime) / 60000;
        const estimatedTimeMinutes = ambulance.activeRoute.estimatedTimeMinutes;
        const predictionAccuracy = ((estimatedTimeMinutes / actualTimeMinutes) * 100);

        // Save to travel history
        ambulance.travelHistory.push({
            date: new Date(),
            startLocation: ambulance.activeRoute.startLocation,
            endLocation: ambulance.activeRoute.destinationLocation,
            distanceKm: ambulance.activeRoute.distanceKm,
            actualTimeMinutes: Math.round(actualTimeMinutes),
            estimatedTimeMinutes: estimatedTimeMinutes,
            trafficCondition: 'completed',
            weather: 'clear',
            predictionAccuracy: Math.round(predictionAccuracy)
        });

        // Update status
        ambulance.status = 'at_location';
        ambulance.activeRoute.actualArrivalTime = new Date();
        ambulance.metrics.averageResponseTime = calculateAverageResponseTime(ambulance.travelHistory);
        ambulance.metrics.onTimeDeliveryRate = calculateOnTimeRate(ambulance.travelHistory);

        await ambulance.save();

        res.json({
            success: true,
            message: 'Route completed',
            data: {
                ambulanceId: ambulance.ambulanceId,
                actualTimeMinutes: Math.round(actualTimeMinutes),
                estimatedTimeMinutes,
                predictionAccuracy: Math.round(predictionAccuracy) + '%',
                metrics: ambulance.metrics
            }
        });
    } catch (error) {
        console.error('[POST /complete-route] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 9. UPDATE ambulance status
router.put('/:ambulanceId/status', async (req, res) => {
    try {
        const { ambulanceId } = req.params;
        const { status } = req.body;

        const validStatuses = ['available', 'en_route', 'at_location', 'returning', 'maintenance'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const ambulance = await Ambulance.findByIdAndUpdate(
            ambulanceId,
            { status },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Status updated',
            data: { ambulanceId: ambulance.ambulanceId, status: ambulance.status }
        });
    } catch (error) {
        console.error('[PUT /status] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 10. GET ambulance metrics
router.get('/:ambulanceId/metrics', async (req, res) => {
    try {
        const { ambulanceId } = req.params;

        const ambulance = await Ambulance.findById(ambulanceId);

        if (!ambulance) {
            return res.status(404).json({
                success: false,
                error: 'Ambulance not found'
            });
        }

        res.json({
            success: true,
            data: {
                ambulanceId: ambulance.ambulanceId,
                metrics: ambulance.metrics,
                travelHistoryCount: ambulance.travelHistory.length,
                lastTrip: ambulance.travelHistory[ambulance.travelHistory.length - 1] || null
            }
        });
    } catch (error) {
        console.error('[GET /metrics] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================
// HELPER FUNCTIONS
// ===========================

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Generate intermediate waypoints for route path
function generateRoutePath(lat1, lon1, lat2, lon2, points = 10) {
    const path = [];
    for (let i = 0; i <= points; i++) {
        const lat = lat1 + (lat2 - lat1) * (i / points);
        const lon = lon1 + (lon2 - lon1) * (i / points);
        path.push({
            latitude: lat,
            longitude: lon,
            timestamp: new Date(Date.now() + i * 100)
        });
    }
    return path;
}

// Calculate average response time from history
function calculateAverageResponseTime(history) {
    if (history.length === 0) return 0;
    const sum = history.reduce((acc, trip) => acc + trip.actualTimeMinutes, 0);
    return Math.round(sum / history.length);
}

// Calculate on-time delivery rate
function calculateOnTimeRate(history) {
    if (history.length === 0) return 100;
    const onTime = history.filter(trip => trip.actualTimeMinutes <= trip.estimatedTimeMinutes).length;
    return Math.round((onTime / history.length) * 100);
}

module.exports = router;
