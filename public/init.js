// Make dependencies available globally
window.createSphere = function(radius, opts) {
    opts = opts || {};
    const segments = opts.segments || 32;
    const positions = [];
    const uvs = [];
    const cells = [];

    // Generate vertices
    for (let j = 0; j <= segments; j++) {
        const v = j / segments;
        const phi = v * Math.PI;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        for (let i = 0; i <= segments; i++) {
            const u = i / segments;
            const theta = u * 2 * Math.PI;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            const x = cosTheta * sinPhi;
            const y = cosPhi;
            const z = sinTheta * sinPhi;

            positions.push(x * radius, y * radius, z * radius);
            uvs.push(u, v);
        }
    }

    // Generate indices
    for (let j = 0; j < segments; j++) {
        const row1 = j * (segments + 1);
        const row2 = (j + 1) * (segments + 1);

        for (let i = 0; i < segments; i++) {
            cells.push(
                row1 + i, row2 + i + 1, row1 + i + 1,
                row1 + i, row2 + i, row2 + i + 1
            );
        }
    }

    return {
        positions: positions,
        uvs: uvs,
        cells: cells
    };
};

window.createControls = function(opts) {
    const element = opts.element;
    const rotateSpeed = opts.rotateSpeed || 0.015;
    const damping = opts.damping || 0.4;
    let isEnabled = true;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let rotationX = 0;
    let rotationY = 0;
    let velocityX = 0;
    let velocityY = 0;

    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('mousemove', onMouseMove);
    element.addEventListener('mouseup', onMouseUp);
    element.addEventListener('mouseleave', onMouseUp);

    function onMouseDown(e) {
        if (!isEnabled) return;
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        velocityX = 0;
        velocityY = 0;
    }

    function onMouseMove(e) {
        if (!isEnabled || !isDragging) return;
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        velocityX = deltaX * rotateSpeed * 0.1;
        velocityY = deltaY * rotateSpeed * 0.1;
        lastX = e.clientX;
        lastY = e.clientY;
    }

    function onMouseUp() {
        isDragging = false;
    }

    return {
        update: function() {
            if (!isDragging) {
                velocityX *= (1 - damping);
                velocityY *= (1 - damping);
            }
            rotationX += velocityX;
            rotationY = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotationY + velocityY));
            
            // Create view matrix for 360° viewing
            const cosX = Math.cos(rotationX);
            const sinX = Math.sin(rotationX);
            const cosY = Math.cos(rotationY);
            const sinY = Math.sin(rotationY);
            
            this.matrix = [
                cosX, sinX * sinY, sinX * cosY, 0,
                0, cosY, -sinY, 0,
                -sinX, cosX * sinY, cosX * cosY, 0,
                0, 0, 0, 1
            ];
        },
        matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        enable: function() { isEnabled = true; },
        disable: function() { isEnabled = false; }
    };
};

window.createCamera = function(opts) {
    const fov = opts.fov || Math.PI / 4;
    const near = opts.near || 0.1;
    const far = opts.far || 1000;
    const position = opts.position || [0, 0, 0];
    let aspect = 1;

    return {
        position: position,
        projection: null,
        view: null,
        update: function() {
            const canvas = document.querySelector('canvas');
            if (canvas) {
                aspect = canvas.width / canvas.height;
            }
            
            // Perspective projection matrix
            const f = 1.0 / Math.tan(fov / 2);
            this.projection = [
                f / aspect, 0, 0, 0,
                0, f, 0, 0,
                0, 0, (far + near) / (near - far), -1,
                0, 0, (2 * far * near) / (near - far), 0
            ];
        }
    };
};

window.createRegl = function(opts) {
    const canvas = opts.canvas;
    const gl = canvas.getContext('webgl', opts.attributes);

    if (!gl) {
        throw new Error('WebGL not supported');
    }

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    return {
        clear: function(opts) {
            gl.clearColor(opts.color[0], opts.color[1], opts.color[2], opts.color[3]);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        },
        texture: function(opts) {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            
            if (opts.data) {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, opts.data);
            }
            
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            
            return texture;
        },
        prop: function(name) {
            return function(props) {
                return props[name];
            };
        },
        destroy: function() {
            // Clean up WebGL context
            const extension = gl.getExtension('WEBGL_lose_context');
            if (extension) extension.loseContext();
        }
    };
};

window.createLoop = function(callback) {
    let rafId = null;
    let lastTime = 0;
    let isRunning = false;

    function loop(time) {
        if (!isRunning) return;
        
        const dt = Math.min(0.1, (time - lastTime) / 1000);
        lastTime = time;
        
        callback(dt);
        rafId = requestAnimationFrame(loop);
    }

    return {
        start: function() {
            if (!isRunning) {
                isRunning = true;
                lastTime = performance.now();
                rafId = requestAnimationFrame(loop);
            }
        },
        stop: function() {
            isRunning = false;
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }
    };
};

window.defined = function(value, defaultValue) {
    return value !== undefined ? value : defaultValue;
};

window.assign = Object.assign;

console.log('Dependencies initialized');

// Create sphere
window.sphere = window.createSphere(1, { segments: 64 });

// Initialize viewer
const canvas = document.getElementById('viewer');
if (canvas) {
    const viewer = window.create360Viewer({
        canvas: canvas,
        fov: 45 * Math.PI / 180,  // Standard 45 degrees FOV
        rotateSpeed: 0.015,       // Original rotation speed
        damping: 0.4              // Original damping
    });

    // Make viewer available globally
    window.viewer = viewer;
} 