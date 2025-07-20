// ===== APPLICATION STATE =====
let appState = {
    isCameraActive: false,
    isListening: false,
    isProcessingVideo: false,
    camera: null,
    hands: null,
    recognition: null,
    lastGesture: null,
    pendingGesture: null,
    pendingSpeech: null,
    chatHistory: [],
    videoGestures: [],
    currentPage: 'home',
    speechSettings: {
        rate: 1.0,
        volume: 1.0,
        lang: 'en-US'
    },
    debug: {
        mediaPipeLoaded: false,
        cameraStream: null,
        lastError: null
    }
};

// ===== DOM ELEMENTS =====
let elements = {};

function initializeElements() {
    elements = {
        // Start conversation
        startConversationBtn: document.getElementById('start-conversation'),
        
        // Main app
        mainApp: document.getElementById('main-app'),
        logoLink: document.getElementById('logo-link'),
        navLinks: document.querySelectorAll('.nav-link'),
        pageContents: document.querySelectorAll('.page-content'),
        
        // Video elements
        webcamFeed: document.getElementById('webcamFeed'),
        landmarkCanvas: document.getElementById('landmarkCanvas'),
        cameraPlaceholder: document.getElementById('camera-placeholder'),
        startCameraBtn: document.getElementById('start-camera'),
        stopCameraBtn: document.getElementById('stop-camera'),
        
        // Video upload elements
        liveCameraModeBtn: document.getElementById('live-camera-mode'),
        videoUploadModeBtn: document.getElementById('video-upload-mode'),
        liveCameraSection: document.getElementById('live-camera-section'),
        videoUploadSection: document.getElementById('video-upload-section'),
        videoUpload: document.getElementById('video-upload'),
        uploadDropzone: document.getElementById('upload-dropzone'),
        uploadedVideo: document.getElementById('uploadedVideo'),
        uploadLandmarkCanvas: document.getElementById('uploadLandmarkCanvas'),
        uploadedVideoWrapper: document.getElementById('uploaded-video-wrapper'),
        uploadControls: document.querySelector('.upload-controls'),
        processVideoBtn: document.getElementById('process-video'),
        clearVideoBtn: document.getElementById('clear-video'),
        processingStatus: document.getElementById('processing-status'),
        statusMessage: document.getElementById('status-message'),
        progressFill: document.getElementById('progress-fill'),
        
        // Gesture elements
        gestureStatus: document.getElementById('gestureStatus'),
        confidenceFill: document.getElementById('confidence-fill'),
        confidenceText: document.getElementById('confidence-text'),
        approveGestureBtn: document.getElementById('approve-gesture'),
        redoGestureBtn: document.getElementById('redo-gesture'),
        gestureDisplay: document.getElementById('pendingGestureApproval'),
        
        // Speech elements
        startListeningBtn: document.getElementById('start-listening'),
        stopListeningBtn: document.getElementById('stop-listening'),
        transcribedSpeech: document.getElementById('transcribedSpeech'),
        approveSpeechBtn: document.getElementById('approve-speech'),
        redoSpeechBtn: document.getElementById('redo-speech'),
        
        // Chat elements
        chatLog: document.getElementById('chatLog'),
        clearChatBtn: document.getElementById('clear-chat'),
        
        // Suggestion chips
        suggestionChips: document.getElementById('suggestionChips'),
        
        // Settings elements
        settingsToggle: document.getElementById('settings-toggle'),
        settingsContent: document.getElementById('settings-content'),
        speechRate: document.getElementById('speech-rate'),
        speechVolume: document.getElementById('speech-volume'),
        rateValue: document.getElementById('rate-value'),
        volumeValue: document.getElementById('volume-value')
    };
    
    console.log('Elements initialized:', Object.keys(elements).length, 'elements found');
    console.log('Navigation links found:', elements.navLinks.length);
    console.log('Page contents found:', elements.pageContents.length);
}

// ===== GESTURE RECOGNITION FUNCTIONS =====
function updateGestureStatus(message, type = 'info') {
    if (elements.gestureStatus) {
        elements.gestureStatus.textContent = message;
        elements.gestureStatus.className = `gesture-text ${type}`;
    }
}

function showGestureOptions(detectedGestures) {
    const gestureOptions = document.getElementById('gestureOptions');
    const gestureOptionsList = document.getElementById('gestureOptionsList');
    
    if (!gestureOptions || !gestureOptionsList) return;
    
    gestureOptionsList.innerHTML = '';
    
    if (detectedGestures && detectedGestures.length > 0) {
        gestureOptions.style.display = 'block';
        
        detectedGestures.forEach((gesture, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'gesture-option';
            optionDiv.innerHTML = `
                <span class="gesture-name">${gesture.name}</span>
                <span class="gesture-confidence">${Math.round(gesture.confidence * 100)}%</span>
                <button class="btn btn-sm btn-primary approve-gesture-btn" data-gesture="${gesture.name}" data-confidence="${gesture.confidence}">
                    <i class="fas fa-check"></i> Approve
                </button>
            `;
            gestureOptionsList.appendChild(optionDiv);
        });
        
        // Add event listeners to approve buttons
        document.querySelectorAll('.approve-gesture-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gestureName = e.target.closest('.approve-gesture-btn').getAttribute('data-gesture');
                const confidence = parseFloat(e.target.closest('.approve-gesture-btn').getAttribute('data-confidence'));
                approveSelectedGesture(gestureName, confidence);
            });
        });
    } else {
        gestureOptions.style.display = 'none';
    }
}

function approveSelectedGesture(gestureName, confidence) {
    // Add the approved gesture to chat
    addChatMessage(gestureName, 'gesture');
    
    // Speak the gesture
    speakText(gestureName);
    
    // Add to conversation context for predictions
    addToConversationContext(gestureName);
    
    // Hide gesture options
    const gestureOptions = document.getElementById('gestureOptions');
    if (gestureOptions) {
        gestureOptions.style.display = 'none';
    }
    
    // Update status
    updateGestureStatus(`Approved: ${gestureName}`, 'success');
    
    // Reset after a delay
    setTimeout(() => {
        updateGestureStatus('Perform a gesture to start chatting...', 'info');
    }, 2000);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    initializeApp();
});

function initializeApp() {
    console.log('Initializing SignSpeak AI...');
    
    // Initialize DOM elements first
    initializeElements();
    
    // Check if all required elements exist
    const missingElements = [];
    Object.entries(elements).forEach(([key, element]) => {
        if (!element) {
            missingElements.push(key);
        }
    });
    
    if (missingElements.length > 0) {
        console.error(`Missing DOM elements: ${missingElements.join(', ')}`);
        return;
    }
    
    setupEventListeners();
    checkMediaPipeLibraries();
    setupSpeechRecognition();
    initializeSettings();
    
    console.log('App initialized successfully');
    updateGestureStatus('Ready to start! Click "START CAMERA" to begin.', 'info');
    
    // Initialize predictions with default suggestions
    updatePredictions();
    
    // Show home page by default
    showPage('home');
    
    // Run simple test after a delay
    setTimeout(() => {
        console.log('=== AUTO TEST AFTER INITIALIZATION ===');
        testNavigationSimple();
    }, 1000);
}

