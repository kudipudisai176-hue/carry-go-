import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, RefreshCw, Check, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { compressImage } from "@/lib/imageUtils";

interface LiveCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (image: string) => void;
}

export default function LiveCameraModal({ isOpen, onClose, onCapture }: LiveCameraModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

    useEffect(() => {
        const checkCameras = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const cameras = devices.filter(device => device.kind === "videoinput");
                setHasMultipleCameras(cameras.length > 1);
            } catch (err) {
                console.error("Error checking cameras:", err);
            }
        };
        checkCameras();
    }, []);

    const startCamera = async () => {
        try {
            setError(null);
            console.log("Starting camera with facingMode:", facingMode);

            // 1. Basic check for browser support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                if (!isSecure) {
                    setError("Camera requires a secure connection (HTTPS). Please try using localhost or a secure URL.");
                } else {
                    setError("Your browser doesn't support camera access. Please use Chrome, Safari or Firefox.");
                }
                return;
            }

            // Stop existing stream before starting new one
            if (videoRef.current && videoRef.current.srcObject) {
                const oldStream = videoRef.current.srcObject as MediaStream;
                oldStream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }

            // Give a tiny moment for hardware to release (crucial for some Windows drivers)
            await new Promise(r => setTimeout(r, 200));

            // 2. Try with ideal constraints first
            try {
                const constraints: MediaStreamConstraints = {
                    video: {
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };
                
                const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
                
                // Double check if we should still apply it (prevent race condition)
                if (!isOpen) { 
                    mediaStream.getTracks().forEach(t => t.stop());
                    return;
                }

                console.log("Camera started successfully with ideal constraints");
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (innerErr: any) {
                console.warn("Ideal constraints failed, trying basic video:", innerErr);
                
                // If ideal failed, try even simpler constraints
                try {
                    const fallbackStream = await navigator.mediaDevices.getUserMedia({
                        video: true // Most permissive: just get any video
                    });
                    console.log("Camera started successfully with basic constraints");
                    setStream(fallbackStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = fallbackStream;
                    }
                } catch (finalErr: any) {
                    throw finalErr;
                }
            }
        } catch (err: any) {
            console.error("Camera access error:", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError("Camera access was blocked. Please click the camera icon in your browser address bar and choose 'Allow'.");
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError("No camera was found on this device. Please ensure your camera is plugged in.");
            } else if (err.name === 'OverconstrainedError') {
                setError("Your camera cannot satisfy the requested quality. Try another camera if available.");
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setError("Camera is already in use by another application. Please close other apps and try again.");
            } else {
                setError("Camera error: " + (err.message || "Could not start video source"));
            }
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const toggleFacingMode = () => {
        setFacingMode(prev => prev === "user" ? "environment" : "user");
    };

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
            setCapturedImage(null);
        }
        return () => stopCamera();
    }, [isOpen, facingMode]);

    const handleCapture = async () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/jpeg");
                try {
                   const optimized = await compressImage(dataUrl);
                   setCapturedImage(optimized);
                } catch (err) {
                   console.error("Camera capture compression failed:", err);
                   setCapturedImage(dataUrl); // Fallback
                }
            }
        }
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl"
                >
                    <div className="absolute right-4 top-4 z-10 flex gap-2">
                        {hasMultipleCameras && !capturedImage && (
                            <button
                                onClick={toggleFacingMode}
                                className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="mb-6 text-center">
                        <h2 className="text-xl font-bold text-slate-900">Live Photo Capture</h2>
                        <p className="text-sm text-slate-500">
                            {facingMode === 'user' ? "Position your face clearly within the frame" : "Focus your Aadhaar or vehicle clearly"}
                        </p>
                    </div>

                    <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900 shadow-inner">
                        {!capturedImage ? (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="h-full w-full object-cover grayscale-0"
                                />
                                {error && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-center p-6 transition-all duration-300">
                                        <div className="mb-4 rounded-full bg-red-500/10 p-4">
                                            <AlertCircle className="h-10 w-10 text-red-500" />
                                        </div>
                                        <p className="mb-2 text-lg font-bold text-white">Camera Issue</p>
                                        <p className="mb-6 text-sm text-slate-300 max-w-[250px]">{error}</p>
                                        
                                        <div className="flex flex-col gap-3 w-full max-w-[200px]">
                                            <Button onClick={startCamera} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 rounded-xl shadow-lg shadow-purple-600/20">
                                                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                                            </Button>
                                            <p className="text-[10px] text-slate-500">
                                                Tip: Check if another app is using your camera or if permissions are blocked in your browser settings.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute inset-0 pointer-events-none border-[3px] border-dashed border-white/20 m-8 rounded-[40px]" />
                            </>
                        ) : (
                            <img src={capturedImage} className="h-full w-full object-cover" />
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="mt-8 flex justify-center gap-4">
                        {!capturedImage ? (
                            <Button
                                onClick={handleCapture}
                                disabled={!!error || !stream}
                                className="h-16 w-16 rounded-full bg-purple-600 shadow-lg shadow-purple-600/30 transition-transform active:scale-90"
                            >
                                <Camera className="h-8 w-8 text-white" />
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={() => setCapturedImage(null)}
                                    variant="outline"
                                    className="flex-1 rounded-2xl border-2 py-6 font-bold"
                                >
                                    <RefreshCw className="mr-2 h-5 w-5" /> Retake
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    className="flex-1 rounded-2xl bg-purple-600 py-6 font-bold shadow-lg shadow-purple-600/20"
                                >
                                    <Check className="mr-2 h-5 w-5" /> Confirm Photo
                                </Button>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
