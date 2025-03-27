const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

// Location Schema
const locationSchema = new mongoose.Schema({
    name: String,
    imageUrl: String
});

const Location = mongoose.model('Location', locationSchema);

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/locations', async (req, res) => {
    try {
        const locations = await Location.find();
        res.json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ error: 'Error fetching locations' });
    }
});

app.get('/api/locations/:name', async (req, res) => {
    try {
        const location = await Location.findOne({ name: req.params.name });
        if (location) {
            res.json(location);
        } else {
            res.status(404).json({ message: 'Location not found' });
        }
    } catch (error) {
        console.error('Error fetching location:', error);
        res.status(500).json({ message: error.message });
    }
});

// Error handling middleware
app.use((req, res) => {
    console.log('404 - Route not found:', req.url);
    res.status(404).json({ message: 'Route not found' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/360viewer', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB successfully');
})
.catch((err) => {
    console.error('MongoDB connection error:', err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 