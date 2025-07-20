# Gesture-to-Speech Communication System

## Overview

This is a hackathon-ready gesture-to-speech communication system designed for seamless interaction between users who communicate through gestures and those who use speech. The application features a vibrant cyan-themed landing page that transitions to a two-panel chat interface, combining real-time hand gesture recognition with speech-to-text capabilities for bidirectional communication. The system includes gesture and speech approval workflows and is backed by a PostgreSQL database for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.
Database integration: PostgreSQL database added for data persistence.

## System Architecture

### Frontend Architecture
- **Vibrant Cyan Theme**: Landing page with cyan background (#00FFFF) and white text
- **Conversational Interface**: Landing page with smooth transition to dual-panel chat layout
- **Two-Panel Design**: Left panel for gesture recognition, right panel for chat history with speech input
- **Real-time Processing**: Browser-based computer vision using MediaPipe
- **Approval Workflows**: Both gesture and speech require user approval before adding to conversation
- **Bidirectional Communication**: Gesture-to-speech AND speech-to-text capabilities
- **Responsive Design**: Grid-based layout with modern CSS styling and mobile optimization
- **Progressive Enhancement**: Graceful degradation for unsupported browsers

### Core Technologies
- **MediaPipe Hands**: Google's hand tracking solution for real-time gesture detection
- **Web Speech API**: Native browser text-to-speech synthesis AND speech recognition
- **Canvas API**: Real-time video overlay and gesture visualization
- **WebRTC**: Camera access through getUserMedia API
- **Font Awesome**: Icon library for modern UI elements
- **PostgreSQL**: Database for persistent data storage
- **Inter Font**: Modern typography from Google Fonts

## Key Components

### 1. Video Processing Pipeline
- **Input**: Live camera feed via HTML5 video element
- **Processing**: MediaPipe hand landmark detection
- **Output**: Canvas overlay with gesture annotations and confidence indicators

### 2. Gesture Recognition Engine
- **Method**: Rule-based classification using hand landmark positions
- **Gestures**: Supports basic hand gestures (One, Two, Three, etc.)
- **Confidence Scoring**: Real-time confidence measurement and visualization

### 3. Speech Synthesis System
- **Engine**: Web Speech API with configurable settings
- **Controls**: Adjustable speech rate and volume
- **Language**: English (US) as default with multi-language support capability

### 4. User Interface Components
- **Camera Controls**: Start/stop functionality with visual feedback
- **Gesture Display**: Real-time gesture name and confidence bar
- **Settings Panel**: Speech rate and volume adjustment sliders
- **Status System**: User feedback for system state and errors

## Data Flow

1. **Camera Initialization**: Request camera permissions and initialize video stream
2. **Hand Detection**: MediaPipe processes video frames and extracts hand landmarks
3. **Gesture Classification**: Rule-based logic analyzes landmark positions to identify gestures
4. **Confidence Calculation**: System determines recognition confidence level
5. **Speech Generation**: Web Speech API converts gesture names to audio output
6. **Visual Feedback**: Canvas overlay displays detection results and UI updates

## External Dependencies

### CDN Resources
- **@mediapipe/hands**: Hand tracking and landmark detection
- **@mediapipe/camera_utils**: Camera initialization and video processing utilities
- **@mediapipe/drawing_utils**: Canvas drawing utilities for hand landmark visualization

### Browser APIs
- **Navigator.mediaDevices**: Camera access and video stream management
- **SpeechSynthesis**: Text-to-speech audio generation
- **Canvas 2D Context**: Real-time drawing and visualization

## Deployment Strategy

### Static Hosting
- **Platform**: Replit static hosting (no server required)
- **Files**: Three core files (HTML, CSS, JavaScript)
- **Assets**: All dependencies loaded via CDN

### Browser Requirements
- **Camera Access**: Modern browsers with getUserMedia support
- **WebRTC**: Required for video stream processing
- **Canvas API**: Essential for visual feedback and overlays
- **Web Speech API**: Optional but recommended for audio output

### Performance Considerations
- **Real-time Processing**: 30 FPS video analysis with minimal latency
- **Memory Management**: Efficient handling of video frames and MediaPipe models
- **Responsive Design**: Optimized for various screen sizes and orientations

## Development Notes

### Architecture Decisions
- **Client-side Only**: Eliminates server complexity and reduces latency
- **Rule-based Recognition**: Simple, fast, and easily extensible gesture classification
- **Progressive Enhancement**: Core functionality works even if speech synthesis is unavailable
- **Modular Design**: Separate concerns for video processing, gesture recognition, and UI management

### Future Extensibility
- **Machine Learning**: Can be enhanced with ML-based gesture recognition
- **Gesture Library**: Easily expandable gesture vocabulary
- **Multi-language Support**: Speech synthesis supports multiple languages
- **Cloud Integration**: Potential for server-side processing and model improvements