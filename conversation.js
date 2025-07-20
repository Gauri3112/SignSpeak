// ===== CONVERSATION PAGE SPECIFIC SCRIPT =====

// Application state for conversation page
let appState = {
    isCameraActive: false,
    isListening: false,
    camera: null,
    hands: null,
    recognition: null,
    lastGesture: null,
    pendingGesture: null,
    pendingSpeech: null,
    chatHistory: [],
    speechSettings: {
        rate: 1.0,
        volume: 1.0,
        lang: 'en-US'
    }
};

// DOM elements
let elements = {};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Conversation page loaded, initializing...');
    initializeConversationPage();
});

function initializeConversationPage() {
    // Initialize DOM elements
    initializeElements();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check MediaPipe libraries
    checkMediaPipeLibraries();
    
    // Setup speech recognition
    setupSpeechRecognition();
    
    // Initialize predictions
    updatePredictions();
    
    console.log('Conversation page initialized successfully');
}

function initializeElements() {
    elements = {
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
        
        // Settings elements
        settingsToggle: document.getElementById('settings-toggle'),
        settingsContent: document.getElementById('settings-content'),
        speechRate: document.getElementById('speech-rate'),
        speechVolume: document.getElementById('speech-volume'),
        rateValue: document.getElementById('rate-value'),
        volumeValue: document.getElementById('volume-value')
    };
    
    console.log('Elements initialized:', Object.keys(elements).length, 'elements found');
}