function checkMediaPipeLibraries() {
    console.log('Checking MediaPipe libraries...');
    
    // Check if MediaPipe libraries are loaded
    const libraries = {
        'Hands': typeof Hands !== 'undefined',
        'Camera': typeof Camera !== 'undefined',
        'drawConnectors': typeof drawConnectors !== 'undefined',
        'HAND_CONNECTIONS': typeof HAND_CONNECTIONS !== 'undefined'
    };
    
    console.log('MediaPipe library status:', libraries);
    
    const allLoaded = Object.values(libraries).every(loaded => loaded);
    appState.debug.mediaPipeLoaded = allLoaded;
    
    if (allLoaded) {
        console.log('All MediaPipe libraries loaded successfully');
        setupMediaPipe();
    } else {
        console.error('Some MediaPipe libraries failed to load', libraries);
        updateGestureStatus('Loading gesture recognition...', 'info');
        // Retry after a delay
        setTimeout(checkMediaPipeLibraries, 2000);
    }
}

function setupEventListeners() {
    // Start conversation button
    if (elements.startConversationBtn) {
        elements.startConversationBtn.addEventListener('click', startConversation);
    }
    
    // Navigation
    if (elements.logoLink) {
        elements.logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Logo clicked, going to home');
            showPage('home');
        });
    }
    
    // Fix navigation event listeners
    if (elements.navLinks && elements.navLinks.length > 0) {
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                console.log('Nav link clicked:', page, 'from element:', link);
                if (page) {
                    showPage(page);
                } else {
                    console.error('No data-page attribute found on:', link);
                }
            });
        });
        console.log('Navigation event listeners attached to', elements.navLinks.length, 'links');
    } else {
        console.error('No navigation links found!');
    }
    
    // Camera controls
    if (elements.startCameraBtn) {
        elements.startCameraBtn.addEventListener('click', startCamera);
    }
    if (elements.stopCameraBtn) {
        elements.stopCameraBtn.addEventListener('click', stopCamera);
    }
    
    // Video upload mode switching
    if (elements.liveCameraModeBtn) {
        elements.liveCameraModeBtn.addEventListener('click', () => switchInputMode('camera'));
    }
    if (elements.videoUploadModeBtn) {
        elements.videoUploadModeBtn.addEventListener('click', () => switchInputMode('upload'));
    }
    
    // Video upload controls
    if (elements.uploadDropzone) {
        elements.uploadDropzone.addEventListener('click', () => elements.videoUpload.click());
        elements.uploadDropzone.addEventListener('dragover', handleDragOver);
        elements.uploadDropzone.addEventListener('drop', handleDrop);
    }
    if (elements.videoUpload) {
        elements.videoUpload.addEventListener('change', handleVideoUpload);
    }
    if (elements.processVideoBtn) {
        elements.processVideoBtn.addEventListener('click', processUploadedVideo);
    }
    if (elements.clearVideoBtn) {
        elements.clearVideoBtn.addEventListener('click', clearUploadedVideo);
    }
    
    // Speech controls
    elements.startListeningBtn.addEventListener('click', startListening);
    elements.stopListeningBtn.addEventListener('click', stopListening);
    
    // Approval and redo buttons
    elements.approveGestureBtn.addEventListener('click', approveGesture);
    elements.redoGestureBtn.addEventListener('click', redoGesture);
    elements.approveSpeechBtn.addEventListener('click', approveSpeech);
    elements.redoSpeechBtn.addEventListener('click', redoSpeech);
    
    // Chat controls
    elements.clearChatBtn.addEventListener('click', clearChat);
    
    // Prediction chips (handled by dynamic creation)
    
    // Test gesture button
    const testGestureBtn = document.getElementById('test-gesture');
    if (testGestureBtn) {
        testGestureBtn.addEventListener('click', testGestureRecognition);
    }
    
    // Test navigation button
    const testNavigationBtn = document.getElementById('test-navigation');
    if (testNavigationBtn) {
        testNavigationBtn.addEventListener('click', testNavigation);
    }
    
    // Simple test navigation button
    const testNavigationSimpleBtn = document.getElementById('test-navigation-simple');
    if (testNavigationSimpleBtn) {
        testNavigationSimpleBtn.addEventListener('click', testNavigationSimple);
    }
    
    // Settings controls
    elements.settingsToggle.addEventListener('click', toggleSettings);
    elements.speechRate.addEventListener('input', updateSpeechRate);
    elements.speechVolume.addEventListener('input', updateSpeechVolume);
    

    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

// ===== PAGE NAVIGATION =====
function startConversation() {
    console.log('Starting conversation...');
    showPage('conversation');
    
    // Initialize MediaPipe
    setupMediaPipe();
}

function showPage(pageId) {
    console.log('=== SHOWING PAGE ===');
    console.log('Page ID:', pageId);
    console.log('Navigation links found:', elements.navLinks ? elements.navLinks.length : 'undefined');
    console.log('Page contents found:', elements.pageContents ? elements.pageContents.length : 'undefined');
    
    if (!elements.navLinks || !elements.pageContents) {
        console.error('Navigation elements not found!');
        return;
    }
    
    // Update navigation active state
    elements.navLinks.forEach(link => {
        const linkPage = link.getAttribute('data-page');
        console.log('Nav link:', linkPage, 'Target:', pageId, 'Match:', linkPage === pageId);
        link.classList.remove('active');
        if (linkPage === pageId) {
            link.classList.add('active');
            console.log('✅ Set active nav link:', pageId);
        }
    });
    
    // Update page content visibility
    elements.pageContents.forEach(page => {
        const pageIdExpected = `${pageId}-page`;
        console.log('Page content:', page.id, 'Expected:', pageIdExpected, 'Match:', page.id === pageIdExpected);
        page.classList.remove('active');
        if (page.id === pageIdExpected) {
            page.classList.add('active');
            console.log('✅ Set active page:', pageId);
        }
    });
    
    appState.currentPage = pageId;
    console.log('=== PAGE SHOWN ===');
}

// ===== CAMERA FUNCTIONS =====
async function startCamera() {
    console.log('Starting camera...');
    updateGestureStatus('Starting camera...', 'info');
    
    try {
        elements.startCameraBtn.disabled = true;
        elements.startCameraBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting...';
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                width: 640, 
                height: 480, 
                facingMode: 'user',
                frameRate: { ideal: 30 }
            }
        });
        
        console.log('Camera stream obtained successfully');
        appState.debug.cameraStream = stream;
        
        elements.webcamFeed.srcObject = stream;
        elements.cameraPlaceholder.style.display = 'none';
        elements.webcamFeed.style.display = 'block';
        elements.landmarkCanvas.style.display = 'block';
        
        // Wait for video to be ready
        await new Promise((resolve) => {
            elements.webcamFeed.onloadedmetadata = () => {
                console.log('Video metadata loaded');
                resolve();
            };
        });
        
        elements.startCameraBtn.style.display = 'none';
        elements.stopCameraBtn.style.display = 'inline-flex';
        
        // Initialize MediaPipe camera
        if (appState.camera) {
            console.log('Starting MediaPipe camera...');
            appState.camera.start();
        } else {
            console.error('MediaPipe camera not initialized');
        }
        
        appState.isCameraActive = true;
        console.log('Camera started successfully');
        
        // Update gesture status
        updateGestureStatus('Camera active! Perform gestures to start chatting...', 'success');
        
    } catch (error) {
        console.error('Error starting camera', error);
        elements.startCameraBtn.disabled = false;
        elements.startCameraBtn.innerHTML = '<i class="fas fa-camera"></i> START CAMERA';
        
        if (error.name === 'NotAllowedError') {
            alert('Camera access denied. Please allow camera permissions and try again.');
            updateGestureStatus('Camera access denied. Please allow permissions.', 'error');
        } else if (error.name === 'NotFoundError') {
            alert('No camera found. Please check your camera connection.');
            updateGestureStatus('No camera found. Please check connection.', 'error');
        } else {
            alert(`Error accessing camera: ${error.message}`);
            updateGestureStatus('Camera error. Please try again.', 'error');
        }
    }
}

