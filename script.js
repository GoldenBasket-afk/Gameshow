// --- Configuration & State ---
const DEFAULT_PRODUCTS = [
    { id: 1, name: "Premium Gift Box", img: "assets/prize_gift_box.png", color: "#FFD700", textColor: "#002366" },
    { id: 2, name: "Luxury Watch", img: "assets/prize_luxury_watch.png", color: "#002366", textColor: "#FFD700" },
    { id: 3, name: "5000tk Voucher", img: "assets/prize_voucher.png", color: "#FFD700", textColor: "#002366" },
    { id: 4, name: "Smartphone", img: "assets/prize_smartphone.png", color: "#002366", textColor: "#FFD700" }
];

// Load state from local storage or use defaults
let state = {
    products: JSON.parse(localStorage.getItem('gmd_products')) || DEFAULT_PRODUCTS,
    winners: JSON.parse(localStorage.getItem('gmd_winners')) || [],
    winners: JSON.parse(localStorage.getItem('gmd_winners')) || [],
    currentUser: { name: "Guest", id: "000" }
};

// Canvas Setup
const canvas = document.getElementById('spinWheel');
const ctx = canvas.getContext('2d');
const dimension = canvas.width;
const center = dimension / 2;
const radius = dimension / 2 - 10; // Padding

// Variables for animation
let currentRotation = 0;
let isSpinning = false;
let spinVelocity = 0;
let decel = 0.985; // Deceleration factor
let winnerIndex = -1;

// Image Cache
const productImages = {};

// --- Initialization ---
async function init() {
    setupEventListeners();
    await loadImages();
    drawWheel();
    // renderWinnerBoard(); // Removed
    // startCountdown(); // Removed

    // Check for admin reset data
    // (Optional: clear daily if needed automatically)
}

function setupEventListeners() {
    // Spin Button
    document.getElementById('spinBtn').addEventListener('click', () => {
        document.getElementById('entryModal').classList.add('active');
        document.getElementById('custName').focus();
    });

    // Entry Form Submit
    document.getElementById('entryForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('custName').value;
        const id = document.getElementById('custId').value;

        if (name && id) {
            // Check if ID already exists in winners
            const alreadyWon = state.winners.some(w => w.id === id);

            if (alreadyWon) {
                // Show polite message
                document.getElementById('entryModal').classList.remove('active');

                const msgBody = `প্রিয় ${name}, আমাদের সাথে থাকার জন্য আপনাকে অসংখ্য ধন্যবাদ! \n\n সম্মানিত গ্রাহক, আপনি এই মেম্বারশিপ আইডি (${id}) ব্যবহার করে ইতিমধ্যে একবার স্পিন করেছেন। \n\n পরবর্তী ইভেন্টে আবার স্বাগতম!`;

                document.getElementById('msgBody').innerText = msgBody;
                document.getElementById('messageModal').classList.add('active');

                e.target.reset();
                return;
            }

            // Proceed if new ID
            state.currentUser = { name, id };
            document.getElementById('entryModal').classList.remove('active');
            spin();
            e.target.reset();
        }
    });

    // Message Modal: Close
    document.getElementById('msgCloseAction').addEventListener('click', () => {
        document.getElementById('messageModal').classList.remove('active');
    });

    // Admin Shortcut (Ctrl + E)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            openAdminPanel();
        }
    });

    // Admin: Close
    document.getElementById('closeAdmin').addEventListener('click', () => {
        document.getElementById('adminPanel').classList.remove('active');
    });

    // Admin: Save
    document.getElementById('saveAdminChanges').addEventListener('click', saveAdminChanges);

    // Admin: Reset
    document.getElementById('resetDataBtn').addEventListener('click', () => {
        if (confirm("Are you sure you want to RESET ALL data? This cannot be undone.")) {
            localStorage.removeItem('gmd_products');
            localStorage.removeItem('gmd_winners');
            location.reload();
        }
    });

    // Admin: Export
    document.getElementById('exportDataBtn').addEventListener('click', exportDataToExcel);

    // Winner Modal: Close
    document.getElementById('closeWinnerBtn').addEventListener('click', () => {
        document.getElementById('winnerModal').classList.remove('active');
    });
}

