// Import required modules
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios'); // For making requests to Google Maps API
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors());

// PostgreSQL Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Function to convert postcode to coordinates
async function getCoordinatesFromPostcode(postcode) {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: {
        address: postcode,
        key: process.env.GOOGLE_MAPS_API_KEY, // Store your API key in .env
      },
    });

    if (response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    } else {
      throw new Error("Invalid postcode");
    }
  } catch (error) {
    throw new Error("Error fetching coordinates");
  }
}

// API Route to Add a Photographer (using postcode)
app.post('/photographers', async (req, res) => {
  const { name, email, phone, postcode, specialty } = req.body;

  try {
    // Convert postcode to latitude/longitude
    const { latitude, longitude } = await getCoordinatesFromPostcode(postcode);

    const result = await pool.query(
      'INSERT INTO photographers (name, email, phone, postcode, latitude, longitude, specialty) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, email, phone, postcode, latitude, longitude, specialty]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Route to Get All Photographers
app.get('/photographers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM photographers');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});