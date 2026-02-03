const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const HospitalMessage = require('../models/HospitalMessage');

// HEALTH CHECK endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// DEBUG endpoint to check status
router.get('/debug/status', async (req, res) => {
  try {
    const hospitalCount = await Hospital.countDocuments();
    const messageCount = await HospitalMessage.countDocuments();
    
    const allHospitals = await Hospital.find().select('user _id').lean();
    
    res.json({
      status: 'ok',
      hospitalCount,
      messageCount,
      hospitals: allHospitals
    });
  } catch (error) {
    console.error('[debug/status] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET all hospitals except the current one
router.get('/list/:currentHospitalId', async (req, res) => {
  try {
    const { currentHospitalId } = req.params;
    console.log('[/list] Starting with ID:', currentHospitalId);

    if (!currentHospitalId) {
      return res.status(400).json({ error: 'Hospital ID is required' });
    }

    // Step 1: Find current hospital (accept both Hospital._id and User._id)
    console.log('[/list] Step 1: Finding current hospital...');
    let currentHospitalDocId = null;

    const hopByHospitalId = await Hospital.findById(currentHospitalId).select('_id').lean();
    if (hopByHospitalId) {
      currentHospitalDocId = currentHospitalId;
      console.log('[/list] Found by Hospital._id:', currentHospitalDocId);
    } else {
      const hopByUserId = await Hospital.findOne({ user: currentHospitalId }).select('_id').lean();
      if (hopByUserId) {
        currentHospitalDocId = hopByUserId._id;
        console.log('[/list] Found by User._id:', currentHospitalDocId);
      } else {
        console.log('[/list] Hospital not found, creating new one for user:', currentHospitalId);
        const newHop = new Hospital({ user: currentHospitalId });
        await newHop.save();
        currentHospitalDocId = newHop._id;
        console.log('[/list] Created new hospital:', currentHospitalDocId);
      }
    }

    // Step 2: Get ALL hospitals except current (no populate, just lean data)
    console.log('[/list] Step 2: Fetching all hospitals except:', currentHospitalDocId);
    const allHospitals = await Hospital.find({ _id: { $ne: currentHospitalDocId } })
      .select('user')
      .lean()
      .exec();
    
    console.log('[/list] Found', allHospitals.length, 'other hospitals');

    // Step 3: Get user data separately for ALL those hospitals
    const User = require('../models/User');
    const userIds = allHospitals.map(h => h.user);
    console.log('[/list] Fetching data for', userIds.length, 'users...');
    
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email hospitalProfile')
      .lean()
      .exec();

    console.log('[/list] Retrieved', users.length, 'users');

    // Step 4: Map hospitals with user data
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });

    const mapped = allHospitals.map(h => {
      const user = userMap[h.user.toString()] || {};
      return {
        _id: h._id,
        userId: h.user,
        name: (user.hospitalProfile && user.hospitalProfile.hospitalName) || user.name || 'Unnamed Hospital',
        location: (user.hospitalProfile && user.hospitalProfile.jurisdiction) || 'Unknown',
        email: user.email || '',
        phone: (user.hospitalProfile && user.hospitalProfile.contactNumber) || '',
        // Include hospital details
        beds: h.beds || { totalBeds: 0, occupiedBeds: 0, availableBeds: 0 },
        doctors: h.doctors || [],
        resources: h.resources || []
      };
    });

    console.log('[/list] Returning', mapped.length, 'hospitals');
    res.json({ data: mapped });

  } catch (error) {
    console.error('[/list] ERROR:', error.message);
    console.error('[/list] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch hospitals',
      message: error.message
    });
  }
});

// GET hospital details with doctors and resources
router.get('/details/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    console.log('[/details] Getting hospital details for ID:', hospitalId);

    // First try to find by hospital ID, otherwise by user ID
    let hospital = await Hospital.findById(hospitalId)
      .populate('user', 'name email hospitalProfile')
      .lean();

    if (!hospital) {
      console.log('[/details] Hospital not found by ID, trying as user ID');
      hospital = await Hospital.findOne({ user: hospitalId })
        .populate('user', 'name email hospitalProfile')
        .lean();
    }
    
    if (!hospital) {
      console.error('[/details] Hospital not found');
      return res.status(404).json({ error: 'Hospital not found' });
    }

    console.log('[/details] Hospital found:', hospital._id);
    console.log('[/details] Beds:', hospital.beds);
    console.log('[/details] Doctors count:', hospital.doctors?.length);
    console.log('[/details] Resources count:', hospital.resources?.length);

    const user = hospital.user || {};
    const hospitalName = (user.hospitalProfile && user.hospitalProfile.hospitalName) || user.name || 'Unnamed Hospital';
    const location = (user.hospitalProfile && user.hospitalProfile.jurisdiction) || 'Unknown';
    const phone = (user.hospitalProfile && user.hospitalProfile.contactNumber) || '';

    res.json({
      _id: hospital._id,
      name: hospitalName,
      location,
      email: user.email || '',
      phone,
      // NEW SCHEMA: Use beds data directly
      beds: hospital.beds || { totalBeds: 0, occupiedBeds: 0, availableBeds: 0 },
      // NEW SCHEMA: doctors is now an array of objects, not references
      doctors: hospital.doctors || [],
      // NEW SCHEMA: resources is now an array of objects, not references
      resources: hospital.resources || []
    });
  } catch (error) {
    console.error('[/details] Error:', error.message);
    console.error('[/details] Stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch hospital details', message: error.message });
  }
});