// --- Image Handling ---
function loadImages() {
    const promises = state.products.map(prod => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = prod.img;
            img.onload = () => {
                productImages[prod.id] = img;
                resolve();
            };
            img.onerror = () => {
                console.warn(`Could not load image for ${prod.name}`);
                productImages[prod.id] = null; // Handle missing image gracefully
                resolve();
            };
        });
    });
    return Promise.all(promises);
}

// --- Wheel Logic ---
function drawWheel() {
    const numSegments = state.products.length;
    const arcSize = (2 * Math.PI) / numSegments;

    // Clear
    ctx.clearRect(0, 0, dimension, dimension);

    // Save context for rotation
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(currentRotation);

    state.products.forEach((prod, i) => {
        const angle = i * arcSize;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, angle, angle + arcSize);
        ctx.fillStyle = prod.color;
        ctx.fill();
        ctx.stroke();

        // Text removed
        // ctx.fillText(prod.name, radius - 60, 10);

        // Draw Image if available
        if (productImages[prod.id]) {
            ctx.save();
            // Rotate to the middle of the segment
            ctx.rotate(angle + arcSize / 2);

            // Position image - Adjusted size and removed clip
            const imgSize = 100; // Refined smaller size
            const halfSize = imgSize / 2;
            const distFromEdge = 110;  // Push slightly outward for more width

            // Move to position along the slice center line
            ctx.translate(radius - distFromEdge, 0);

            // Rotate image to be upright relative to the wheel outer edge
            ctx.rotate(Math.PI / 2);

            ctx.drawImage(productImages[prod.id], -halfSize, -halfSize, imgSize, imgSize);
            ctx.restore();
        }

        // Orphaned restore removed
    });

    ctx.restore();
}

function spin() {
    if (isSpinning) return;
    isSpinning = true;

    // Pick a random winner 0-3
    winnerIndex = Math.floor(Math.random() * state.products.length);

    // Calculate required rotation to land on this index.
    // The pointer is at TOP (3*PI/2 or -PI/2).
    // The wheel rotates CLOCKWISE.
    // To land on index 'i', that segment must be at the pointer.

    // Let's rely on simple physics simulation instead of pre-calc for visuals,
    // but ensures we stop at the right spot? 
    // Actually, user asked for "Random logic".
    // Physics simulation:
    // Initial velocity high.
    // Loop until velocity < 0.01.
    // Determine winner based on final angle.

    spinVelocity = 30 + Math.random() * 20; // Initial random violent spin

    requestAnimationFrame(animateSpin);
    playSound('spin'); // Placeholder
}

function animateSpin() {
    spinVelocity *= decel; // Apply friction

    if (spinVelocity < 0.05) {
        // Stop
        isSpinning = false;
        determineWinner();
        return;
    }

    const oldAngle = currentRotation;
    currentRotation += (spinVelocity * Math.PI / 180);

    // Play sound every time we pass a predefined angle chunk (e.g. every 15 degrees)
    // 15 degrees in radians is ~0.26
    if (Math.floor(currentRotation / 0.26) > Math.floor(oldAngle / 0.26)) {
        playSound('spin');
    }

    // Normalize rotation 0-2PI not strictly needed but good for debugging
    drawWheel();
    requestAnimationFrame(animateSpin);
}

