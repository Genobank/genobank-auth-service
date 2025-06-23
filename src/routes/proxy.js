const express = require('express');
const axios = require('axios');
const router = express.Router();

// Proxy endpoint to validate permittee status
router.get('/validate_permittee', async (req, res) => {
  try {
    const { permittee } = req.query;
    
    if (!permittee) {
      return res.status(400).json({ error: 'Permittee address required' });
    }
    
    // Call GenoBank API
    const response = await axios.get(`https://genobank.app/validate_permittee`, {
      params: { permittee }
    });
    
    // Return the result
    res.json(response.data);
  } catch (error) {
    console.error('Validate permittee error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to validate permittee status' });
    }
  }
});

module.exports = router;