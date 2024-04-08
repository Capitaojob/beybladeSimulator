// Importar canvas, centerX, centerY e RPM do script.js
import { canvas, centerX, centerY, randomNumberBetween } from "./index.js";
import playSound from "./sound.js";

const RPM = 5000;
const maxBoundaryDistance = 50;
// const borderWidth = 20;
const angularTypeFactorDict = {
    "attack":  0.0000013,
    "defense": 0.0000004,
    "stamina": 0.0000001
}
const rpmLosingTypeFactorDict = {
    "attack":  0.4,
    "defense": 0.24,
    "stamina": 0.2
}
const typeAttackFactorDict = {
    "attack":  2.5,
    "defense": 1.4,
    "stamina": 1.1
}
const typeDefenseFactorDict = {
    "attack":  1,
    "defense": 1.5,
    "stamina": 1.1
}

var canvasWidth;
var canvasHeight;

export function setCanvasValues() {
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
}

export default class Beyblade {
    constructor(name = "Generic", imageName, x, y, vx, vy, rotationDirection = 1, weight, type) {
        // Data
        this.name = name;
        this.radius = 45; //45
        this.weight = weight;
        this.type = type;
        // Looks
        this.image = new Image();
        this.slowImageSrc = `./img/${imageName}.png`;
        this.fastImageSrc = `./img/${imageName}_rotating.png`;
        this.image.src = this.fastImageSrc;
        this.imageInUse = "rotating";
        // Position
        this.x = x;
        this.y = y;
        this.startingX = x;
        this.startingY = y;
        // Velocity
        this.vx = vx;
        this.vy = vy;
        // Acceleration
        this.angularTypeFactor = angularTypeFactorDict[this.type]
        this.typeRPMDeduction = rpmLosingTypeFactorDict[this.type]
        this.typeAttackFactor = typeAttackFactorDict[this.type]
        this.typeDefenseFactor = typeDefenseFactorDict[this.type]
        // Rotation
        this.rpm = RPM;
        this.rotationDirection = rotationDirection;
        this.angularVelocity = RPM * (Math.PI / 30); // Converter RPM para radianos por segundo
        this.rotation = 0; // Inicializa a rotação como 0
        // Constants
        this.gravityForce = 0.008 / (this.weight / 100)
    }

    // Beyblade state drawing updates
    updatePosition() {
        // Distance from center
        const distanceX = centerX - this.x;
        const distanceY = centerY - this.y;

        // Acceleration based on gravity from distance from center and RPM
        const rpmFactor = this.rpm / RPM;
        const ax = distanceX * this.gravityForce;
        const ay = distanceY * this.gravityForce;
        this.vx += ax * rpmFactor;
        this.vy += ay * rpmFactor;

        // Apply rotation direction to acceleration
        const angularAcceleration = this.rpm * (Math.PI / 30) * this.rotationDirection * this.angularTypeFactor;
        this.vx += angularAcceleration * distanceY;
        this.vy -= angularAcceleration * distanceX;

        // Friction
        const friction = 0.005;
        this.vx *= 1 - friction;
        this.vy *= 1 - friction;

        // Updates the location
        this.x += this.vx;
        this.y += this.vy;

        // Add a small random factor to velocities, influenced by RPM
        const randomFactor = (Math.random() - 0.5) * (this.rpm / RPM) * 0.5; // Adjust the range and magnitude of randomness as needed
        this.vx += randomFactor;
        this.vy += randomFactor;

        this.checkBoundaryCollision();

        // Checks if still spinning
        if (this.rpm > 0) {
            this.rpm -= this.typeRPMDeduction;
            this.updateRotation();
            if (this.imageInUse === "rotating" && this.rpm < 250) {
                this.imageInUse = "static";
                this.image.src = this.slowImageSrc;
            } else if (this.imageInUse === "static" && this.rpm >= 250) {
                this.imageInUse = "rotating";
                this.image.src = this.fastImageSrc;
            }
        } else {
            this.vx = this.vx > 0 ? this.vx - 1 : 0
            this.vy = this.vy > 0 ? this.vy - 1 : 0
            this.rpm = 0;
        }
    }

    updateRotation() {
        // this.angularVelocity = this.rpm * (Math.PI / 30) * -this.rotationDirection;
        // this.rotation += this.angularVelocity; // Updates rotation based on angular velocity
        if (this.rotationDirection === 1) 
            this.rotation = (this.rotation + Math.min((this.rpm / RPM * 5).toFixed(2), 1)) % 360
        else 
            this.rotation = (this.rotation - Math.min((this.rpm / RPM * 5).toFixed(2), 1)) % -360 //.toFixed(2)
    }

    draw(ctx) {
        ctx.save(); // Saves context state
        ctx.translate(this.x, this.y); // Translates context to beyblade position
        ctx.rotate(this.rotation); // Rotates context
        ctx.drawImage(this.image, -this.radius, -this.radius, this.radius * 2, this.radius * 2); // Draws beyblade
        ctx.restore(); // Restores the context state
    }