function setupEventListeners() {
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
    if (elements.startListeningBtn) {
        elements.startListeningBtn.addEventListener('click', startListening);
    }
    if (elements.stopListeningBtn) {
        elements.stopListeningBtn.addEventListener('click', stopListening);
    }
    
    // Approval and redo buttons
    if (elements.approveGestureBtn) {
        elements.approveGestureBtn.addEventListener('click', approveGesture);
    }
    if (elements.redoGestureBtn) {
        elements.redoGestureBtn.addEventListener('click', redoGesture);
    }
    if (elements.approveSpeechBtn) {
        elements.approveSpeechBtn.addEventListener('click', approveSpeech);
    }
    if (elements.redoSpeechBtn) {
        elements.redoSpeechBtn.addEventListener('click', redoSpeech);
    }
    
    // Chat controls
    if (elements.clearChatBtn) {
        elements.clearChatBtn.addEventListener('click', clearChat);
    }
    
    // Test gesture button
    const testGestureBtn = document.getElementById('test-gesture');
    if (testGestureBtn) {
        testGestureBtn.addEventListener('click', testGestureRecognition);
    }
    
    // Settings controls
    if (elements.settingsToggle) {
        elements.settingsToggle.addEventListener('click', toggleSettings);
    }
    if (elements.speechRate) {
        elements.speechRate.addEventListener('input', updateSpeechRate);
    }
    if (elements.speechVolume) {
        elements.speechVolume.addEventListener('input', updateSpeechVolume);
    }
    
    console.log('Event listeners attached successfully');
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
function checkMediaPipeLibraries() {
    console.log('Checking MediaPipe libraries...');
    
    const libraries = {
        'Hands': typeof Hands !== 'undefined',
        'Camera': typeof Camera !== 'undefined',
        'drawConnectors': typeof drawConnectors !== 'undefined',
        'HAND_CONNECTIONS': typeof HAND_CONNECTIONS !== 'undefined'
    };
    
    console.log('MediaPipe library status:', libraries);
    
    const allLoaded = Object.values(libraries).every(loaded => loaded);
    
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
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
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
            
            for (const landmarks of results.multiHandLandmarks) {
                if (typeof drawConnectors !== 'undefined' && typeof HAND_CONNECTIONS !== 'undefined') {
                    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FFFF', lineWidth: 5 });
                    drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
                }
                
                const gestureResult = recognizeGesture(landmarks);
                console.log('Gesture recognized:', gestureResult);
                
                if (gestureResult.confidence > 0.75) {
                    updateGestureDisplay(gestureResult);
                }
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

function recognizeGesture(landmarks) {
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerPips = [3, 6, 10, 14, 18];
    const fingerMcps = [2, 5, 9, 13, 17];
    
    let extendedFingers = 0;
    let fingerStates = [];
    
    // Enhanced finger detection with better accuracy
    for (let i = 0; i < fingerTips.length; i++) {
        const tip = landmarks[fingerTips[i]];
        const pip = landmarks[fingerPips[i]];
        const mcp = landmarks[fingerMcps[i]];
        
        let isExtended = false;
        
        if (i === 0) { // Thumb - check horizontal position with better detection
            // For thumb, check if it's extended horizontally (pointing sideways)
            const thumbExtended = tip.x > pip.x;
            const thumbUp = tip.y < pip.y; // Thumb pointing up
            const thumbDown = tip.y > pip.y; // Thumb pointing down
            
            isExtended = thumbExtended;
            fingerStates.push({ extended: isExtended, up: thumbUp, down: thumbDown });
        } else { // Other fingers - check vertical position
            isExtended = tip.y < pip.y && pip.y < mcp.y;
            fingerStates.push({ extended: isExtended, up: false, down: false });
        }
        
        if (isExtended) extendedFingers++;
    }
    
    // Enhanced gesture recognition with specific thumb detection
    let gestureName = "Unknown";
    let gestureConfidence = 0.3;
    let chatMessage = "";
    
    // Check for specific gesture patterns
    if (fingerStates[0].extended && !fingerStates[1].extended && !fingerStates[2].extended && !fingerStates[3].extended && !fingerStates[4].extended) {
        // Only thumb extended - check direction
        if (fingerStates[0].up) {
            gestureName = "Thumbs Up";
            gestureConfidence = 0.95;
            chatMessage = "Yes, that's great! 👍";
        } else if (fingerStates[0].down) {
            gestureName = "Thumbs Down";
            gestureConfidence = 0.95;
            chatMessage = "No, that's not good 👎";
        } else {
            gestureName = "Thumb Extended";
            gestureConfidence = 0.9;
            chatMessage = "I see your thumb!";
        }
    } else if (!fingerStates[0].extended && fingerStates[1].extended && fingerStates[2].extended && !fingerStates[3].extended && !fingerStates[4].extended) {
        // Index and middle finger only (peace sign)
        gestureName = "Peace Sign";
        gestureConfidence = 0.95;
        chatMessage = "Peace and love! ✌️";
    } else if (!fingerStates[0].extended && fingerStates[1].extended && !fingerStates[2].extended && !fingerStates[3].extended && !fingerStates[4].extended) {
        // Only index finger extended
        gestureName = "Pointing";
        gestureConfidence = 0.9;
        chatMessage = "I understand, please continue.";
    } else if (fingerStates[0].extended && fingerStates[1].extended && !fingerStates[2].extended && !fingerStates[3].extended && !fingerStates[4].extended) {
        // Thumb and index finger
        gestureName = "Gun Sign";
        gestureConfidence = 0.9;
        chatMessage = "Bang! 🔫";
    } else if (fingerStates[0].extended && fingerStates[1].extended && fingerStates[2].extended && !fingerStates[3].extended && !fingerStates[4].extended) {
        // Three fingers (thumb, index, middle)
        gestureName = "Three";
        gestureConfidence = 0.85;
        chatMessage = "I see three fingers!";
    } else if (fingerStates[0].extended && fingerStates[1].extended && fingerStates[2].extended && fingerStates[3].extended && !fingerStates[4].extended) {
        // Four fingers
        gestureName = "Four";
        gestureConfidence = 0.85;
        chatMessage = "Four fingers detected!";
    } else if (fingerStates[0].extended && fingerStates[1].extended && fingerStates[2].extended && fingerStates[3].extended && fingerStates[4].extended) {
        // All fingers extended
        gestureName = "Open Hand";
        gestureConfidence = 0.95;
        chatMessage = "Hello! How are you today? 👋";
    } else if (!fingerStates[0].extended && !fingerStates[1].extended && !fingerStates[2].extended && !fingerStates[3].extended && !fingerStates[4].extended) {
        // No fingers extended
        gestureName = "Fist";
        gestureConfidence = 0.9;
        chatMessage = "I see a closed fist.";
    } else if (fingerStates[1].extended && fingerStates[2].extended && fingerStates[3].extended && !fingerStates[0].extended && !fingerStates[4].extended) {
        // Three fingers (index, middle, ring)
        gestureName = "Three";
        gestureConfidence = 0.85;
        chatMessage = "Three fingers up!";
    } else {
        // Fallback based on finger count
        switch (extendedFingers) {
            case 0:
                gestureName = "Fist";
                gestureConfidence = 0.9;
                chatMessage = "Closed fist detected.";
                break;
            case 1:
                if (fingerStates[0].extended) {
                    gestureName = "Thumb Extended";
                    chatMessage = "I see your thumb!";
                } else {
                    gestureName = "One Finger";
                    chatMessage = "One finger extended.";
                }
                gestureConfidence = 0.85;
                break;
            case 2:
                if (!fingerStates[0].extended && fingerStates[1].extended && fingerStates[2].extended) {
                    gestureName = "Peace Sign";
                    chatMessage = "Peace and love! ✌️";
                } else {
                    gestureName = "Two Fingers";
                    chatMessage = "Two fingers extended.";
                }
                gestureConfidence = 0.85;
                break;
            case 3:
                gestureName = "Three Fingers";
                gestureConfidence = 0.8;
                chatMessage = "Three fingers extended.";
                break;
            case 4:
                gestureName = "Four Fingers";
                gestureConfidence = 0.8;
                chatMessage = "Four fingers extended.";
                break;
            case 5:
                gestureName = "Open Hand";
                gestureConfidence = 0.9;
                chatMessage = "Hello! How are you? 👋";
                break;
            default:
                gestureName = "Unknown";
                gestureConfidence = 0.3;
                chatMessage = "I'm not sure what gesture that is.";
        }
    }
    
    return { 
        name: gestureName, 
        confidence: gestureConfidence,
        chatMessage: chatMessage,
        fingerStates: fingerStates,
        extendedFingers: extendedFingers
    };
}

function updateGestureDisplay(gestureResult) {
    console.log('Updating gesture display:', gestureResult);
    
    appState.pendingGesture = gestureResult.name;
    appState.pendingChatMessage = gestureResult.chatMessage;
    elements.gestureStatus.textContent = `Detected: ${gestureResult.name}`;
    elements.gestureDisplay.classList.add('active');
    elements.approveGestureBtn.disabled = false;
    
    // Update confidence bar
    const confidencePercent = Math.round(gestureResult.confidence * 100);
    elements.confidenceFill.style.width = `${confidencePercent}%`;
    elements.confidenceText.textContent = `${confidencePercent}%`;
}

function updateGestureStatus(message, type = 'info') {
    if (elements.gestureStatus) {
        elements.gestureStatus.textContent = message;
        elements.gestureStatus.className = `gesture-text ${type}`;
    }
}

function approveGesture() {
    if (appState.pendingGesture) {
        console.log('Approving gesture:', appState.pendingGesture);
        const chatMessage = appState.pendingChatMessage || appState.pendingGesture;
        speakText(chatMessage);
        addChatMessage(chatMessage, 'gesture');
        
        // Reset pending state
        appState.pendingGesture = null;
        appState.pendingChatMessage = null;
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
    appState.pendingChatMessage = null;
    elements.gestureStatus.textContent = 'Perform a gesture...';
    elements.gestureDisplay.classList.remove('active');
    elements.approveGestureBtn.disabled = true;
    elements.confidenceFill.style.width = '0%';
    elements.confidenceText.textContent = '0%';
}

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

// ===== PREDICTIONS =====
const PREDICTION_MODELS = {
    'hello': ['how', 'are', 'you', 'doing', 'today', 'nice', 'to', 'meet'],
    'how': ['are', 'you', 'doing', 'is', 'it', 'going', 'was', 'your'],
    'thank': ['you', 'so', 'much', 'for', 'your', 'help', 'time'],
    'please': ['help', 'me', 'can', 'you', 'show', 'tell', 'explain'],
    'help': ['me', 'please', 'I', 'need', 'you', 'can', 'you'],
    'default': ['thank', 'you', 'please', 'yes', 'no', 'good', 'bad', 'help', 'water', 'food', 'bathroom', 'stop', 'done', 'what', 'fine', 'excuse', 'me']
};

function updatePredictions(lastWord = null) {
    const predictionChips = document.getElementById('predictionChips');
    if (!predictionChips) return;
    
    // Clear existing predictions
    predictionChips.innerHTML = '';
    
    // Get predictions based on last word or use default
    let predictions = [];
    
    if (lastWord && PREDICTION_MODELS[lastWord.toLowerCase()]) {
        predictions = PREDICTION_MODELS[lastWord.toLowerCase()];
    } else {
        predictions = PREDICTION_MODELS['default'];
    }
    
    // Limit to 5 predictions
    predictions = predictions.slice(0, 5);
    
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
    
    // Update predictions for next word
    updatePredictions(prediction);
    
    console.log('Selected prediction:', prediction);
}

// ===== UTILITY FUNCTIONS =====
function switchInputMode(mode) {
    if (mode === 'camera') {
        elements.liveCameraModeBtn.classList.add('active');
        elements.videoUploadModeBtn.classList.remove('active');
        elements.liveCameraSection.classList.add('active');
        elements.videoUploadSection.classList.remove('active');
    } else if (mode === 'upload') {
        elements.videoUploadModeBtn.classList.add('active');
        elements.liveCameraModeBtn.classList.remove('active');
        elements.videoUploadSection.classList.add('active');
        elements.liveCameraSection.classList.remove('active');
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
    elements.videoUpload.value = '';
    
    // Clear canvas
    const canvasCtx = elements.uploadLandmarkCanvas.getContext('2d');
    canvasCtx.clearRect(0, 0, elements.uploadLandmarkCanvas.width, elements.uploadLandmarkCanvas.height);
}

function processUploadedVideo() {
    if (!elements.uploadedVideo.src) {
        alert('No video file selected');
        return;
    }
    
    console.log('Starting video processing...');
    alert('Video processing feature coming soon!');
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

console.log('Conversation script loaded'); 