import React, { useRef, useState, useEffect } from 'react';

interface Props {
    onCapture: (base64Image: string) => void;
    onRetake?: () => void;
}

const SelfieCamera: React.FC<Props> = ({ onCapture, onRetake }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        startCamera();
        // Cleanup function to stop camera when component unmounts
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            // Constraints for mobile: prefer front camera
            const constraints = {
                video: {
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError('');
        } catch (err) {
            console.error(err);
            setError("Camera access denied. Please allow permissions in your browser settings.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            // 1. Stop all tracks (Video/Audio)
            stream.getTracks().forEach(track => track.stop());
            // 2. Clear state
            setStream(null);
        }
        // 3. Clear video source
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            if (context) {
                // Mirror effect
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(dataUrl);
                onCapture(dataUrl);

                // FIX: Stop camera immediately after capture
                stopCamera();
            }
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera(); // Restart camera
        if (onRetake) onRetake();
    };

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center border border-red-200">
                <i className="fa-solid fa-camera-slash text-2xl mb-2"></i>
                <p className="text-sm font-bold">{error}</p>
                <button
                    onClick={() => startCamera()}
                    className="mt-2 text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded-full transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner border border-slate-200">
                {!capturedImage ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline // Critical for mobile
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                    />
                ) : (
                    <img src={capturedImage} alt="Selfie" className="w-full h-full object-cover" />
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex gap-4">
                {!capturedImage ? (
                    <button
                        onClick={capturePhoto}
                        className="w-14 h-14 rounded-full border-4 border-blue-500 flex items-center justify-center bg-white shadow-lg hover:scale-105 transition-transform"
                    >
                        <div className="w-10 h-10 bg-blue-500 rounded-full"></div>
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
        </div>
    );
};

export default SelfieCamera;