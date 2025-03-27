const mongoose = require('mongoose');

// Set strictQuery to false to suppress the warning
mongoose.set('strictQuery', false);

// Connect to MongoDB with updated options
mongoose.connect('mongodb://127.0.0.1:27017/360viewer', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Location Schema
const locationSchema = new mongoose.Schema({
    name: String,
    imageUrl: String
});

const Location = mongoose.model('Location', locationSchema);

// Predefined locations with actual panorama images
const locations = [
    {
        name: 'nit2',
        imageUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/2294472375_24a3b8ef46_o.jpg'
    },
    {
        name: 'nit3',
        imageUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/2294472375_24a3b8ef46_o.jpg'
    }
];

// Insert locations into database
async function initializeDatabase() {
    try {
        await Location.deleteMany({}); // Clear existing data
        await Location.insertMany(locations);
        console.log('Database initialized successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase(); 