    // Aux drawings
    drawSparks(ctx, x, y) {
        const sparkImage = new Image();
        sparkImage.src = "./img/sparks.webp"; // Substitua pelo caminho da sua imagem de faísca

        // Definir uma rotação aleatória para a faísca
        const rotation = Math.random() * Math.PI * 2;

        // Desenhar a faísca na posição dos beyblades
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.drawImage(sparkImage, -sparkImage.width / 2, -sparkImage.height / 2); // Desenha a imagem centralizada
        ctx.restore();
    }

    checkCollision(otherBeyblade, ctx) {
        const dx = otherBeyblade.x - this.x;
        const dy = otherBeyblade.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        if (distance < this.radius + otherBeyblade.radius && (this.rpm > 0 && otherBeyblade.rpm > 0)) {
            const collisionAngle = Math.atan2(dy, dx);
            const combinedRadius = this.radius + otherBeyblade.radius;
            const overlap = combinedRadius - distance;
            const forceMagnitude = overlap * 0.5;
    
            // Determina a direção da rotação
            const rotationDirectionFactor = this.rotationDirection === otherBeyblade.rotationDirection ? 2 : 1.4;
    
            // Influência do peso na força de colisão
            const thisWeightFactor = this.weight / 100;
            const otherWeightFactor = otherBeyblade.weight / 100;
    
            const xMagnitude = forceMagnitude * Math.cos(collisionAngle);
            const yMagnitude = forceMagnitude * Math.sin(collisionAngle);
    
            const thisForceX = xMagnitude * (otherBeyblade.rpm / 3000) * (otherWeightFactor / thisWeightFactor) * otherBeyblade.typeAttackFactor / this.typeDefenseFactor * randomNumberBetween(0.5, 1.5);
            const thisForceY = yMagnitude * (otherBeyblade.rpm / 3000) * (otherWeightFactor / thisWeightFactor) * otherBeyblade.typeAttackFactor / this.typeDefenseFactor * randomNumberBetween(0.5, 1.5);
    
            const otherForceX = xMagnitude * (this.rpm / 3000) * (thisWeightFactor / otherWeightFactor) * this.typeAttackFactor / otherBeyblade.typeDefenseFactor * randomNumberBetween(0.5, 1.5);
            const otherForceY = yMagnitude * (this.rpm / 3000) * (thisWeightFactor / otherWeightFactor) * this.typeAttackFactor / otherBeyblade.typeDefenseFactor * randomNumberBetween(0.5, 1.5);
    
            // Atualiza as velocidades dos beyblades com base na força da colisão
            this.vx -= thisForceX;
            this.vy -= thisForceY;
            otherBeyblade.vx += otherForceX;
            otherBeyblade.vy += otherForceY;
    
            // Ajusta a redução de RPM com base no peso durante a colisão
            const rpmDeduction = Math.max(Math.round(Math.abs(forceMagnitude * Math.min((this.rpm / RPM + otherBeyblade.rpm / RPM) * 2, 1) * rotationDirectionFactor)) / 2, 2);
            this.rpm -= rpmDeduction * (thisWeightFactor / otherWeightFactor);
            otherBeyblade.rpm -= rpmDeduction * (otherWeightFactor / thisWeightFactor);
    
            // Reproduz o som de impacto
            let impactLevel = "weak";
            if (forceMagnitude > 10) {
                impactLevel = "hard";
            } else if (forceMagnitude > 5) {
                impactLevel = "medium";
            }
    
            playClashSound(impactLevel);
    
            // Desenha as faíscas
            this.drawSparks(ctx, (this.x + otherBeyblade.x) / 2, (this.y + otherBeyblade.y) / 2);
        }
    }
    

    // // Collision Handling
    // checkCollision(otherBeyblade, ctx) {
    //     const dx = otherBeyblade.x - this.x;
    //     const dy = otherBeyblade.y - this.y;
    //     const distance = Math.sqrt(dx * dx + dy * dy);
    //     if (distance < this.radius + otherBeyblade.radius && (this.rpm > 0 && otherBeyblade.rpm > 0)) {
    //         const collisionAngle = Math.atan2(dy, dx);
    //         const combinedRadius = this.radius + otherBeyblade.radius;
    //         const overlap = combinedRadius - distance;
    //         const forceMagnitude = overlap * 0.5;

    //         // Determina a direção da rotação
    //         const rotationDirectionFactor = this.rotationDirection === otherBeyblade.rotationDirection ? 2 : 1.4;

    //         const xMagnitude = forceMagnitude * Math.cos(collisionAngle)
    //         const yMagnitude = forceMagnitude * Math.sin(collisionAngle)
            
    //         const thisForceX =  xMagnitude * ((otherBeyblade.rpm / 3000) / (this.weight / 100) * otherBeyblade.typeAttackFactor / this.typeDefenseFactor * randomNumberBetween(0.5, 1.5));
    //         const thisForceY =  yMagnitude * ((otherBeyblade.rpm / 3000) / (this.weight / 100) * otherBeyblade.typeAttackFactor / this.typeDefenseFactor * randomNumberBetween(0.5, 1.5));

