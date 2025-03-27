require('dotenv').config();
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
async function updateAllImages() {
    try {
        // Using actual images of the specific locations
        const locations = [
            {
                name: 'beach',
                imageUrl: 'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=1600'
            },
            {
                name: 'mountain',
                imageUrl: 'https://images.pexels.com/photos/1366909/pexels-photo-1366909.jpeg?auto=compress&cs=tinysrgb&w=1600'
            },
            {
                name: 'city',
                imageUrl: 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=1600'
            },
            {
                name: 'forest',
                imageUrl: 'https://images.pexels.com/photos/240040/pexels-photo-240040.jpeg?auto=compress&cs=tinysrgb&w=1600'
            },
            {
                name: 'desert',
                imageUrl: 'https://images.pexels.com/photos/1001435/pexels-photo-1001435.jpeg?auto=compress&cs=tinysrgb&w=1600'
            },
            {
                name: 'lake',
                imageUrl: 'https://images.pexels.com/photos/2286895/pexels-photo-2286895.jpeg?auto=compress&cs=tinysrgb&w=1600'
            },
            {
                name: 'sunset',
                imageUrl: 'https://images.pexels.com/photos/36717/amazing-animal-beautiful-beautifull.jpg?auto=compress&cs=tinysrgb&w=1600'
            },
            {
                name: 'aurora',
                imageUrl: 'https://images.pexels.com/photos/1933239/pexels-photo-1933239.jpeg?auto=compress&cs=tinysrgb&w=1600'
            },
            {
                name: 'taj-mahal',
                // Actual Taj Mahal image
                imageUrl: 'https://images.pexels.com/photos/1603650/pexels-photo-1603650.jpeg?auto=compress&cs=tinysrgb&w=1600'
            },
            {
                name: 'red-fort',
                // Red Fort image as requested
                imageUrl: 'https://as2.ftcdn.net/v2/jpg/00/58/81/65/1000_F_58816519_ixgprK40YZ7SZD6qM0X8JvjVLPkD3y6c.jpg'
            },
            {
                name: 'jama-masjid',
                // Updated Jama Masjid panoramic image
                imageUrl: 'https://thumbs.dreamstime.com/b/panorama-jama-masjid-mosque-delhi-india-famous-104343594.jpg'
            },
            {
                name: 'qutub-minar',
                // Actual Qutub Minar image
                imageUrl: 'https://images.pexels.com/photos/13599123/pexels-photo-13599123.jpeg?auto=compress&cs=tinysrgb&w=1600'
            },
            {
                name: 'gwalior-fort',
                // Actual Gwalior Fort image
                imageUrl: 'https://images.pexels.com/photos/13599124/pexels-photo-13599124.jpeg?auto=compress&cs=tinysrgb&w=1600'
            },
            {
                name: 'india-gate',
                // Updated India Gate image as requested
                imageUrl: 'https://thumbs.dreamstime.com/b/india-gate-5971022.jpg'
            },
            {
                name: 'itm',
                // ITM University Gwalior image - using Unsplash (CORS-friendly source)
                imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y29sbGVnZSUyMGNhbXB1c3xlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80'
            }
        ];

        // Update each location
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
        console.log(`\nTotal locations: ${allLocations.length}`);
        
    } catch (error) {
        console.error('Error updating locations:', error);
    } finally {
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateAllImages(); 