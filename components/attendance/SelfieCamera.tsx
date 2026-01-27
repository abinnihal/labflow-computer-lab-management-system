import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';

interface Props {
    onCapture: (base64Image: string) => void;
    onRetake?: () => void;
}

const SelfieCamera: React.FC<Props> = ({ onCapture, onRetake }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // FIX: Use a Ref to store the stream for cleanup, as state might be stale in useEffect closure
    const streamRef = useRef<MediaStream | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // 1. Load AI Models on Mount
    useEffect(() => {
        let isMounted = true;

        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceExpressionNet.loadFromUri('/models')
                ]);
                if (isMounted) setIsModelLoaded(true);
            } catch (err) {
                console.error("AI Model Load Failed:", err);
                if (isMounted) setError("Failed to load AI face detection. Please refresh.");
            }
        };
        loadModels();
        startCamera();

        // CLEANUP: This now works because it uses streamRef
        return () => {
            isMounted = false;
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            // Stop any existing stream first
            stopCamera();

            const constraints = {
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Save to Ref (for cleanup) AND State (for UI)
            streamRef.current = mediaStream;
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError('');
        } catch (err) {
            setError("Camera access denied. Please allow permissions.");
        }
    };

    const stopCamera = () => {
        // FIX: Check the Ref, not the State
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current || !isModelLoaded) return;

        setIsScanning(true);
        const video = videoRef.current;

        // 2. AI Check: Detect Faces AND Expressions
        try {
            const detections = await faceapi.detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceExpressions();

            setIsScanning(false);

            // Check 1: Is there a face?
            if (detections.length === 0) {
                alert("No face detected! Please position your face clearly in the frame.");
                return;
            }

            // Check 2: Are there multiple people?
            if (detections.length > 1) {
                alert("Multiple faces detected! Only you should be in the frame.");
                return;
            }

            // Check 3: LIVENESS CHECK (The Smile Test)
            const emotions = detections[0].expressions;
            if (emotions.happy < 0.7) {
                alert("Please SMILE to verify you are a real person!");
                return;
            }

            // 4. If passed, Capture
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            if (context) {
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(dataUrl);
                onCapture(dataUrl);
                stopCamera(); // Stop stream immediately after capture
            }
        } catch (e) {
            console.error(e);
            setIsScanning(false);
            alert("Face detection error. Try again.");
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
        if (onRetake) onRetake();
    };

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center border border-red-200">
                <i className="fa-solid fa-triangle-exclamation text-2xl mb-2"></i>
                <p className="text-sm font-bold">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner border border-slate-200">
                {!capturedImage ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform -scale-x-100"
                        />

                        {/* Overlay Status */}
                        <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-md flex items-center gap-2 backdrop-blur-sm">
                            <div className={`w-2 h-2 rounded-full ${isModelLoaded ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                            <span className="text-[10px] text-white font-mono uppercase">
                                {isModelLoaded ? 'AI Ready' : 'Loading AI...'}
                            </span>
                        </div>

                        {/* Instruction Badge */}
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md animate-bounce shadow-lg border border-white/20">
                                Please Smile & Capture
                            </span>
                        </div>

                        {/* Scanning Overlay */}
                        {isScanning && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                <div className="text-white text-center">
                                    <i className="fa-solid fa-face-smile fa-spin text-3xl mb-2"></i>
                                    <p className="text-sm font-bold">Verifying Expression...</p>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <img src={capturedImage} alt="Selfie" className="w-full h-full object-cover" />
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex gap-4">
                {!capturedImage ? (
                    <button
                        onClick={capturePhoto}
                        disabled={!isModelLoaded || isScanning}
                        className={`w-14 h-14 rounded-full border-4 flex items-center justify-center shadow-lg transition-transform ${!isModelLoaded ? 'border-slate-300 bg-slate-100 opacity-50 cursor-not-allowed' : 'border-blue-500 bg-white hover:scale-105 cursor-pointer'}`}
                    >
                        <div className={`w-10 h-10 rounded-full ${!isModelLoaded ? 'bg-slate-300' : 'bg-blue-500'}`}></div>
                    </button>
                ) : (
                    <button
                        onClick={handleRetake}
                        className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Retake Photo
                    </button>
                )}
            </div>

            {!isModelLoaded && !capturedImage && (
                <p className="text-xs text-slate-400 animate-pulse">Initializing Face & Emotion Models...</p>
            )}
        </div>
    );
};

export default SelfieCamera;