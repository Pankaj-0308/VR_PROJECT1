const { useState, useEffect } = React;

function App() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentImage, setCurrentImage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [viewerInitialized, setViewerInitialized] = useState(false);
    const [availableLocations, setAvailableLocations] = useState([]);

    useEffect(() => {
        // Fetch available locations when component mounts
        async function fetchLocations() {
            try {
                const response = await fetch('/api/locations');
                if (response.ok) {
                    const data = await response.json();
                    setAvailableLocations(data);
                }
            } catch (err) {
                console.error('Error fetching locations:', err);
            }
        }
        
        fetchLocations();
        
        // Initialize viewer when component mounts
        if (!viewerInitialized && window.createSphere && window.createControls && 
            window.createCamera && window.createRegl && window.createLoop && 
            window.defined && window.assign) {
            
            // Create canvas element
            const canvas = document.createElement('canvas');
            canvas.id = 'viewer';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            
            // Add canvas to viewer container
            const viewerContainer = document.getElementById('viewer-container');
            if (viewerContainer) {
                viewerContainer.appendChild(canvas);
            }

            // Create viewer with standard FOV
            const viewer = window.create360Viewer({
                canvas: canvas,
                fov: 45 * Math.PI / 180,  // Standard 45 degrees FOV
                rotateSpeed: 0.015,       // Original rotation speed
                damping: 0.4              // Original damping
            });

            // Make viewer available globally
            window.viewer = viewer;
            setViewerInitialized(true);
        }
    }, [viewerInitialized]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(`/api/locations/${searchTerm}`);
            if (!response.ok) {
                throw new Error('Location not found. Please try another location.');
            }
            const data = await response.json();
            setCurrentImage(data.imageUrl);
            console.log("Fetched image URL:", data.imageUrl);

            // Create a new image element
            const img = new Image();
            
            // IMPORTANT: Set crossOrigin before setting the src
            img.crossOrigin = 'anonymous';
            
            // Set up load and error handlers
            img.onload = function() {
                console.log('Image loaded successfully:', data.imageUrl);
                if (window.viewer) {
                    try {
                        window.viewer.texture({ data: img });
                        console.log('Texture applied successfully');
                    } catch (err) {
                        console.error('Error applying texture:', err);
                        setError('Error displaying image. Please try again.');
                    }
                }
                setLoading(false);
            };
            
            img.onerror = function(e) {
                console.error('Failed to load image:', data.imageUrl, e);
                setError('Failed to load image. Please try another location.');
                setLoading(false);
            };
            
            // Set the source last (after setting up handlers)
            img.src = data.imageUrl;
            
        } catch (err) {
            setError(err.message);
            console.error('Error:', err);
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <div className="search-form" style={{
                position: 'fixed',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '15px 25px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <form onSubmit={handleSearch}>
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search location (e.g., beach, mountain)"
                            list="location-suggestions"
                        />
                        <datalist id="location-suggestions">
                            {availableLocations.map(location => (
                                <option key={location._id} value={location.name} />
                            ))}
                        </datalist>
                        <button type="submit" className="btn btn-primary">Search</button>
                    </div>
                </form>
            </div>

            {error && (
                <div className="alert alert-danger" style={{
                    position: 'fixed',
                    top: 80,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000
                }}>
                    {error}
                </div>
            )}

            <div id="viewer-container" style={{
                width: '100%',
                height: '100%',
                position: 'relative'
            }} />

            {loading && (
                <div className="loading-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 999
                }}>
                    <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Make App available globally
window.App = App; 