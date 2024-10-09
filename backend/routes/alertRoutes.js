// routes/alertRoutes.js
const express = require('express');
const Alert = require('../models/Alert');
const router = express.Router();

// API endpoint to create a new alert
router.post('/', async (req, res) => {
  try {
    const alertData = req.body;
    const newAlert = new Alert(alertData);
    await newAlert.save();
    res.status(201).json({ message: 'Alert saved successfully', alert: newAlert });
  } catch (error) {
    console.error('Error saving alert:', error);
    res.status(500).json({ message: 'Failed to save alert', error });
  }
});
// API endpoint to fetch all alerts
router.get('/', async (req, res) => {
    try {
      const alerts = await Alert.find(); // Fetch all alerts from the database
      res.status(200).json(alerts); // Send alerts to the client
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ message: 'Failed to fetch alerts', error });
    }
  });
  
module.exports = router;