// POST send message to another hospital
router.post('/send-message', async (req, res) => {
  try {
    const { fromHospitalId, toHospitalId, messageType, subject, details, requestDetails, urgencyLevel } = req.body;
    
    // Validate required fields
    if (!fromHospitalId || !toHospitalId || !messageType || !subject || !details) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newMessage = new HospitalMessage({
      fromHospital: fromHospitalId,
      toHospital: toHospitalId,
      messageType,
      subject,
      details,
      requestDetails: {
        ...requestDetails,
        urgencyLevel: urgencyLevel || 'medium'
      }
    });
    
    await newMessage.save();
    
    const populatedMessage = await HospitalMessage.findById(newMessage._id)
      .populate({ path: 'fromHospital', populate: { path: 'user', select: 'name email hospitalProfile' } })
      .populate({ path: 'toHospital', populate: { path: 'user', select: 'name email hospitalProfile' } });
    
    res.status(201).json({ 
      message: 'Message sent successfully',
      data: populatedMessage 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET messages received by a hospital
router.get('/messages/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    console.log('[hospitalCommunicationRoutes] /messages called with hospitalId:', hospitalId);
    
    // First, ensure hospital exists
    let hospitalDocId = null;
    const hospitalById = await Hospital.findById(hospitalId).select('_id').lean();
    if (hospitalById) {
      hospitalDocId = hospitalId;
    } else {
      const hospitalByUser = await Hospital.findOne({ user: hospitalId }).select('_id').lean();
      if (hospitalByUser) {
        hospitalDocId = hospitalByUser._id;
      } else {
        const hospital = new Hospital({ user: hospitalId });
        await hospital.save();
        hospitalDocId = hospital._id;
        console.log('[hospitalCommunicationRoutes] Created hospital for /messages:', hospitalDocId);
      }
    }
    
    console.log('[hospitalCommunicationRoutes] Looking for messages to hospital:', hospitalDocId);
    
    let messages = await HospitalMessage.find({ toHospital: hospitalDocId })
      .populate({ path: 'fromHospital', populate: { path: 'user', select: 'name email hospitalProfile' } })
      .populate({ path: 'toHospital', populate: { path: 'user', select: 'name email hospitalProfile' } })
      .sort({ createdAt: -1 })
      .lean();

    console.log('[hospitalCommunicationRoutes] Found messages count:', messages.length);

    // Normalize message sender info to the frontend-friendly shape
    messages = messages.map(m => {
      const fromUser = m.fromHospital && m.fromHospital.user ? m.fromHospital.user : {};
      return {
        ...m,
        fromHospital: {
          _id: m.fromHospital?._id,
          name: (fromUser.hospitalProfile && fromUser.hospitalProfile.hospitalName) || fromUser.name || 'Unknown',
          location: (fromUser.hospitalProfile && fromUser.hospitalProfile.jurisdiction) || 'Unknown',
          email: fromUser.email || '',
          phone: (fromUser.hospitalProfile && fromUser.hospitalProfile.contactNumber) || ''
        }
      };
    });

    res.json(messages);
  } catch (error) {
    console.error('[hospitalCommunicationRoutes] /messages error:', error);
    console.error('[hospitalCommunicationRoutes] Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
});

// GET sent messages by a hospital
router.get('/sent-messages/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    let messages = await HospitalMessage.find({ fromHospital: hospitalId })
      .populate({ path: 'toHospital', populate: { path: 'user', select: 'name email hospitalProfile' } })
      .sort({ createdAt: -1 })
      .lean();

    messages = messages.map(m => {
      const toUser = m.toHospital && m.toHospital.user ? m.toHospital.user : {};
      return {
        ...m,
        toHospital: {
          _id: m.toHospital?._id,
          name: (toUser.hospitalProfile && toUser.hospitalProfile.hospitalName) || toUser.name || 'Unknown',
          location: (toUser.hospitalProfile && toUser.hospitalProfile.jurisdiction) || 'Unknown',
          email: toUser.email || '',
          phone: (toUser.hospitalProfile && toUser.hospitalProfile.contactNumber) || ''
        }
      };
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    res.status(500).json({ error: 'Failed to fetch sent messages' });
  }
});

// PATCH update message status
router.patch('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status, response, responseMessage } = req.body;
    
    const updateData = {
      status,
      updatedAt: new Date()
    };
    
    if (response) {
      updateData.response = {
        message: responseMessage || '',
        responseDate: new Date(),
        respondedBy: response.respondedBy // Pass user ID from frontend
      };
    }
    
    const updatedMessage = await HospitalMessage.findByIdAndUpdate(
      messageId,
      updateData,
      { new: true }
    )
      .populate({ path: 'fromHospital', populate: { path: 'user', select: 'name email hospitalProfile' } })
      .populate({ path: 'toHospital', populate: { path: 'user', select: 'name email hospitalProfile' } });
    
    if (!updatedMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ 
      message: 'Message updated successfully',
      data: updatedMessage 
    });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// POST reply to a message
router.post('/message/:messageId/reply', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status, responseMessage } = req.body;

    if (!responseMessage) {
      return res.status(400).json({ error: 'Reply message is required' });
    }

    console.log('[hospitalCommunicationRoutes] /message/:id/reply called with messageId=', messageId);

    const updateData = {
      status: status || 'approved',
      response: {
        message: responseMessage,
        responseDate: new Date()
      },
      updatedAt: new Date()
    };

    const updatedMessage = await HospitalMessage.findByIdAndUpdate(
      messageId,
      updateData,
      { new: true }
    )
      .populate({ path: 'fromHospital', populate: { path: 'user', select: 'name email hospitalProfile' } })
      .populate({ path: 'toHospital', populate: { path: 'user', select: 'name email hospitalProfile' } });

    if (!updatedMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }

    console.log('[hospitalCommunicationRoutes] Reply sent successfully for message:', messageId);

    res.json({
      message: 'Reply sent successfully',
      data: updatedMessage
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// DELETE a message
router.delete('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const deletedMessage = await HospitalMessage.findByIdAndDelete(messageId);
    
    if (!deletedMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// GET my hospital details (by user ID)
router.get('/my-hospital/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('[GET /my-hospital] Getting hospital for user:', userId);

    // Verify user exists
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('[GET /my-hospital] User not found:', userId);
      return res.status(404).json({ error: 'User not found', message: `No user found with ID: ${userId}` });
    }

    console.log('[GET /my-hospital] User found:', user.email);

    // Find hospital by user ID
    let hospital = await Hospital.findOne({ user: userId }).lean();

    if (!hospital) {
      console.log('[GET /my-hospital] Hospital not found, creating new one');
      // Auto-create if doesn't exist
      const newHospital = new Hospital({ user: userId });
      await newHospital.save();
      hospital = newHospital.toObject();
      console.log('[GET /my-hospital] New hospital created:', hospital._id);
    } else {
      console.log('[GET /my-hospital] Hospital found:', hospital._id);
    }

    console.log('[GET /my-hospital] Returning hospital with beds:', hospital.beds);
    res.json(hospital);
  } catch (error) {
    console.error('[GET /my-hospital] Error:', error.message);
    console.error('[GET /my-hospital] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch hospital details', 
      message: error.message,
      details: error.toString()
    });
  }
});

// UPDATE my hospital details (by user ID)
router.put('/my-hospital/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { beds, doctors, resources } = req.body;

    console.log('[PUT /my-hospital] Updating hospital for user:', userId);
    console.log('[PUT /my-hospital] Payload:', { beds, doctors, resources });

    // Verify user exists first
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('[PUT /my-hospital] User not found:', userId);
      return res.status(404).json({ error: 'User not found', message: `No user found with ID: ${userId}` });
    }

    console.log('[PUT /my-hospital] User found:', user.email);

    let hospital = await Hospital.findOne({ user: userId });

    if (!hospital) {
      console.log('[PUT /my-hospital] Hospital not found, creating new one');
      hospital = new Hospital({ user: userId });
    } else {
      console.log('[PUT /my-hospital] Hospital found:', hospital._id);
    }

    // Update the data
    if (beds) {
      hospital.beds = beds;
      console.log('[PUT /my-hospital] Updated beds:', beds);
    }
    if (doctors) {
      hospital.doctors = doctors;
      console.log('[PUT /my-hospital] Updated doctors count:', doctors.length);
    }
    if (resources) {
      hospital.resources = resources;
      console.log('[PUT /my-hospital] Updated resources count:', resources.length);
    }

    await hospital.save();

    console.log('[PUT /my-hospital] Hospital saved successfully');
    res.json(hospital);
  } catch (error) {
    console.error('[PUT /my-hospital] Error:', error.message);
    console.error('[PUT /my-hospital] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to update hospital', 
      message: error.message,
      details: error.toString()
    });
  }
});

module.exports = router;