function stopCamera() {
    console.log('Stopping camera...');
    
    if (appState.camera) {
        appState.camera.stop();
    }
    
    if (elements.webcamFeed.srcObject) {
        const tracks = elements.webcamFeed.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        elements.webcamFeed.srcObject = null;
    }
    
    elements.webcamFeed.style.display = 'none';
    elements.landmarkCanvas.style.display = 'none';
    elements.cameraPlaceholder.style.display = 'flex';
    elements.stopCameraBtn.style.display = 'none';
    elements.startCameraBtn.style.display = 'inline-flex';
    elements.startCameraBtn.disabled = false;
    elements.startCameraBtn.innerHTML = '<i class="fas fa-camera"></i> START CAMERA';
    
    // Reset gesture display
    elements.gestureStatus.textContent = 'Camera stopped';
    elements.gestureDisplay.classList.remove('active');
    elements.confidenceFill.style.width = '0%';
    elements.confidenceText.textContent = '0%';
    elements.approveGestureBtn.disabled = true;
    
    appState.isCameraActive = false;
    appState.lastGesture = null;
    appState.pendingGesture = null;
}

// ===== MEDIAPIPE SETUP =====
function setupMediaPipe() {
    console.log('Setting up MediaPipe...');
    
    try {
        if (typeof Hands === 'undefined') {
            console.error('MediaPipe Hands not loaded');
            return;
        }
        
        appState.hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        
        appState.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        appState.hands.onResults(onHandResults);
        console.log('MediaPipe Hands initialized successfully');
        
        if (typeof Camera !== 'undefined') {
            appState.camera = new Camera(elements.webcamFeed, {
                onFrame: async () => {
                    if (appState.isCameraActive && appState.hands) {
                        try {
                            await appState.hands.send({ image: elements.webcamFeed });
                        } catch (error) {
                            console.error('Error sending frame to MediaPipe', error);
                        }
                    }
                },
                width: 640,
                height: 480
            });
            console.log('MediaPipe Camera initialized successfully');
        } else {
            console.error('MediaPipe Camera not available');
        }
    } catch (error) {
        console.error('Error setting up MediaPipe', error);
    }
}



// ===== GESTURE RECOGNITION =====
const GESTURE_LIBRARY = {
    // 20 Essential Gestures for Communication
    'hello': { name: "Hello", confidence: 0.9, description: "Open hand, palm facing out, moving slightly away from ear" },
    'yes': { name: "Yes", confidence: 0.9, description: "Fist with thumb extended upwards, moving up and down" },
    'no': { name: "No", confidence: 0.8, description: "Hand in pinching motion, opening and closing slightly" },
    'thank_you': { name: "Thank You", confidence: 0.85, description: "Flat hand, palm facing you, moving from chin outwards" },
    'thank_you_much': { name: "Thank You So Much", confidence: 0.85, description: "Thank you gesture with appreciative expression" },
    'please': { name: "Please", confidence: 0.8, description: "Flat hand, palm in, rubbing circular motion on chest" },
    'sorry': { name: "Sorry", confidence: 0.8, description: "Fist, thumb against chest, rubbing circular motion" },
    'help': { name: "Help", confidence: 0.85, description: "One flat hand supports fist of other hand, both moving upwards" },
    'water': { name: "Water", confidence: 0.8, description: "W handshape tapping chin" },
    'food': { name: "Food", confidence: 0.8, description: "Hand shaped as if holding food, bringing fingertips to mouth" },
    'stop': { name: "Stop", confidence: 0.9, description: "Open hand, palm facing forward, fingers together, pushing forward" },
    'my_name_is': { name: "My Name Is", confidence: 0.75, description: "Two fingers tap forehead, then point to self" },
    'dont_understand': { name: "I Don't Understand", confidence: 0.8, description: "Index finger pointing to forehead, wiggling side to side" },
    'good': { name: "Good", confidence: 0.85, description: "Touch fingertips to chin, then move hand down into palm" },
    'bad': { name: "Bad", confidence: 0.8, description: "Fingers touch chin, then hand flips downwards" },
    'bathroom': { name: "Bathroom", confidence: 0.8, description: "T handshape shaking side to side" },
    'i_am_fine': { name: "I Am Fine", confidence: 0.8, description: "Thumb touches chest, then hand moves forward" },
    'excuse_me': { name: "Excuse Me", confidence: 0.8, description: "Flat hand, palm up, drawing line across other palm" },
    'what': { name: "What", confidence: 0.8, description: "Open C shape hand, moving side to side" },
    'done': { name: "Done", confidence: 0.9, description: "Both hands flat, palms facing each other, then turning outwards" }
};

function recognizeGesture(landmarks) {
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerPips = [3, 6, 10, 14, 18];
    const wrist = landmarks[0];
    
    let extendedFingers = 0;
    let gestureConfidence = 0;
    
    // Check each finger extension
    for (let i = 0; i < fingerTips.length; i++) {
        const tip = landmarks[fingerTips[i]];
        const pip = landmarks[fingerPips[i]];
        
        if (i === 0) { // Thumb
            if (tip.x > pip.x) extendedFingers++;
        } else { // Other fingers
            if (tip.y < pip.y) extendedFingers++;
        }
    }
    
    // Enhanced gesture recognition with position and movement analysis
    const gestureResult = analyzeAdvancedGestures(landmarks, extendedFingers);
    
    if (gestureResult) {
        return gestureResult;
    }
    
    // Fallback to basic finger counting
    let gestureName = "Unknown";
    let isAmbiguous = false;
    
    switch (extendedFingers) {
        case 0:
            gestureName = "Fist";
            gestureConfidence = 0.9;
            break;
        case 1:
            gestureName = "One";
            gestureConfidence = 0.85;
            break;
        case 2:
            gestureName = "Two";
            gestureConfidence = 0.85;
            break;
        case 3:
            gestureName = "Three";
            gestureConfidence = 0.8;
            break;
        case 4:
            gestureName = "Four";
            gestureConfidence = 0.8;
            break;
        case 5:
            // Check if it's a "Hello" gesture (open palm)
            if (isPalmFacingOut(landmarks)) {
                gestureName = "Hello";
                gestureConfidence = 0.9;
            } else if (isStopGesture(landmarks)) {
                gestureName = "Stop";
                gestureConfidence = 0.9;
            } else {
                gestureName = "Five";
                gestureConfidence = 0.9;
            }
            break;
        default:
            gestureName = "Unknown";
            gestureConfidence = 0.3;
            isAmbiguous = true;
    }
    
    return { name: gestureName, confidence: gestureConfidence, isAmbiguous };
}

