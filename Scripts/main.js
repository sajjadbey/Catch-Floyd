// Select the canvas element
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Get the game over screen and restart button
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Basket properties
const basket = {
    width: 50,
    height: 50, // Adjust height to match the basket image
    x: canvas.width / 2 - 50,
    y: canvas.height - 60, // Adjust position to match the basket image
    speed: 400, // Speed in pixels per second
};

// Food properties
let foods = [];
const foodImages = {}; // Store food images
const foodSize = 70; // Customize the size of the food here
const Breath = new Audio('../Sounds/Breathe.mp3');

// Load images (basket and food)
function loadImages() {
    return new Promise((resolve) => {
        const greenFood = new Image();
        const redFood = new Image();
        const basketImage = new Image();

        greenFood.src = '../Sprites/KFC.png'; // Replace with your green food image path
        redFood.src = '../Sprites/Police.png'; // Replace with your red food image path
        basketImage.src = '../Sprites/George.png'; // Replace with your basket image path

        greenFood.onload = () => {
            foodImages.green = greenFood;
            if (redFood.complete && basketImage.complete) resolve();
        };

        redFood.onload = () => {
            foodImages.red = redFood;
            if (greenFood.complete && basketImage.complete) resolve();
        };

        basketImage.onload = () => {
            basket.image = basketImage; // Store the basket image
            if (greenFood.complete && redFood.complete) resolve();
        };
    });
}

// Game variables
let score = 0;
let lastTime = 0; // Track the last frame time
let gameOver = false; // Game over flag

// Event listeners for keyboard movement (for desktop)
document.addEventListener('keydown', (e) => {
    if (gameOver) return; // Ignore input if game is over
    if (e.key === 'ArrowLeft' && basket.x > 0) {
        basket.x -= basket.speed * (1 / 60); // Smooth movement
    } else if (e.key === 'ArrowRight' && basket.x < canvas.width - basket.width) {
        basket.x += basket.speed * (1 / 60); // Smooth movement
    }
});

// Event listeners for touch controls (for mobile)
let isDragging = false;
let startX = 0;

canvas.addEventListener('touchstart', (e) => {
    if (gameOver) return; // Ignore input if game is over
    e.preventDefault(); // Prevent default scrolling behavior
    const touch = e.touches[0];
    startX = touch.clientX; // Get the initial touch position
    isDragging = true; // Start dragging
});

canvas.addEventListener('touchmove', (e) => {
    if (!isDragging || gameOver) return; // Ignore if not dragging or game is over
    e.preventDefault(); // Prevent default scrolling behavior
    const touch = e.touches[0];
    const currentX = touch.clientX;

    // Calculate the new basket position based on touch movement
    const deltaX = currentX - startX;
    basket.x += deltaX;

    // Ensure the basket stays within bounds
    if (basket.x < 0) basket.x = 0;
    if (basket.x > canvas.width - basket.width) basket.x = canvas.width - basket.width;

    // Update the start position for the next movement
    startX = currentX;
});

canvas.addEventListener('touchend', () => {
    isDragging = false; // Stop dragging
});

// Function to create food with weighted probabilities
function createFood() {
    const x = Math.random() * (canvas.width - foodSize); // Adjust spawn position to fit food size
    const y = -foodSize; // Start above the canvas

    // Weighted random selection: 3 green, 2 red
    const randomValue = Math.random();
    let color;

    if (randomValue < 0.6) {
        color = 'green'; // 60% chance for green food
    } else {
        color = 'red'; // 40% chance for red food
    }

    foods.push({ x, y, color });
}

// Function to update food positions
function updateFoods(deltaTime) {
    for (let i = foods.length - 1; i >= 0; i--) {
        foods[i].y += 300 * (deltaTime / 1000); // Velocity-based falling

        // Check if food is caught by the basket
        if (
            foods[i].y + foodSize > basket.y && // Use foodSize for collision detection
            foods[i].x < basket.x + basket.width &&
            foods[i].x + foodSize > basket.x // Use foodSize for collision detection
        ) {
            if (foods[i].color === 'green') {
                score++; // Increase score for green food
            } else if (foods[i].color === 'red') {
                Breath.play();
                gameOver = true; // Game over for red food
            }
            foods.splice(i, 1); // Remove the caught food
        }

        // If food reaches the bottom, remove it
        if (foods[i].y > canvas.height) {
            foods.splice(i, 1); // Remove the food that hit the ground
        }
    }
}

// Function to draw the basket
function drawBasket() {
    if (basket.image) {
        ctx.drawImage(basket.image, basket.x, basket.y, basket.width, basket.height);
    } else {
        ctx.fillStyle = basket.color;
        ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
    }
}

// Function to draw food
function drawFoods() {
    foods.forEach((food) => {
        if (foodImages[food.color]) {
            ctx.drawImage(foodImages[food.color], food.x, food.y, foodSize, foodSize); // Use foodSize for drawing
        }
    });
}

// Function to draw the score
function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 20);
}

// Function to reset the game
function resetGame() {
    score = 0; // Reset score
    foods = []; // Clear all foods
    basket.x = canvas.width / 2 - 50; // Reset basket position
    gameOver = false; // Reset game over flag

    // Hide the game over screen
    gameOverScreen.style.display = 'none'; // Modify property, not reassign

    location.reload();
}

// Handle button click to restart the game
restartButton.addEventListener('click', resetGame);

// Game loop
function gameLoop(timestamp) {
    if (gameOver) {
        gameOverScreen.style.display = 'block'; // Show the game over screen
        return;
    }

    const deltaTime = timestamp - lastTime; // Time elapsed since the last frame
    lastTime = timestamp;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw game elements
    drawBasket();
    drawFoods();
    drawScore();
    updateFoods(deltaTime);

    // Randomly create new food
    if (Math.random() < 0.02) {
        createFood();
    }

    // Request the next animation frame
    requestAnimationFrame(gameLoop);
}

// Start the game after images are loaded
loadImages().then(() => {
    requestAnimationFrame(gameLoop);
});