import Beyblade, { setCanvasValues } from "./beyblade.js";

export const canvas = document.getElementById("beybladeCanvas");
const ctx = canvas.getContext("2d");

export const centerX = canvas.width / 2;
export const centerY = canvas.height / 2;

let beybladeLeft;
let beybladeRight;

let animationId = null;
let isAnimating = false;

// Listeners
document.querySelector("button.start").addEventListener("click", startBattle);
document.querySelector("button.stop").addEventListener("click", stopBattle);
document.querySelector("button.pause").addEventListener("click", pauseBattle);

// Beyblade Drawing functions
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function animate() {
    clearCanvas();

    // Update Beyblade position based on physics (call updatePosition)
    beybladeLeft.updatePosition();
    beybladeRight.updatePosition();
    // beybladeTop.updatePosition();
    
    beybladeLeft.draw(ctx);
    beybladeRight.draw(ctx);
    // beybladeTop.draw(ctx);
    
    beybladeLeft.checkCollision(beybladeRight, ctx);
    // beybladeTop.checkCollision(beybladeRight, ctx)
    // beybladeTop.checkCollision(beybladeLeft, ctx)

    animationId = requestAnimationFrame(animate);
}

function updateBeyblades() {
    let currentBeyName = document.getElementById("left_bey_name").value;
    let currentBeyVX = document.getElementById("left_bey_vx").value;
    let currentBeyVY = document.getElementById("left_bey_vy").value;

    beybladeLeft = new Beyblade(
        currentBeyName,
        currentBeyName.toLowerCase().replace(/[^a-zA-Z]/g, ''),
        60, //canvas.width / 2,
        canvas.height / 2,
        parseFloat(currentBeyVX ? currentBeyVX : randomNumberBetween(0, 20)),
        parseFloat(currentBeyVY ? currentBeyVY : randomNumberBetween(-25, 25)), 
        parseInt(document.getElementById("left_bey_direction").value),
        parseFloat(document.getElementById("left_bey_weight").value),
        document.getElementById("left_bey_type").value
    )

    currentBeyName = document.getElementById("right_bey_name").value;
    currentBeyVX = document.getElementById("right_bey_vx").value;
    currentBeyVY = document.getElementById("right_bey_vy").value;

    beybladeRight = new Beyblade(
        currentBeyName,
        currentBeyName.toLowerCase().replace(/[^a-zA-Z]/g, ''),
        canvas.width - 60,
        canvas.height / 2,
        parseFloat(currentBeyVX ? currentBeyVX : randomNumberBetween(0, 20)),
        parseFloat(currentBeyVY ? currentBeyVY : randomNumberBetween(-25, 25)), 
        parseInt(document.getElementById("right_bey_direction").value),
        parseFloat(document.getElementById("right_bey_weight").value),
        document.getElementById("right_bey_type").value
    )

    saveBeybladesToLocalstorage();
}

// Battle Functions
function startBattle() {
    updateBeyblades()

    if (!isAnimating) {
        isAnimating = true;
        animate();
    }

    // Initial drawing
    beybladeLeft.draw(ctx);
    beybladeRight.draw(ctx);
    // beybladeTop.draw(ctx);
}

function stopBattle() {
    if (isAnimating) {
        cancelAnimationFrame(animationId);
        isAnimating = false;
        clearCanvas();
        // beybladeLeft.stop();
        // beybladeRight.stop();
        // beybladeTop.stop();
        // beybladeLeft.draw(ctx);
        // beybladeRight.draw(ctx);
        // beybladeTop.draw(ctx);
    }
}

function pauseBattle() {
    if (isAnimating) {
        cancelAnimationFrame(animationId);
        isAnimating = false;
    } else {
        animationId = requestAnimationFrame(animate);
        isAnimating = true;
    }
}

// Local Storage Functions
function saveBeybladesToLocalstorage() {
    const leftBeybladeCopy = {...beybladeLeft}
    const rightBeybladeCopy = {...beybladeRight}

    leftBeybladeCopy.vx = null
    leftBeybladeCopy.vy = null
    rightBeybladeCopy.vx = null
    rightBeybladeCopy.vy = null

    // Saving beyblades to localStorage
    localStorage.setItem("beybladeLeft", JSON.stringify(leftBeybladeCopy));
    localStorage.setItem("beybladeRight", JSON.stringify(rightBeybladeCopy));
}

function loadBeybladesFromLocalStorage() {
    let leftBeybladeData = localStorage.getItem("beybladeLeft");
    let rightBeybladeData = localStorage.getItem("beybladeRight");
    
    if (leftBeybladeData || rightBeybladeData) {
        leftBeybladeData = JSON.parse(leftBeybladeData)
        rightBeybladeData = JSON.parse(rightBeybladeData)

        if (leftBeybladeData) beybladeLeft = new Beyblade(leftBeybladeData);
        if (rightBeybladeData) beybladeRight = new Beyblade(rightBeybladeData);

        fillFormsWithLocalStorageData(leftBeybladeData, rightBeybladeData)
        return true
    } else {
        return false
    }
}

function fillFormsWithLocalStorageData(leftBeybladeData, rightBeybladeData) {
    if (leftBeybladeData) {
        document.getElementById("left_bey_name").value = leftBeybladeData.name;
        document.getElementById("left_bey_direction").value = leftBeybladeData.rotationDirection;
        document.getElementById("left_bey_weight").value = leftBeybladeData.weight;
        document.getElementById("left_bey_type").value = leftBeybladeData.type;
    }
    if (rightBeybladeData) {
        document.getElementById("right_bey_name").value = rightBeybladeData.name;
        document.getElementById("right_bey_direction").value = rightBeybladeData.rotationDirection;
        document.getElementById("right_bey_weight").value = rightBeybladeData.weight;
        document.getElementById("right_bey_type").value = rightBeybladeData.type;
    }
}

// Utilities
export function randomNumberBetween(min, max) {
    return Math.random() * (max - min) + min;
}

window.onload = () => {
    setCanvasValues();
    loadBeybladesFromLocalStorage()
};