    //         const otherForceX = xMagnitude * ((this.rpm / 3000) / (otherBeyblade.weight / 100) * this.typeAttackFactor / otherBeyblade.typeDefenseFactor *  randomNumberBetween(0.5, 1.5));
    //         const otherForceY = yMagnitude * ((this.rpm / 3000) / (otherBeyblade.weight / 100) * this.typeAttackFactor / otherBeyblade.typeDefenseFactor *  randomNumberBetween(0.5, 1.5));
            
    //         // console.log(thisForceX, thisForceY, otherForceX, otherForceY)

    //         // Atualiza as velocidades dos beyblades com base na força da colisão
    //         // TODO: Attack types have a bigger hit
    //         this.vx -= thisForceX;
    //         this.vy -= thisForceY;
    //         otherBeyblade.vx += otherForceX;
    //         otherBeyblade.vy += otherForceY;

    //         // Adjusts impact RPM deduction
    //         const rpmDeduction = Math.max((Math.round(Math.abs(forceMagnitude * Math.min((this.rpm / RPM + otherBeyblade.rpm / RPM) * 2, 1) * rotationDirectionFactor))) / 2, 2);
    //         this.rpm -= rpmDeduction * 3;
    //         otherBeyblade.rpm -= rpmDeduction * 3;

    //         // Plays impact sound
    //         let impactLevel = "weak";
    //         if (forceMagnitude > 10) {
    //             impactLevel = "hard";
    //         } else if (forceMagnitude > 5) {
    //             impactLevel = "medium";
    //         }

    //         playClashSound(impactLevel);

    //         // Desenha as faíscas
    //         this.drawSparks(ctx, (this.x + otherBeyblade.x) / 2, (this.y + otherBeyblade.y) / 2);
    //     }
    // }

    checkBoundaryCollision() {
        // Verifica colisão com bordas horizontais
        if (
            this.x - this.radius < 0 && 
            // this.x + this.radius > -20 &&
            this.y < canvas.height / 2 || 
            this.x + this.radius > canvasWidth && 
            // this.x - this.radius < canvasWidth + 20 && 
            this.y > canvas.height / 2
        ) {
            this.vx *= -0.7; // Inverte a velocidade horizontal
            this.vy *= 0.1 //0.6

            // Adiciona influência da RPM e da direção de rotação na velocidade refletida
            this.vx += this.rpm * this.rotationDirection * 0.0001;
            this.rpm -= Math.round(Math.abs(this.vx)) * 5;

            // Corrige a posição para evitar que o beyblade fique preso na borda
            if (this.x - this.radius < 0) {
                this.x = this.radius; // Corrige para dentro do canvas
            } else if (this.x + this.radius > canvasWidth) {
                this.x = canvasWidth - this.radius; // Corrige para dentro do canvas
            }

            playWallClashSound(this.vx > 10 ? "hard" : "weak")
        // Out of Bounds
        } else if (this.x - this.radius < -maxBoundaryDistance && this.y > canvas.height / 2 || this.x + this.radius > canvasWidth + maxBoundaryDistance && this.y < canvas.height / 2) {
            if (this.rpm > 0) this.rpm = 0;
            this.imageInUse = "static";
            this.image.src = this.slowImageSrc;
        }

        // Verifica colisão com bordas verticais
        if (
            this.y - this.radius < 0 && 
            this.x > canvas.width / 2 || 
            this.y + this.radius > canvasHeight && 
            this.x < canvas.width / 2
        ) {
            this.vy *= -0.7; // Inverte a velocidade vertical
            this.vx *= 0.1 //0.6

            // Adiciona influência da RPM e da direção de rotação na velocidade refletida
            this.vy += this.rpm * this.rotationDirection * 0.0001;
            this.rpm -= Math.round(Math.abs(this.vy)) * 5;

            // Corrige a posição para evitar que o beyblade fique preso na borda
            if (this.y - this.radius < 0) {
                this.y = this.radius; // Corrige para dentro do canvas
            } else if (this.y + this.radius > canvasHeight) {
                this.y = canvasHeight - this.radius; // Corrige para dentro do canvas
            }

            playWallClashSound(this.vy > 10 ? "hard" : "weak")
        // Out of Bounds
        } else if (this.y - this.radius < -maxBoundaryDistance && this.x < canvas.width / 2 || this.y + this.radius > canvasHeight + maxBoundaryDistance && this.x > canvas.width / 2) {
            if (this.rpm > 0) this.rpm = 0;
            this.imageInUse = "static";
            this.image.src = this.slowImageSrc;
        }
    }
}

function playClashSound(intensity) {
    playSound(`./sounds/clash/${intensity}_clash_${Math.floor(randomNumberBetween(1, 3))}.mp3`);
}

function playWallClashSound(intensity) {
    playSound(`./sounds/clash/${intensity}_wall_1.mp3`);
}