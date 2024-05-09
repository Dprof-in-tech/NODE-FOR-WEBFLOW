const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Define a route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

let usersData = [];

// Use cors middleware with custom options
app.use(cors({
  methods: ['GET', 'POST'], // Allow specified HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specified headers
  credentials: true // Allow sending cookies
}));

// Middleware to fetch user data from Webflow API
app.use(async (req, res, next) => {
  try {
    const siteId = '658d5a7761cdc354349ee44e';
    const Authorization = '78222f436edeaaaa6d371c21f7257f379b431376e80c1c4ec49bc09f15bf98ca'; 
    const endpoint = `https:api.webflow.com/v2/sites/${siteId}/users`;

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': 'Bearer ' + Authorization
      }
    });

    const data = await response.json();
    usersData = data.users; // Store user data in the array
    next();
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to retrieve user data
app.get('/users', (req, res) => {
  res.json(usersData);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
