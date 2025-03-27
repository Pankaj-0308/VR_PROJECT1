const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/360viewer', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Location Schema (same as in your server.js)
const locationSchema = new mongoose.Schema({
    name: String,
    imageUrl: String
});

const Location = mongoose.model('Location', locationSchema);

// Add or update locations
async function updateLocations() {
    try {
        // Add your locations here with 360-degree images
        const locations = [
            {
                name: 'taj-mahal',
                imageUrl: 'https://images.pexels.com/photos/1603650/pexels-photo-1603650.jpeg'
            }
            // You can include other locations to update here as well
        ];

        // Update or create each location
        for (const location of locations) {
            const result = await Location.findOneAndUpdate(
                { name: location.name },  // find by name
                { imageUrl: location.imageUrl },  // update the imageUrl
                { new: true, upsert: true }  // create if doesn't exist, return updated doc
            );
            
            console.log(`Updated: ${location.name} with new image URL`);
        }
        
        // List all locations in the database
        const allLocations = await Location.find();
        console.log('\nAll locations in database:');
        allLocations.forEach(loc => {
            console.log(`- ${loc.name}: ${loc.imageUrl}`);
        });
        
    } catch (error) {
        console.error('Error updating locations:', error);
    } finally {
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateLocations(); 