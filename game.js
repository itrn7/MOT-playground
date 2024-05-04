
window.addEventListener('load', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Define object properties
    let OBJECT_RADIUS = 10;
    let OBJECT_SPEED = 5;
    let NUM_TARGETS = 4;
    let NUM_DISTRACTORS = 8;
    let WALL_SIZE = 800; // Initial wall size
    let VELOCITY_CHANGE = 0; // Initial random velocity change degree
    let paused = false;
    const TARGET_TIME = 3000; // Time (in milliseconds) to highlight targets

    // Define colors
    const BLACK = '#000000';
    const WHITE = '#FFFFFF';
    const RED = '#FF0000';

    // Initialize objects
    let objects = [];
    let targets = [];
    initializeObjects();

    // Game state
    let isHighlighting = false;
    let highlightStartTime = null;

    // Helper function to get a random number within a range
    function getRandomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Function to initialize objects
    function initializeObjects() {
        objects = [];
        targets = [];
        for (let i = 0; i < NUM_TARGETS + NUM_DISTRACTORS; i++) {
            const x = getRandomInRange(OBJECT_RADIUS, canvas.width - OBJECT_RADIUS);
            const y = getRandomInRange(OBJECT_RADIUS, canvas.height - OBJECT_RADIUS);
            const dx = getRandomInRange(-OBJECT_SPEED, OBJECT_SPEED);
            const dy = getRandomInRange(-OBJECT_SPEED, OBJECT_SPEED);
            if (i < NUM_TARGETS) {
                targets.push({ x, y, dx, dy });
            }
            objects.push({ x, y, dx, dy, isTarget: i < NUM_TARGETS });
        }
    }

    // Function to handle ball collision
    function handleCollisions() {
        for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
                let obj1 = objects[i];
                let obj2 = objects[j];

                // Calculate distance between objects
                let dx = obj2.x - obj1.x;
                let dy = obj2.y - obj1.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                // Check if distance is less than the sum of radii (collision occurred)
                if (distance < 2 * OBJECT_RADIUS) {
                    // Normalize the distance vector
                    let normalX = dx / distance;
                    let normalY = dy / distance;

                    // Calculate relative velocity along the normal direction
                    let relativeVelocityX = obj2.dx - obj1.dx;
                    let relativeVelocityY = obj2.dy - obj1.dy;
                    let dotProduct = relativeVelocityX * normalX + relativeVelocityY * normalY;

                    // Only resolve collision if objects are moving toward each other
                    if (dotProduct > 0) continue;

                    // Calculate impulse to ensure elastic collision
                    let impulse = -2 * dotProduct / 2; // Two objects with equal mass

                    // Apply impulse to both objects to conserve kinetic energy
                    obj1.dx -= impulse * normalX;
                    obj1.dy -= impulse * normalY;
                    obj2.dx += impulse * normalX;
                    obj2.dy += impulse * normalY;
                }
            }
        }
    }

    // Function to draw rounded rectangle
    function drawRoundedRectangle(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    // Game loop
    function gameLoop() {
        if (paused) {
            requestAnimationFrame(gameLoop); // Keep the loop running, but don't update
            return;
        }

        // Adjust canvas size
        canvas.width = WALL_SIZE;
        canvas.height = WALL_SIZE;

        // Clear the canvas
        ctx.fillStyle = BLACK;
        drawRoundedRectangle(ctx, 0, 0, canvas.width, canvas.height, 20);

        // Move objects
        for (const obj of objects) {
            // Apply random velocity change to the angle without changing speed
            const speed = Math.sqrt(obj.dx * obj.dx + obj.dy * obj.dy);
            const angleChange = getRandomInRange(-VELOCITY_CHANGE, VELOCITY_CHANGE) * (Math.PI / 180); // Convert degrees to radians
            const angle = Math.atan2(obj.dy, obj.dx) + angleChange;
            obj.dx = speed * Math.cos(angle);
            obj.dy = speed * Math.sin(angle);

            obj.x += obj.dx;
            obj.y += obj.dy;

            // Bounce off walls
            if (obj.x < OBJECT_RADIUS || obj.x > canvas.width - OBJECT_RADIUS) {
                obj.dx = -obj.dx;
                // Move the object back inside the wall boundary
                obj.x = Math.min(Math.max(obj.x, OBJECT_RADIUS), canvas.width - OBJECT_RADIUS);
            }
            if (obj.y < OBJECT_RADIUS || obj.y > canvas.height - OBJECT_RADIUS) {
                obj.dy = -obj.dy;
                // Move the object back inside the wall boundary
                obj.y = Math.min(Math.max(obj.y, OBJECT_RADIUS), canvas.height - OBJECT_RADIUS);
            }
        }

        // Handle collisions
        handleCollisions();

        // Draw objects
        for (const obj of objects) {
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, OBJECT_RADIUS, 0, 2 * Math.PI);
            ctx.fillStyle = isHighlighting && obj.isTarget ? RED : WHITE;
            ctx.fill();
        }

        // Stop highlighting targets after TARGET_TIME milliseconds
        if (isHighlighting && Date.now() - highlightStartTime > TARGET_TIME) {
            isHighlighting = false;
        }

        const timerElement = document.getElementById('timer');
        // Update the timer if the highlight started
        if (highlightStartTime !== null) {
            const elapsedTime = ((Date.now() - highlightStartTime) / 1000).toFixed(1);
            timerElement.textContent = elapsedTime;
        }

        // Request next frame
        requestAnimationFrame(gameLoop);
    }

    // Start the game loop
    requestAnimationFrame(gameLoop);

    // Event listener for spacebar to toggle pause
    document.addEventListener('keydown', event => {
        if (event.code === 'Space') {
            paused = !paused; // Toggle paused between true and false
        }
    });

    // Event listeners for settings changes
    const numTargetsInput = document.getElementById('numTargets');
    const numTargetsValue = document.getElementById('numTargetsValue');
    numTargetsInput.addEventListener('input', () => {
        NUM_TARGETS = parseInt(numTargetsInput.value);
        numTargetsValue.textContent = NUM_TARGETS;
        initializeObjects();
    });

    const numDistractorsInput = document.getElementById('numDistractors');
    const numDistractorsValue = document.getElementById('numDistractorsValue');
    numDistractorsInput.addEventListener('input', () => {
        NUM_DISTRACTORS = parseInt(numDistractorsInput.value);
        numDistractorsValue.textContent = NUM_DISTRACTORS;
        initializeObjects();
    });

    const objectSpeedInput = document.getElementById('objectSpeed');
    const objectSpeedValue = document.getElementById('objectSpeedValue');
    objectSpeedInput.addEventListener('input', () => {
        OBJECT_SPEED = parseInt(objectSpeedInput.value);
        objectSpeedValue.textContent = OBJECT_SPEED;
        initializeObjects();
    });

    // Random velocity change input listener
    const velocityChangeInput = document.getElementById('velocityChange');
    const velocityChangeValue = document.getElementById('velocityChangeValue');
    velocityChangeInput.addEventListener('input', () => {
        VELOCITY_CHANGE = parseInt(velocityChangeInput.value);
        velocityChangeValue.textContent = VELOCITY_CHANGE;
    });

    // Wall size input listener
    const wallSizeInput = document.getElementById('wallSize');
    const wallSizeValue = document.getElementById('wallSizeValue');
    wallSizeInput.addEventListener('input', () => {
        WALL_SIZE = parseInt(wallSizeInput.value);
        wallSizeValue.textContent = WALL_SIZE;
        canvas.width = WALL_SIZE;
        canvas.height = WALL_SIZE;
        initializeObjects();
    });

    // Event listeners for settings changes
    const ballSizeInput = document.getElementById('ballSize');
    const ballSizeValue = document.getElementById('ballSizeValue');
    ballSizeInput.addEventListener('input', () => {
    OBJECT_RADIUS = parseInt(ballSizeInput.value);
    ballSizeValue.textContent = ballSizeInput.value;
    initializeObjects(); // Reinitialize objects with new size
    });

    // Event listener for mouse click
    canvas.addEventListener('click', () => {
        if (!isHighlighting) {
            isHighlighting = true;
            highlightStartTime = Date.now();
        }
    });
});
