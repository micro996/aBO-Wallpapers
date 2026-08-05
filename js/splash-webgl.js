// WebGL Splash Screen Animation (Stars & Shooting Star)
function initSplashWebGL() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
            v_texCoord = a_texCoord;
            gl_Position = vec4(a_position, 0, 1);
        }
    `;

    const fragmentShaderSource = `
        precision highp float;

        uniform float u_time;
        uniform vec2 u_resolution;
        uniform float u_seed; // Random seed per launch

        varying vec2 v_texCoord;

        // Utility: Hash function for randomness
        float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }

        // Simulating cubic-bezier(0.4, 0, 0.2, 1) using smoothstep for ease-in-out
        float ease(float t) {
            return smoothstep(0.0, 1.0, t);
        }

        // Draw a single shooting star
        vec3 drawShootingStar(vec2 uv, float seed, vec3 c1, vec3 c2, vec3 c3, float tStart, float duration, float scale, out float alphaOut) {
            vec3 color = vec3(0.0);
            alphaOut = 0.0;
            
            float localTime = u_time - tStart;
            if (localTime < 0.0 || localTime > duration) return color;
            
            float progress = localTime / duration;
            float eProgress = ease(progress);

            // Randomized start (near top right)
            vec2 p1 = vec2(
                0.6 + 0.4 * hash(vec2(seed, 2.2)), 
                0.8 + 0.3 * hash(vec2(seed, 3.3))
            );
            
            // Randomized end (near bottom left)
            vec2 p2 = vec2(
                p1.x - 0.5 - 0.4 * hash(vec2(seed, 4.4)),
                p1.y - 0.5 - 0.4 * hash(vec2(seed, 5.5))
            );

            vec2 currentPos = mix(p1, p2, eProgress);
            vec2 dir = p2 - p1;
            float len = length(dir);
            vec2 normDir = normalize(dir);
            
            vec2 relP = uv - p1;
            float proj = dot(relP, normDir);
            
            float currentDist = eProgress * len;
            
            // Render within bounds of the star
            if (proj > -0.1 && proj < currentDist + 0.1) {
                
                // Tail Logic
                float distFromHead = currentDist - proj;
                if (distFromHead > 0.0) {
                    float tailLength = 0.4 * scale;
                    if (distFromHead < tailLength) {
                        vec2 closestPoint = p1 + normDir * proj;
                        float dist = length(uv - closestPoint);
                        
                        // Taper tail radius
                        float tailRadius = 0.012 * scale * (1.0 - (distFromHead / tailLength));
                        float trail = smoothstep(tailRadius, 0.0, dist);
                        
                        // Fade over length and time
                        float fade = pow(1.0 - distFromHead / tailLength, 2.0) * (1.0 - progress);
                        
                        // Color Gradient
                        float gradientFactor = distFromHead / tailLength;
                        vec3 tailColor = mix(c1, c2, smoothstep(0.0, 0.5, gradientFactor));
                        tailColor = mix(tailColor, c3, smoothstep(0.5, 1.0, gradientFactor));
                        
                        color += tailColor * trail * fade;
                        alphaOut = max(alphaOut, trail * fade);
                        
                        // Trailing Particles
                        if (distFromHead < 0.1 * scale) {
                            float particleNoise = hash(uv * 100.0 + u_time);
                            if (particleNoise > 0.95 && dist < tailRadius * 3.0) {
                                color += tailColor * (1.0 - progress) * 1.5;
                            }
                        }
                    }
                }
                
                // Head Logic (Core + Outer Bloom)
                float headRadius = 0.025 * scale;
                float headDist = length(uv - currentPos);
                float headCore = smoothstep(headRadius, 0.0, headDist);
                float headBloom = smoothstep(headRadius * 4.0, 0.0, headDist) * 0.3;
                
                float headTotal = (headCore + headBloom) * (1.0 - progress);
                color += vec3(1.0) * headTotal;
                alphaOut = max(alphaOut, headTotal);
            }
            return color;
        }

        void main() {
            vec2 uv = v_texCoord;
            
            // Base Night Sky Color
            vec3 color = vec3(0.04, 0.05, 0.06);
            float alpha = 0.0;
            
            // Slow Parallax Drift
            vec2 bgUv = uv;
            bgUv.x += u_time * 0.005;
            
            // Layer 1: Medium Stars (10x10 Grid)
            vec2 grid1 = floor(bgUv * 10.0);
            if (hash(grid1 + 10.0) > 0.85) {
                vec2 center = (grid1 + 0.5) / 10.0;
                center += (vec2(hash(grid1 + 0.1), hash(grid1 + 0.2)) - 0.5) * 0.08;
                float dist = length(bgUv - center);
                float star = smoothstep(0.0035, 0.0, dist);
                float twinkle = 0.4 + 0.6 * sin(u_time * 2.0 + hash(grid1) * 10.0);
                color += vec3(0.9, 0.95, 1.0) * star * twinkle;
            }
            
            // Layer 2: Small Stars (20x20 Grid)
            vec2 grid2 = floor(bgUv * 20.0);
            if (hash(grid2 + 20.0) > 0.7) {
                vec2 center = (grid2 + 0.5) / 20.0;
                center += (vec2(hash(grid2 + 0.1), hash(grid2 + 0.2)) - 0.5) * 0.04;
                float dist = length(bgUv - center);
                float star = smoothstep(0.0015, 0.0, dist);
                float twinkle = 0.5 + 0.5 * sin(u_time * 1.5 + hash(grid2) * 20.0);
                color += vec3(0.8, 0.9, 1.0) * star * twinkle;
            }

            // Layer 3: Tiny Distant Stars (40x40 Grid)
            vec2 grid3 = floor(bgUv * 40.0);
            if (hash(grid3 + 30.0) > 0.6) {
                vec2 center = (grid3 + 0.5) / 40.0;
                center += (vec2(hash(grid3 + 0.1), hash(grid3 + 0.2)) - 0.5) * 0.02;
                float dist = length(bgUv - center);
                float star = smoothstep(0.0008, 0.0, dist);
                float twinkle = 0.7 + 0.3 * sin(u_time * 1.0 + hash(grid3) * 30.0);
                color += vec3(0.7, 0.8, 0.9) * star * twinkle * 0.5;
            }
            
            // Primary Hero Shooting Star
            float heroAlpha = 0.0;
            vec3 heroColor = drawShootingStar(
                uv, 
                u_seed, 
                vec3(0.0, 1.0, 1.0), // Cyan Head
                vec3(0.0, 0.5, 1.0), // Blue Mid
                vec3(0.5, 0.0, 0.5), // Purple End
                0.2,                 // Start delay (seconds)
                2.6,                 // Duration (seconds)
                1.0,                 // Scale
                heroAlpha
            );
            color += heroColor;
            alpha = max(alpha, heroAlpha);
            
            // Secondary Meteor (Faint and smaller)
            float secAlpha = 0.0;
            vec3 secColor = drawShootingStar(
                uv, 
                u_seed + 123.4,      // Different seed
                vec3(0.6, 0.8, 1.0), // Fainter cyan
                vec3(0.4, 0.6, 0.8), // Fainter blue
                vec3(0.3, 0.4, 0.5), // Fainter dark purple/blue
                1.3,                 // Start delay (seconds)
                1.5,                 // Duration (seconds)
                0.4,                 // Scale (smaller)
                secAlpha
            );
            color += secColor * 0.5; // Dimmer
            alpha = max(alpha, secAlpha * 0.5);

            // Ensure transparency for CSS backgrounds behind the canvas
            alpha = max(alpha, max(max(color.r, color.g), color.b));
            gl_FragColor = vec4(color, alpha);
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const program = gl.createProgram();
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertexShaderSource));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource));
    gl.linkProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,  1, -1, -1,  1,
        -1,  1,  1, -1,  1,  1
    ]), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,  1, 0,  0, 1,
        0, 1,  1, 0,  1, 1
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const seedLocation = gl.getUniformLocation(program, 'u_seed');

    const startTime = performance.now();
    const randomSeed = Math.random() * 1000.0;
    let animFrameId = null;

    function render(time) {
        const elapsedSeconds = (time - startTime) * 0.001; 
        
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(texCoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1f(timeLocation, elapsedSeconds);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform1f(seedLocation, randomSeed);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        animFrameId = requestAnimationFrame(render);
    }

    animFrameId = requestAnimationFrame(render);

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    });
}

document.addEventListener('DOMContentLoaded', initSplashWebGL);