function analyzeAdvancedGestures(landmarks, extendedFingers) {
    console.log('Analyzing advanced gestures', { extendedFingers });
    
    // 1. Hello - Open palm facing out (5 fingers extended)
    if (extendedFingers === 5 && isPalmFacingOut(landmarks)) {
        return { name: "Hello", confidence: 0.9, isAmbiguous: false };
    }
    
    // 2. Yes - Thumbs up (only thumb extended)
    if (isThumbsUp(landmarks)) {
        return { name: "Yes", confidence: 0.9, isAmbiguous: false };
    }
    
    // 3. No - Index finger only (1 finger extended)
    if (extendedFingers === 1 && landmarks[8].y < landmarks[6].y) {
        return { name: "No", confidence: 0.8, isAmbiguous: false };
    }
    
    // 4. Thank You - Flat hand from chin outwards
    if (extendedFingers >= 4 && isNearChin(landmarks)) {
        return { name: "Thank You", confidence: 0.85, isAmbiguous: false };
    }
    
    // 5. Please - Hand near chest
    if (extendedFingers >= 3 && isNearChest(landmarks)) {
        return { name: "Please", confidence: 0.8, isAmbiguous: false };
    }
    
    // 6. Sorry - Fist (0 fingers extended)
    if (extendedFingers === 0 && isNearChest(landmarks)) {
        return { name: "Sorry", confidence: 0.8, isAmbiguous: false };
    }
    
    // 7. Help - Open hand near chest
    if (extendedFingers >= 4 && isNearChest(landmarks)) {
        return { name: "Help", confidence: 0.85, isAmbiguous: false };
    }
    
    // 8. Water - W handshape (3 fingers extended)
    if (extendedFingers === 3 && isWHandshape(landmarks)) {
        return { name: "Water", confidence: 0.8, isAmbiguous: false };
    }
    
    // 9. Food - Hand to mouth
    if (extendedFingers >= 3 && isNearMouth(landmarks)) {
        return { name: "Food", confidence: 0.8, isAmbiguous: false };
    }
    
    // 10. Stop - Open palm facing forward
    if (extendedFingers === 5 && isPalmFacingOut(landmarks)) {
        return { name: "Stop", confidence: 0.9, isAmbiguous: false };
    }
    
    // 11. I Don't Understand - Index finger at forehead
    if (extendedFingers === 1 && isNearForehead(landmarks)) {
        return { name: "I Don't Understand", confidence: 0.8, isAmbiguous: false };
    }
    
    // 12. Good - Thumbs up
    if (isThumbsUp(landmarks)) {
        return { name: "Good", confidence: 0.85, isAmbiguous: false };
    }
    
    // 13. Bad - Thumbs down (inverted thumbs up)
    if (extendedFingers === 1 && landmarks[4].y > landmarks[3].y) {
        return { name: "Bad", confidence: 0.8, isAmbiguous: false };
    }
    
    // 14. Bathroom - T handshape (2 fingers extended)
    if (extendedFingers === 2 && isNearChest(landmarks)) {
        return { name: "Bathroom", confidence: 0.8, isAmbiguous: false };
    }
    
    // 15. I Am Fine - Thumb touches chest
    if (extendedFingers === 1 && isNearChest(landmarks)) {
        return { name: "I Am Fine", confidence: 0.8, isAmbiguous: false };
    }
    
    // 16. Excuse Me - Hand near mouth
    if (extendedFingers >= 3 && isNearMouth(landmarks)) {
        return { name: "Excuse Me", confidence: 0.8, isAmbiguous: false };
    }
    
    // 17. What - C shape hand
    if (isCHandshape(landmarks)) {
        return { name: "What", confidence: 0.8, isAmbiguous: false };
    }
    
    // 18. Done - Both palms turning outwards (5 fingers extended)
    if (extendedFingers === 5 && isPalmFacingOut(landmarks)) {
        return { name: "Done", confidence: 0.9, isAmbiguous: false };
    }
    
    return null;
}

function isThumbsUp(landmarks) {
    const thumb_tip = landmarks[4];
    const thumb_ip = landmarks[3];
    const index_tip = landmarks[8];
    const middle_tip = landmarks[12];
    const ring_tip = landmarks[16];
    const pinky_tip = landmarks[20];
    
    // Thumb should be extended upward, other fingers curled
    const thumbUp = thumb_tip.y < thumb_ip.y;
    const othersCurled = index_tip.y > landmarks[6].y && 
                        middle_tip.y > landmarks[10].y && 
                        ring_tip.y > landmarks[14].y && 
                        pinky_tip.y > landmarks[18].y;
    
    return thumbUp && othersCurled;
}

// New gesture detection functions for the 20 essential gestures
function isHelloGesture(landmarks, extendedFingers) {
    // Open palm facing out, moving slightly away from ear
    return extendedFingers === 5 && isPalmFacingOut(landmarks);
}

function isNoGesture(landmarks, extendedFingers) {
    // Hand in pinching motion (thumb, index, and middle fingers together)
    const thumb_tip = landmarks[4];
    const index_tip = landmarks[8];
    const middle_tip = landmarks[12];
    const ring_tip = landmarks[16];
    const pinky_tip = landmarks[20];
    
    // Check if thumb, index, and middle are close together
    const pinchDistance = Math.sqrt(
        Math.pow(thumb_tip.x - index_tip.x, 2) + 
        Math.pow(thumb_tip.y - index_tip.y, 2)
    );
    
    const middlePinchDistance = Math.sqrt(
        Math.pow(thumb_tip.x - middle_tip.x, 2) + 
        Math.pow(thumb_tip.y - middle_tip.y, 2)
    );
    
    // Ring and pinky should be curled
    const othersCurled = ring_tip.y > landmarks[14].y && pinky_tip.y > landmarks[18].y;
    
    return pinchDistance < 0.1 && middlePinchDistance < 0.1 && othersCurled;
}

function isThankYouGesture(landmarks, extendedFingers) {
    // Flat hand, palm facing you, moving from chin outwards
    return extendedFingers === 5 && isNearChin(landmarks) && !isPalmFacingOut(landmarks);
}

function isPleaseGesture(landmarks, extendedFingers) {
    // Flat hand, palm in, rubbing circular motion on chest
    return extendedFingers === 5 && isHandFlat(landmarks) && isNearChest(landmarks);
}

function isSorryGesture(landmarks, extendedFingers) {
    // Fist, thumb against chest, rubbing circular motion
    return extendedFingers === 0 && isNearChest(landmarks);
}

function isHelpGesture(landmarks, extendedFingers) {
    // One flat hand supports fist of other hand, both moving upwards
    // Simplified: flat hand with some fingers extended
    return extendedFingers >= 3 && extendedFingers <= 4 && isHandFlat(landmarks);
}

function isFoodGesture(landmarks, extendedFingers) {
    // Hand shaped as if holding food, bringing fingertips to mouth
    return extendedFingers >= 2 && extendedFingers <= 4 && isNearMouth(landmarks);
}