function determineWinner() {
    // Normalize angle to 0 - 2PI
    const netRotation = currentRotation % (2 * Math.PI);

    // Pointer is at Top (270deg or 3PI/2). 
    // In Canvas arc 0 is right, PI/2 down, PI left, 3PI/2 top.
    // So we need to find which segment is overlapping 3PI/2.
    // Since we rotated the context, we can think of it as: 
    // Which segment angle interval contains (3PI/2 - netRotation)?

    const numSegments = state.products.length;
    const arcSize = (2 * Math.PI) / numSegments;

    // Adjust pointer location to logic space
    // If we rotated the wheel by `netRotation`, the "0" angle of the wheel is at `netRotation`.
    // The fixed pointer is at `3*Math.PI/2`.
    // We need to map `3*Math.PI/2` back to the wheel's local coordinate system.
    let pointerAngleOnWheel = (3 * Math.PI / 2) - netRotation;

    // Normalize to [0, 2PI)
    pointerAngleOnWheel = pointerAngleOnWheel % (2 * Math.PI);
    if (pointerAngleOnWheel < 0) pointerAngleOnWheel += 2 * Math.PI;

    const winningIndex = Math.floor(pointerAngleOnWheel / arcSize);

    const winnerProduct = state.products[winningIndex];
    handleWin(winnerProduct);
}

function handleWin(product) {
    if (!state.currentUser) state.currentUser = { name: "Lucky Winner", id: "000" };

    // Play Sound
    playSound('win');

    // Confetti
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#002366', '#ffffff'] // Gold, Royal Blue, White
    });

    // Update Modal
    document.getElementById('winnerNameDisplay').innerText = state.currentUser.name;
    document.getElementById('wonPrizeName').innerText = product.name;
    document.getElementById('winnnerIcon').innerHTML = `<img src="${product.img}" width="100">`; // Use image

    document.getElementById('winnerModal').classList.add('active');

    // Save to History
    const winRecord = {
        name: state.currentUser.name,
        id: state.currentUser.id,
        prize: product.name,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };
    state.winners.unshift(winRecord);
    if (state.winners.length > 5) state.winners.pop();

    localStorage.setItem('gmd_winners', JSON.stringify(state.winners));
    // renderWinnerBoard(); // Removed
}

// --- Admin Functions ---
function openAdminPanel() {
    document.getElementById('adminPanel').classList.add('active');

    // Populate form
    state.products.forEach((prod, i) => {
        document.getElementById(`prod${i + 1}Name`).value = prod.name;
    });
}

function saveAdminChanges() {
    // Collect data
    const updates = [...state.products];
    const promises = [];

    for (let i = 0; i < 4; i++) {
        const nameInput = document.getElementById(`prod${i + 1}Name`).value;
        const imgInput = document.getElementById(`prod${i + 1}Img`).files[0];

        updates[i].name = nameInput;

        if (imgInput) {
            // Read file
            const p = new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    updates[i].img = e.target.result; // Base64
                    resolve();
                };
                reader.readAsDataURL(imgInput);
            });
            promises.push(p);
        }
    }

    Promise.all(promises).then(() => {
        state.products = updates;
        localStorage.setItem('gmd_products', JSON.stringify(state.products));

        // Reload images + redraw
        loadImages().then(() => {
            drawWheel();
            document.getElementById('adminPanel').classList.remove('active');
            alert("Settings Saved!");
        });
    });
}

// --- Sound Stub ---
// Shared AudioContext
let audioCtx = null;

function playSound(type) {
    // Web Audio API for sound generation without external files
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    // Initialize singleton context on first user interaction
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }

    // Ensure context is running (some browsers suspend it)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const ctx = audioCtx;

    if (type === 'win') {
        // Celebratory "Ta-Da!" Fanfare
        const now = ctx.currentTime;

        // Define a melody: C5, E5, G5, C6 (C Major Arpeggio)
        const notes = [
            { freq: 523.25, offset: 0.0, dur: 0.2 },  // C5
            { freq: 659.25, offset: 0.15, dur: 0.2 }, // E5
            { freq: 783.99, offset: 0.30, dur: 0.2 }, // G5
            { freq: 1046.50, offset: 0.45, dur: 0.8 } // C6 (Long completion)
        ];

        notes.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle'; // Softer, pleasant tone
            osc.frequency.value = note.freq;

            // Envelope
            gain.gain.setValueAtTime(0, now + note.offset);
            gain.gain.linearRampToValueAtTime(0.15, now + note.offset + 0.05); // Attack
            gain.gain.exponentialRampToValueAtTime(0.001, now + note.offset + note.dur); // Decay

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + note.offset);
            osc.stop(now + note.offset + note.dur);
        });

    } else if (type === 'spin') {
        // Mechanical "Tick" sound
        // Simulating a plastic flap hitting a peg
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Start high, drop fast (simulating impact knock)
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.04);

        // Very short, percussive envelope
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.type = 'triangle';

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }
}

