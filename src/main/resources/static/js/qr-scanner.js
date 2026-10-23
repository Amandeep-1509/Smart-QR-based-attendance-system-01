/**
 * Smart QR-Based Attendance - Continuous "Scan & Pass" Scanner Script
 *
 * Core Workflow:
 * 1. Initializes camera using Html5Qrcode scanner.
 * 2. Continuously reads video frames.
 * 3. When a QR is detected:
 *    - Pauses recognition briefly to prevent duplicate rapid-firing.
 *    - Synthesizes an audio beep via Web Audio API.
 *    - Automatically sends AJAX POST to /attendance/api/scan.
 *    - Displays instant visual card (Green for Present, Golden for Already Marked).
 *    - Dynamically prepends student to the live attendance feed on the page.
 *    - Automatically resumes camera scanning for the next student without any button click!
 */

let html5QrCode = null;
let isProcessing = false;
let lastScannedId = null;
let lastScanTime = 0;
const SCAN_COOLDOWN_MS = 2500; // 2.5 seconds cooldown between identical scans

// Web Audio API Beep Generator (no external audio files required)
function playBeep(isSuccess) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (isSuccess) {
            // Pleasant higher-pitch double chime for Present
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
        } else {
            // Lower tone for duplicate / already marked
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.25);
        }
    } catch (e) {
        console.warn("Audio playback not allowed or not supported:", e);
    }
}

// Callback triggered whenever Html5Qrcode decodes text from camera
function onScanSuccess(decodedText, decodedResult) {
    const now = Date.now();
    const cleanId = decodedText.trim();

    // Check throttle to avoid repeated calls for the same QR held in front of camera
    if (isProcessing) return;
    if (cleanId === lastScannedId && (now - lastScanTime) < SCAN_COOLDOWN_MS) {
        return;
    }

    isProcessing = true;
    lastScannedId = cleanId;
    lastScanTime = now;

    const classSession = document.getElementById("classSessionSelect") 
        ? document.getElementById("classSessionSelect").value 
        : "Regular";

    updateStatusUI("processing", "Processing QR Code: " + cleanId + "...", "", "");

    // Send asynchronous AJAX request to Spring Boot backend
    const formData = new FormData();
    formData.append("studentId", cleanId);
    formData.append("classSession", classSession);

    fetch("/attendance/api/scan", {
        method: "POST",
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Server returned HTTP " + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.status === "PRESENT" && !data.alreadyMarked) {
            // Newly marked Present
            playBeep(true);
            updateStatusUI(
                "success",
                "QR DETECTED ✓",
                data.studentName + " (Roll No: " + data.rollNo + ")",
                "Attendance: PRESENT ✓ | Time: " + data.time + " | Ready for next scan..."
            );
            addStudentToLiveFeed(data);
            incrementCounter();
        } else if (data.alreadyMarked) {
            // Duplicate Protection triggered
            playBeep(false);
            updateStatusUI(
                "duplicate",
                "ATTENDANCE ALREADY MARKED ✓",
                data.studentName + " (Roll No: " + data.rollNo + ")",
                "Already marked at " + data.time + " | Ready for next scan..."
            );
        } else {
            // Error (e.g. Student ID not found in database)
            updateStatusUI(
                "error",
                "SCAN ERROR ✗",
                data.message,
                "Ready for next scan..."
            );
        }
    })
    .catch(err => {
        console.error("Attendance scan failed:", err);
        updateStatusUI("error", "Network / Server Error", "Could not record attendance. Please try again.", "");
    })
    .finally(() => {
        // Automatically unlock scanner for the next student after short pause
        setTimeout(() => {
            isProcessing = false;
        }, 1200);
    });
}

// Update the visual status box below the camera
function updateStatusUI(type, title, subtitle, details) {
    const statusCard = document.getElementById("scannerStatusCard");
    const statusTitle = document.getElementById("statusTitle");
    const statusSubtitle = document.getElementById("statusSubtitle");
    const statusDetails = document.getElementById("statusDetails");

    if (!statusCard) return;

    statusCard.className = "scanner-status-card status-" + type;
    statusTitle.innerHTML = title;
    statusSubtitle.innerHTML = subtitle || "";
    statusDetails.innerHTML = details || "";
}

// Add the newly marked student row into the live side table
function addStudentToLiveFeed(data) {
    const tbody = document.getElementById("liveAttendanceBody");
    const emptyRow = document.getElementById("emptyFeedRow");

    if (emptyRow) {
        emptyRow.remove();
    }

    if (tbody) {
        const newRow = document.createElement("tr");
        newRow.style.backgroundColor = "var(--soft-green-bg)";
        newRow.innerHTML = `
            <td><strong>${data.rollNo}</strong></td>
            <td><strong>${data.studentName}</strong></td>
            <td>${data.className}</td>
            <td><span class="badge badge-present">PRESENT</span></td>
            <td><small>${data.time}</small></td>
        `;
        tbody.insertBefore(newRow, tbody.firstChild);

        // Fade background back to normal after 2 seconds
        setTimeout(() => {
            newRow.style.transition = "background-color 1s ease";
            newRow.style.backgroundColor = "transparent";
        }, 2000);
    }
}

// Increment live attendee count badge
function incrementCounter() {
    const counter = document.getElementById("totalScannedCount");
    if (counter) {
        let count = parseInt(counter.innerText, 10) || 0;
        counter.innerText = count + 1;
    }
}

// Start Camera using Html5Qrcode library
function startScanner() {
    const qrRegionId = "reader";
    html5QrCode = new Html5Qrcode(qrRegionId);

    const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };

    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        (errorMessage) => {
            // Ignore frame-by-frame non-detection noise
        }
    ).catch(err => {
        console.warn("Camera start failed, falling back to any available video input:", err);
        // Fallback: list cameras and pick the first one
        Html5Qrcode.getCameras().then(cameras => {
            if (cameras && cameras.length) {
                html5QrCode.start(cameras[0].id, config, onScanSuccess, () => {});
            } else {
                updateStatusUI("error", "No Camera Detected", "Please connect a webcam or enable camera permissions in your browser.", "");
            }
        }).catch(camErr => {
            updateStatusUI("error", "Camera Permission Denied", "Please allow camera access in browser settings to scan QR codes.", "");
        });
    });
}

// Manual Test Scan (useful when camera is unavailable on test machine)
function simulateManualScan() {
    const manualInput = document.getElementById("manualQrInput");
    if (manualInput && manualInput.value.trim()) {
        onScanSuccess(manualInput.value.trim(), null);
        manualInput.value = "";
    }
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("reader")) {
        startScanner();
    }
});