function isDontUnderstandGesture(landmarks, extendedFingers) {
    // Index finger pointing to forehead, wiggling side to side
    const index_tip = landmarks[8];
    const index_pip = landmarks[6];
    const middle_tip = landmarks[12];
    const ring_tip = landmarks[16];
    const pinky_tip = landmarks[20];
    
    // Only index finger extended, pointing up
    const indexExtended = index_tip.y < index_pip.y;
    const othersCurled = middle_tip.y > landmarks[10].y && 
                        ring_tip.y > landmarks[14].y && 
                        pinky_tip.y > landmarks[18].y;
    
    return indexExtended && othersCurled && isNearForehead(landmarks);
}

function isGoodGesture(landmarks, extendedFingers) {
    // Touch fingertips to chin, then move hand down into palm
    return extendedFingers >= 3 && extendedFingers <= 5 && isNearChin(landmarks);
}

function isBadGesture(landmarks, extendedFingers) {
    // Fingers touch chin, then hand flips downwards
    return extendedFingers >= 3 && extendedFingers <= 5 && isNearChin(landmarks);
}

function isBathroomGesture(landmarks, extendedFingers) {
    // T handshape shaking side to side
    const thumb_tip = landmarks[4];
    const index_tip = landmarks[8];
    const middle_tip = landmarks[12];
    const ring_tip = landmarks[16];
    const pinky_tip = landmarks[20];
    
    // Thumb between index and middle finger
    const thumbBetween = thumb_tip.x > index_tip.x && thumb_tip.x < middle_tip.x;
    const othersCurled = ring_tip.y > landmarks[14].y && pinky_tip.y > landmarks[18].y;
    
    return thumbBetween && othersCurled;
}

function isIAmFineGesture(landmarks, extendedFingers) {
    // Thumb touches chest, then hand moves forward
    return extendedFingers >= 1 && extendedFingers <= 3 && isNearChest(landmarks);
}

function isExcuseMeGesture(landmarks, extendedFingers) {
    // Flat hand, palm up, drawing line across other palm
    return extendedFingers === 5 && isHandFlat(landmarks);
}

function isDoneGesture(landmarks, extendedFingers) {
    // Both hands flat, palms facing each other, then turning outwards
    // Simplified: flat hand with palm facing out
    return extendedFingers === 5 && isPalmFacingOut(landmarks);
}

// Helper functions for position detection
function isNearChest(landmarks) {
    const handCenter = landmarks[9]; // Middle finger MCP
    return handCenter.y > 0.4 && handCenter.y < 0.7; // Middle portion of frame
}

function isNearMouth(landmarks) {
    const handCenter = landmarks[9]; // Middle finger MCP
    return handCenter.y < 0.4; // Upper portion of frame
}

function isNearForehead(landmarks) {
    const handCenter = landmarks[9]; // Middle finger MCP
    return handCenter.y < 0.3; // Very upper portion of frame
}

function isPalmFacingOut(landmarks) {
    // Simplified check - in real implementation would use 3D landmarks
    const thumb = landmarks[4];
    const pinky = landmarks[20];
    const wrist = landmarks[0];
    
    // Basic heuristic: if thumb is to the right of pinky (for right hand)
    return Math.abs(thumb.x - pinky.x) > 0.1;
}

function isStopGesture(landmarks) {
    // All fingers extended and hand facing forward
    const fingerTips = [8, 12, 16, 20];
    const allExtended = fingerTips.every(tip => 
        landmarks[tip].y < landmarks[tip - 2].y
    );
    
    return allExtended && isPalmFacingOut(landmarks);
}

function isNearChin(landmarks) {
    // Simplified check - would need face landmarks in real implementation
    const handCenter = landmarks[9]; // Middle finger MCP
    return handCenter.y < 0.3; // Upper portion of frame
}

function isWHandshape(landmarks) {
    const index = landmarks[8];
    const middle = landmarks[12];
    const ring = landmarks[16];
    const pinky = landmarks[20];
    const thumb = landmarks[4];
    
    // W shape: index, middle, ring up; pinky and thumb down
    return index.y < landmarks[6].y && 
           middle.y < landmarks[10].y && 
           ring.y < landmarks[14].y && 
           pinky.y > landmarks[18].y && 
           thumb.y > landmarks[2].y;
}

function isCHandshape(landmarks) {
    const thumb = landmarks[4];
    const index = landmarks[8];
    
    // C shape: curved hand with thumb and index forming a C
    const thumbIndexDistance = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
    );
    
    return thumbIndexDistance > 0.1 && thumbIndexDistance < 0.3;
}

function isHandFlat(landmarks) {
    const fingerTips = [4, 8, 12, 16, 20];
    const knuckles = [2, 5, 9, 13, 17];
    
    // Check if all fingertips are roughly at the same level as knuckles
    let flatCount = 0;
    for (let i = 0; i < fingerTips.length; i++) {
        const tipY = landmarks[fingerTips[i]].y;
        const knuckleY = landmarks[knuckles[i]].y;
        if (Math.abs(tipY - knuckleY) < 0.05) {
            flatCount++;
        }
    }
    
    return flatCount >= 3;
}

function updateGestureDisplay(gestureResult) {
    // This function is now replaced by the new gesture options system
    // Keeping for backward compatibility
    console.log('Gesture detected:', gestureResult);
}

function approveGesture() {
    if (appState.pendingGesture) {
        console.log('Approving gesture:', appState.pendingGesture);
        speakText(appState.pendingGesture);
        addChatMessage(appState.pendingGesture, 'gesture');
        
        // Reset pending state
        appState.pendingGesture = null;
        elements.gestureStatus.textContent = 'Perform a gesture...';
        elements.gestureDisplay.classList.remove('active');
        elements.approveGestureBtn.disabled = true;
        elements.confidenceFill.style.width = '0%';
        elements.confidenceText.textContent = '0%';
    }
}

function redoGesture() {
    console.log('Redoing gesture...');
    appState.lastGesture = null;
    appState.pendingGesture = null;
    elements.gestureStatus.textContent = 'Perform a gesture...';
    elements.gestureDisplay.classList.remove('active');
    elements.approveGestureBtn.disabled = true;
    elements.confidenceFill.style.width = '0%';
    elements.confidenceText.textContent = '0%';
}

// ===== SPEECH RECOGNITION =====
function setupSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    appState.recognition = new SpeechRecognition();
    
    appState.recognition.continuous = false;
    appState.recognition.interimResults = true;
    appState.recognition.lang = appState.speechSettings.lang;
    
    appState.recognition.onstart = () => {
        console.log('Speech recognition started');
        elements.transcribedSpeech.textContent = 'Listening...';
        elements.transcribedSpeech.classList.add('listening');
    };
    
    appState.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        elements.transcribedSpeech.textContent = finalTranscript + interimTranscript;
        
        if (finalTranscript) {
            console.log('Final transcript:', finalTranscript);
            appState.pendingSpeech = finalTranscript.trim();
            elements.approveSpeechBtn.disabled = false;
        }
    };
    
    appState.recognition.onend = () => {
        console.log('Speech recognition ended');
        elements.transcribedSpeech.classList.remove('listening');
        elements.startListeningBtn.style.display = 'inline-flex';
        elements.stopListeningBtn.style.display = 'none';
        appState.isListening = false;
    };
    
    appState.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        elements.transcribedSpeech.textContent = 'Error: ' + event.error;
        elements.transcribedSpeech.classList.remove('listening');
    };
}

