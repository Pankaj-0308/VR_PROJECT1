// Create a 360-degree viewer with the given options
window.create360Viewer = function(opts) {
    const canvas = opts.canvas;
    const fov = opts.fov || Math.PI / 4;  // Default 45 degrees
    const rotateSpeed = opts.rotateSpeed || 0.015;
    const damping = opts.damping || 0.4;
    
    // Set canvas size to match container
    function resizeCanvas() {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    // Initialize WebGL context
    const gl = canvas.getContext('webgl', { antialias: true });
    if (!gl) {
        throw new Error('WebGL not supported');
    }

    // Enable depth testing and culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    // Initial resize
    resizeCanvas();

    // Add resize listener
    window.addEventListener('resize', resizeCanvas);

    // Create sphere for panorama
    const sphere = window.createSphere(1, { segments: 64 });

    // Create camera
    const camera = window.createCamera({
        fov: fov,
        near: 0.01,
        far: 100,
        position: [0, 0, 0]
    });

    // Create orbit controls
    const controls = window.createControls({
        element: canvas,
        rotateSpeed: rotateSpeed,
        damping: damping
    });

    // Initialize state
    let texture = null;
    let isDestroyed = false;

    // Create shader program
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, `
        precision mediump float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 projection;
        uniform mat4 view;
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projection * view * vec4(position, 1);
        }
    `);

    gl.shaderSource(fragmentShader, `
        precision mediump float;
        uniform sampler2D tex;
        varying vec2 vUv;
        void main() {
            gl_FragColor = texture2D(tex, vUv);
        }
    `);

    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, 'position');
    const uvLocation = gl.getAttribLocation(program, 'uv');
    const projectionLocation = gl.getUniformLocation(program, 'projection');
    const viewLocation = gl.getUniformLocation(program, 'view');
    const texLocation = gl.getUniformLocation(program, 'tex');

    // Create buffers
    const positionBuffer = gl.createBuffer();
    const uvBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();

    // Upload geometry data
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.positions), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.uvs), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere.cells), gl.STATIC_DRAW);

    // Create render loop
    const loop = window.createLoop(function(dt) {
        if (isDestroyed) return;

        // Update controls
        controls.update();

        // Update camera view matrix
        camera.view = controls.matrix;
        camera.update();

        // Clear canvas
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // If texture is loaded, render sphere
        if (texture) {
            gl.useProgram(program);

            // Set uniforms
            gl.uniformMatrix4fv(projectionLocation, false, camera.projection);
            gl.uniformMatrix4fv(viewLocation, false, camera.view);
            gl.uniform1i(texLocation, 0);

            // Set attributes
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
            gl.enableVertexAttribArray(uvLocation);
            gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

            // Bind texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Draw
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.drawElements(gl.TRIANGLES, sphere.cells.length, gl.UNSIGNED_SHORT, 0);
        }
    });

    // Start render loop
    loop.start();

    // Return viewer API
    return {
        texture: function(opts) {
            if (opts.data instanceof HTMLImageElement) {
                // Create texture from image
                if (texture) {
                    gl.deleteTexture(texture);
                }
                texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                
                try {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, opts.data);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    console.log('Texture created successfully');
                } catch (e) {
                    console.error('Error creating texture:', e);
                }
            }
        },
        destroy: function() {
            isDestroyed = true;
            loop.stop();
            window.removeEventListener('resize', resizeCanvas);
            if (texture) {
                gl.deleteTexture(texture);
            }
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteBuffer(positionBuffer);
            gl.deleteBuffer(uvBuffer);
            gl.deleteBuffer(indexBuffer);
        }
    };
};

// Make it available globally
console.log('Viewer module loaded'); 