function exportDataToExcel() {
    // We will generate a CSV which Excel can open
    // Columns: Name, ID, Prize, Time

    // We need to store ID in history too. 
    // Currently history only has name, prize, time.
    // Let's assume for future wins we store ID. For past wins, might be missing.

    let csvContent = "data:text/csv;charset=utf-8,Name,Membership ID,Prize,Time\n";

    state.winners.forEach(row => {
        // Ensure fields exist
        const name = row.name || "N/A";
        const id = row.id || "N/A";
        const prize = row.prize || "N/A";
        const time = row.time || "N/A";
        csvContent += `${name},${id},${prize},${time} \n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "daily_winners_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Start
// --- Premium Ribbon/Confetti Effect ---
const ribbonCanvas = document.getElementById('ribbonCanvas');
const ribbonCtx = ribbonCanvas.getContext('2d');
let ribbons = [];

const RIBBON_COUNT = 50;
const RIBBON_COLORS = ['#FFD700', '#FF0000', '#C0C0C0']; // Gold, Red, Silver accent

function initRibbons() {
    resizeRibbons();
    window.addEventListener('resize', resizeRibbons);

    ribbons = [];
    for (let i = 0; i < RIBBON_COUNT; i++) {
        ribbons.push(createRibbon());
    }

    animateRibbons();
}

function createRibbon() {
    return {
        x: Math.random() * ribbonCanvas.width,
        y: Math.random() * ribbonCanvas.height - ribbonCanvas.height, // Start above or random
        w: Math.random() * 8 + 5,
        h: Math.random() * 20 + 10,
        speedY: Math.random() * 2 + 1,
        speedX: Math.random() * 2 - 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5,
        color: RIBBON_COLORS[Math.floor(Math.random() * RIBBON_COLORS.length)],
        oscillation: Math.random() * Math.PI * 2
    };
}

function resizeRibbons() {
    ribbonCanvas.width = window.innerWidth;
    ribbonCanvas.height = window.innerHeight;
}

function animateRibbons() {
    ribbonCtx.clearRect(0, 0, ribbonCanvas.width, ribbonCanvas.height);

    ribbons.forEach(ribbon => {
        ribbon.y += ribbon.speedY;
        ribbon.x += Math.sin(ribbon.oscillation) * 2; // Sway effect
        ribbon.oscillation += 0.05;
        ribbon.rotation += ribbon.rotationSpeed;

        // Reset if out of view
        if (ribbon.y > ribbonCanvas.height) {
            ribbon.y = -50;
            ribbon.x = Math.random() * ribbonCanvas.width;
        }

        // Draw Ribbon
        ribbonCtx.save();
        ribbonCtx.translate(ribbon.x, ribbon.y);
        ribbonCtx.rotate(ribbon.rotation * Math.PI / 180);

        ribbonCtx.fillStyle = ribbon.color;

        // Shadow for depth
        ribbonCtx.shadowColor = 'rgba(0,0,0,0.3)';
        ribbonCtx.shadowBlur = 5;

        // Draw twisted ribbon shape (simplified as rectangle)
        ribbonCtx.fillRect(-ribbon.w / 2, -ribbon.h / 2, ribbon.w, ribbon.h);

        ribbonCtx.restore();
    });

    requestAnimationFrame(animateRibbons);
}

// Start
initRibbons();
init();