function startListening() {
    if (!appState.recognition) {
        alert('Speech recognition not available');
        return;
    }
    
    console.log('Starting speech recognition...');
    elements.startListeningBtn.style.display = 'none';
    elements.stopListeningBtn.style.display = 'inline-flex';
    appState.isListening = true;
    
    try {
        appState.recognition.start();
    } catch (error) {
        console.error('Error starting speech recognition:', error);
        elements.startListeningBtn.style.display = 'inline-flex';
        elements.stopListeningBtn.style.display = 'none';
        appState.isListening = false;
    }
}

function stopListening() {
    if (appState.recognition && appState.isListening) {
        console.log('Stopping speech recognition...');
        appState.recognition.stop();
    }
}

function approveSpeech() {
    if (appState.pendingSpeech) {
        console.log('Approving speech:', appState.pendingSpeech);
        addChatMessage(appState.pendingSpeech, 'speech');
        
        // Add speech words to conversation context
        const words = appState.pendingSpeech.toLowerCase().split(' ');
        words.forEach(word => {
            if (word.length > 0) {
                addToConversationContext(word);
            }
        });
        
        // Reset pending state
        appState.pendingSpeech = null;
        elements.transcribedSpeech.textContent = 'Click "Start Listening" to begin...';
        elements.approveSpeechBtn.disabled = true;
    }
}

function redoSpeech() {
    console.log('Redoing speech...');
    stopListening();
    appState.pendingSpeech = null;
    elements.transcribedSpeech.textContent = 'Click "Start Listening" to begin...';
    elements.approveSpeechBtn.disabled = true;
}

// ===== TEXT-TO-SPEECH =====
function speakText(text) {
    if (!text || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = appState.speechSettings.lang;
    utterance.rate = appState.speechSettings.rate;
    utterance.volume = appState.speechSettings.volume;
    utterance.pitch = 1.0;
    
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
    };
    
    speechSynthesis.speak(utterance);
}

// ===== CHAT FUNCTIONS =====
function addChatMessage(message, type) {
    const chatMessage = document.createElement('div');
    chatMessage.className = `chat-message ${type}-message`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    const icon = document.createElement('i');
    icon.className = `message-icon fas ${type === 'gesture' ? 'fa-hand-paper' : 'fa-microphone'}`;
    
    const text = document.createElement('span');
    text.className = 'message-text';
    text.textContent = type === 'gesture' ? `You: ${message}` : `Partner: ${message}`;
    
    bubble.appendChild(icon);
    bubble.appendChild(text);
    chatMessage.appendChild(bubble);
    
    // Add timestamp
    const timestampElement = document.createElement('div');
    timestampElement.className = 'message-timestamp';
    timestampElement.textContent = new Date().toLocaleTimeString();
    chatMessage.appendChild(timestampElement);
    
    // Remove welcome message if it exists
    const welcomeMessage = elements.chatLog.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    elements.chatLog.appendChild(chatMessage);
    elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
    
    // Add to history
    appState.chatHistory.push({
        message: message,
        type: type,
        timestamp: new Date().toISOString()
    });
    
    console.log(`Added ${type} message to chat:`, message);
}

function clearChat() {
    console.log('Clearing chat...');
    elements.chatLog.innerHTML = `
        <div class="welcome-message">
            <i class="fas fa-comments"></i>
            <p>Start your conversation using gestures or speech!</p>
        </div>
    `;
    appState.chatHistory = [];
}

// ===== OLD SUGGESTION SYSTEM REMOVED =====
// Replaced with smart word prediction system

// ===== SETTINGS =====
function initializeSettings() {
    elements.speechRate.value = appState.speechSettings.rate;
    elements.speechVolume.value = appState.speechSettings.volume;
    elements.rateValue.textContent = appState.speechSettings.rate.toFixed(1);
    elements.volumeValue.textContent = appState.speechSettings.volume.toFixed(1);
}

function toggleSettings() {
    const isVisible = elements.settingsContent.style.display === 'block';
    elements.settingsContent.style.display = isVisible ? 'none' : 'block';
}

function updateSpeechRate() {
    appState.speechSettings.rate = parseFloat(elements.speechRate.value);
    elements.rateValue.textContent = appState.speechSettings.rate.toFixed(1);
}

function updateSpeechVolume() {
    appState.speechSettings.volume = parseFloat(elements.speechVolume.value);
    elements.volumeValue.textContent = appState.speechSettings.volume.toFixed(1);
}

// ===== UTILITY FUNCTIONS =====
function handleVisibilityChange() {
    if (document.hidden && appState.isCameraActive) {
        console.log('Page hidden, pausing camera');
    } else if (!document.hidden && appState.isCameraActive) {
        console.log('Page visible, resuming camera');
    }
}

function cleanup() {
    console.log('Cleaning up...');
    if (appState.isCameraActive) {
        stopCamera();
    }
    if (appState.isListening) {
        stopListening();
    }
    if (window.speechSynthesis) {
        speechSynthesis.cancel();
    }
}

// ===== ERROR HANDLING =====
window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
});

// ===== VIDEO UPLOAD FUNCTIONALITY =====
function switchInputMode(mode) {
    if (mode === 'camera') {
        elements.liveCameraModeBtn.classList.add('active');
        elements.videoUploadModeBtn.classList.remove('active');
        elements.liveCameraSection.classList.add('active');
        elements.videoUploadSection.classList.remove('active');
        
        // Stop any video processing
        if (appState.isProcessingVideo) {
            stopVideoProcessing();
        }
    } else if (mode === 'upload') {
        elements.videoUploadModeBtn.classList.add('active');
        elements.liveCameraModeBtn.classList.remove('active');
        elements.videoUploadSection.classList.add('active');
        elements.liveCameraSection.classList.remove('active');
        
        // Stop camera if active
        if (appState.isCameraActive) {
            stopCamera();
        }
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadDropzone.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadDropzone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('video/')) {
            loadVideoFile(file);
        } else {
            alert('Please select a valid video file (MP4, MOV, AVI)');
        }
    }
}

function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        loadVideoFile(file);
    }
}

function loadVideoFile(file) {
    console.log('Loading video file:', file.name);
    
    const url = URL.createObjectURL(file);
    elements.uploadedVideo.src = url;
    
    elements.uploadDropzone.style.display = 'none';
    elements.uploadedVideoWrapper.style.display = 'block';
    elements.uploadControls.style.display = 'flex';
    
    // Clear previous processing status
    elements.processingStatus.style.display = 'none';
    elements.progressFill.style.width = '0%';
    
    console.log('Video file loaded successfully');
}

function clearUploadedVideo() {
    console.log('Clearing uploaded video');
    
    if (elements.uploadedVideo.src) {
        URL.revokeObjectURL(elements.uploadedVideo.src);
        elements.uploadedVideo.src = '';
    }
    
    elements.uploadDropzone.style.display = 'block';
    elements.uploadedVideoWrapper.style.display = 'none';
    elements.uploadControls.style.display = 'none';
    elements.processingStatus.style.display = 'none';
    elements.videoUpload.value = '';
    
    // Clear canvas
    const canvasCtx = elements.uploadLandmarkCanvas.getContext('2d');
    canvasCtx.clearRect(0, 0, elements.uploadLandmarkCanvas.width, elements.uploadLandmarkCanvas.height);
    
    appState.isProcessingVideo = false;
}

function processUploadedVideo() {
    if (!elements.uploadedVideo.src) {
        alert('No video file selected');
        return;
    }
    
    console.log('Starting video processing...');
    appState.isProcessingVideo = true;
    
    elements.processingStatus.style.display = 'block';
    elements.processVideoBtn.disabled = true;
    elements.statusMessage.textContent = 'Initializing video processing...';
    
    // Reset video to beginning
    elements.uploadedVideo.currentTime = 0;
    
    processVideoFrames();
}

async function processVideoFrames() {
    const video = elements.uploadedVideo;
    const canvas = elements.uploadLandmarkCanvas;
    const ctx = canvas.getContext('2d');
    
    const duration = video.duration;
    const frameRate = 10; // Process 10 frames per second
    const interval = 1 / frameRate;
    let currentTime = 0;
    let detectedGestures = [];
    
    elements.statusMessage.textContent = 'Processing video frames...';
    
    const processFrame = async () => {
        if (currentTime >= duration || !appState.isProcessingVideo) {
            // Processing complete
            finishVideoProcessing(detectedGestures);
            return;
        }
        
        video.currentTime = currentTime;
        
        // Wait for video to seek to the correct time
        await new Promise(resolve => {
            const onSeeked = () => {
                video.removeEventListener('seeked', onSeeked);
                resolve();
            };
            video.addEventListener('seeked', onSeeked);
        });
        
        // Process current frame
        if (appState.hands) {
            try {
                await appState.hands.send({ image: video });
                
                // Update progress
                const progress = (currentTime / duration) * 100;
                elements.progressFill.style.width = `${progress}%`;
                elements.statusMessage.textContent = `Processing... ${Math.round(progress)}%`;
                
                currentTime += interval;
                
                // Process next frame after a short delay
                setTimeout(processFrame, 100);
            } catch (error) {
                console.error('Error processing frame:', error);
                currentTime += interval;
                setTimeout(processFrame, 100);
            }
        } else {
            console.warn('MediaPipe not initialized');
            finishVideoProcessing([]);
        }
    };
    
    // Start processing
    processFrame();
}

function finishVideoProcessing(detectedGestures) {
    console.log('Video processing complete. Detected gestures:', detectedGestures);
    
    elements.statusMessage.textContent = 'Processing complete!';
    elements.progressFill.style.width = '100%';
    elements.processVideoBtn.disabled = false;
    appState.isProcessingVideo = false;
    
    // Generate speech from detected gestures
    if (detectedGestures.length > 0) {
        const gestureText = detectedGestures.join(' ');
        addChatMessage(`Video Analysis: ${gestureText}`, 'gesture');
        speakText(gestureText);
    } else {
        addChatMessage('Video processed - no clear gestures detected', 'gesture');
        speakText('Video processed but no clear gestures were detected');
    }
    
    setTimeout(() => {
        elements.processingStatus.style.display = 'none';
    }, 3000);
}

function stopVideoProcessing() {
    appState.isProcessingVideo = false;
    elements.processingStatus.style.display = 'none';
    elements.processVideoBtn.disabled = false;
}

// Enhanced onHandResults for video processing
function onHandResults(results) {
    try {
        const canvasCtx = elements.landmarkCanvas.getContext('2d');
        if (!canvasCtx) {
            console.error('Could not get canvas context');
            return;
        }
        
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, elements.landmarkCanvas.width, elements.landmarkCanvas.height);
        
        if (results.image) {
            canvasCtx.drawImage(results.image, 0, 0, elements.landmarkCanvas.width, elements.landmarkCanvas.height);
        }
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            console.log(`Processing ${results.multiHandLandmarks.length} hand(s)`);
            
            const detectedGestures = [];
            
            for (const landmarks of results.multiHandLandmarks) {
                if (typeof drawConnectors !== 'undefined' && typeof HAND_CONNECTIONS !== 'undefined') {
                    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FFFF', lineWidth: 5 });
                    drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
                }
                
                const gestureResult = recognizeGesture(landmarks);
                console.log('Gesture recognized:', gestureResult);
                
                // Show all gestures with confidence > 0.3 for debugging
                if (gestureResult.confidence > 0.3) {
                    detectedGestures.push(gestureResult);
                    console.log('Added gesture to detected list:', gestureResult.name, 'confidence:', gestureResult.confidence);
                }
                
                // If processing uploaded video, collect gesture data
                if (appState.isProcessingVideo) {
                    if (!gestureResult.isAmbiguous && gestureResult.confidence > 0.7) {
                        // Store gesture with timestamp
                        const currentTime = elements.uploadedVideo ? elements.uploadedVideo.currentTime : 0;
                        appState.videoGestures = appState.videoGestures || [];
                        appState.videoGestures.push({
                            time: currentTime,
                            gesture: gestureResult.name,
                            confidence: gestureResult.confidence
                        });
                    }
                }
            }
            
            // Show gesture options if gestures are detected
            if (detectedGestures.length > 0) {
                console.log('Showing gesture options:', detectedGestures);
                showGestureOptions(detectedGestures);
                updateGestureStatus('Gestures detected! Choose one to approve:', 'success');
            } else {
                updateGestureStatus('Perform a gesture to start chatting...', 'info');
            }
        } else {
            console.log('No hands detected');
            updateGestureStatus('No hand detected. Please position your hand in the camera view.', 'info');
        }
        
        canvasCtx.restore();
    } catch (error) {
        console.error('Error in onHandResults', error);
    }
}

// Old suggestion system removed - replaced with smart predictions

// Check if MediaPipe libraries are loaded
window.addEventListener('load', () => {
    if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
        console.error('MediaPipe libraries failed to load');
        if (elements.startCameraBtn) {
            elements.startCameraBtn.disabled = true;
            elements.startCameraBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Libraries not loaded';
        }
    } else {
        // Initialize predictions when libraries are loaded
        updatePredictions();
    }
});

// Test function for gesture recognition
function testGestureRecognition() {
    console.log('Testing gesture recognition...');
    
    if (!appState.hands) {
        console.error('MediaPipe Hands not initialized');
        return;
    }
    
    if (!elements.webcamFeed.srcObject) {
        console.error('No camera stream available');
        return;
    }
    
    // Manually trigger a frame processing
    try {
        appState.hands.send({ image: elements.webcamFeed }).then(() => {
            console.log('Test frame sent to MediaPipe');
        }).catch(error => {
            console.error('Error sending test frame', error);
        });
    } catch (error) {
        console.error('Error in test gesture recognition', error);
    }
}

// ===== SMART WORD PREDICTION SYSTEM =====
const PREDICTION_MODELS = {
    // Common conversation patterns
    'hello': ['how', 'are', 'you', 'doing', 'today', 'nice', 'to', 'meet'],
    'how': ['are', 'you', 'doing', 'is', 'it', 'going', 'was', 'your'],
    'are': ['you', 'doing', 'okay', 'fine', 'good', 'well', 'ready'],
    'you': ['doing', 'okay', 'fine', 'good', 'well', 'ready', 'need', 'want'],
    'thank': ['you', 'so', 'much', 'for', 'your', 'help', 'time'],
    'please': ['help', 'me', 'can', 'you', 'show', 'tell', 'explain'],
    'help': ['me', 'please', 'I', 'need', 'you', 'can', 'you'],
    'I': ['need', 'want', 'am', 'will', 'can', 'would', 'like'],
    'need': ['help', 'water', 'food', 'bathroom', 'assistance', 'support'],
    'want': ['to', 'go', 'eat', 'drink', 'rest', 'talk', 'learn'],
    'good': ['morning', 'afternoon', 'evening', 'night', 'bye', 'thank', 'you'],
    'bad': ['day', 'news', 'luck', 'weather', 'feeling', 'situation'],
    'yes': ['I', 'am', 'will', 'can', 'do', 'that', 'please'],
    'no': ['thank', 'you', 'I', 'am', 'not', 'sorry', 'problem'],
    'sorry': ['for', 'the', 'trouble', 'inconvenience', 'delay', 'mistake'],
    'water': ['please', 'I', 'need', 'drink', 'thirsty', 'hot'],
    'food': ['please', 'I', 'am', 'hungry', 'eat', 'lunch', 'dinner'],
    'bathroom': ['please', 'where', 'is', 'the', 'I', 'need', 'to'],
    'stop': ['please', 'that', 'enough', 'I', 'don\'t', 'want', 'to'],
    'done': ['thank', 'you', 'finished', 'complete', 'good', 'bye'],
    'what': ['is', 'that', 'are', 'you', 'doing', 'time', 'name'],
    'fine': ['thank', 'you', 'I', 'am', 'doing', 'well', 'good'],
    'excuse': ['me', 'please', 'sorry', 'for', 'the', 'trouble'],
    
    // Default suggestions for any word
    'default': ['thank', 'you', 'please', 'yes', 'no', 'good', 'bad', 'help', 'water', 'food', 'bathroom', 'stop', 'done', 'what', 'fine', 'excuse', 'me']
};

// Conversation context tracking
let conversationContext = [];
let lastWords = [];

function updatePredictions(lastWord = null) {
    const predictionChips = document.getElementById('predictionChips');
    if (!predictionChips) return;
    
    // Clear existing predictions
    predictionChips.innerHTML = '';
    
    // Get predictions based on last word or conversation context
    let predictions = [];
    
    if (lastWord && PREDICTION_MODELS[lastWord.toLowerCase()]) {
        predictions = PREDICTION_MODELS[lastWord.toLowerCase()];
    } else if (conversationContext.length > 0) {
        // Use context from recent conversation
        const recentWords = conversationContext.slice(-3);
        for (const word of recentWords) {
            if (PREDICTION_MODELS[word.toLowerCase()]) {
                predictions = [...predictions, ...PREDICTION_MODELS[word.toLowerCase()]];
            }
        }
    }
    
    // If no specific predictions, use default
    if (predictions.length === 0) {
        predictions = PREDICTION_MODELS['default'];
    }
    
    // Remove duplicates and limit to 5 predictions
    predictions = [...new Set(predictions)].slice(0, 5);
    
    // Create prediction chips
    predictions.forEach((prediction, index) => {
        const chip = document.createElement('span');
        chip.className = `prediction-chip ${index === 0 ? '' : 'secondary'}`;
        chip.textContent = prediction;
        chip.addEventListener('click', () => {
            selectPrediction(prediction);
        });
        predictionChips.appendChild(chip);
    });
}

function selectPrediction(prediction) {
    // Add the predicted word to chat
    addChatMessage(prediction, 'gesture');
    
    // Speak the prediction
    speakText(prediction);
    
    // Update context
    conversationContext.push(prediction);
    if (conversationContext.length > 10) {
        conversationContext.shift(); // Keep only last 10 words
    }
    
    // Update predictions for next word
    updatePredictions(prediction);
    
    console.log('Selected prediction:', prediction);
}

function addToConversationContext(word) {
    conversationContext.push(word);
    if (conversationContext.length > 10) {
        conversationContext.shift();
    }
    
    // Update predictions after adding new word
    updatePredictions(word);
}

// ===== SIMPLE NAVIGATION TEST =====
function testNavigationSimple() {
    console.log('=== SIMPLE NAVIGATION TEST ===');
    
    // Test 1: Check if elements exist
    console.log('1. Checking elements...');
    console.log('navLinks found:', elements.navLinks ? elements.navLinks.length : 'NOT FOUND');
    console.log('pageContents found:', elements.pageContents ? elements.pageContents.length : 'NOT FOUND');
    
    // Test 2: List all nav links
    if (elements.navLinks) {
        console.log('2. Navigation links:');
        elements.navLinks.forEach((link, index) => {
            console.log(`   ${index + 1}. ${link.textContent} -> data-page="${link.getAttribute('data-page')}"`);
        });
    }
    
    // Test 3: List all page contents
    if (elements.pageContents) {
        console.log('3. Page contents:');
        elements.pageContents.forEach((page, index) => {
            console.log(`   ${index + 1}. ${page.id} -> classes: "${page.className}"`);
        });
    }
    
    // Test 4: Try to show each page
    console.log('4. Testing page switching...');
    ['home', 'about', 'conversation', 'awareness'].forEach(page => {
        console.log(`   Testing ${page}...`);
        showPage(page);
        
        // Check if page is visible
        const pageElement = document.getElementById(`${page}-page`);
        if (pageElement) {
            const isVisible = pageElement.classList.contains('active');
            console.log(`   ${page} visible: ${isVisible}`);
        } else {
            console.log(`   ${page} element not found!`);
        }
    });
    
    console.log('=== TEST COMPLETE ===');
}

// ===== TESTING FUNCTIONS =====
function testNavigation() {
    console.log('Testing navigation...');
    console.log('Current page:', appState.currentPage);
    console.log('Available pages:', ['home', 'about', 'conversation', 'awareness']);
    
    // Test each page
    ['home', 'about', 'conversation', 'awareness'].forEach(page => {
        console.log(`Testing navigation to ${page}...`);
        showPage(page);
        setTimeout(() => {
            console.log(`Page ${page} should now be visible`);
        }, 100);
    });
}

function testBasicGestureRecognition() {
    console.log('Testing basic gesture recognition...');
    
    // Create mock landmarks for testing
    const mockLandmarks = [];
    for (let i = 0; i < 21; i++) {
        mockLandmarks.push({ x: 0.5, y: 0.5, z: 0 });
    }
    
    // Test basic finger counting
    const result = recognizeGesture(mockLandmarks);
    console.log('Basic test result:', result);
    
    return result;
}

// Test on page load
window.addEventListener('load', () => {
    setTimeout(() => {
        testBasicGestureRecognition();
    }, 2000);
});

// ===== GLOBAL TEST FUNCTION (for browser console) =====
window.testNav = function(pageName) {
    console.log(`Manually testing navigation to: ${pageName}`);
    showPage(pageName);
    
    // Check result
    const pageElement = document.getElementById(`${pageName}-page`);
    if (pageElement) {
        const isVisible = pageElement.classList.contains('active');
        console.log(`${pageName} page visible: ${isVisible}`);
        console.log(`${pageName} page classes: "${pageElement.className}"`);
    } else {
        console.log(`${pageName} page element not found!`);
    }
};

// Usage: testNav('home'), testNav('about'), testNav('conversation'), testNav('awareness')