import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, X, AlertCircle, RefreshCw, Sparkles, User, ShieldCheck } from 'lucide-react';

interface AgentPhotoUploaderProps {
  photoUrl: string | null;
  onPhotoSelected: (photoUrl: string, file?: File) => void;
  onPhotoCleared: () => void;
  error?: string | null;
}

export const AgentPhotoUploader: React.FC<AgentPhotoUploaderProps> = ({
  photoUrl,
  onPhotoSelected,
  onPhotoCleared,
  error
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Error playing video:", e));
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please upload a photo file from your device instead.');
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror canvas for natural selfie view
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      
      // Convert to file object
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `agent_face_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onPhotoSelected(dataUrl, file);
        } else {
          onPhotoSelected(dataUrl);
        }
      }, 'image/jpeg', 0.92);
    }
    stopCamera();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setCameraError("File size exceeds 5MB limit. Please upload a smaller image.");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setCameraError("Invalid file type. Only JPG, PNG, and WEBP image files are allowed.");
        return;
      }

      setCameraError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onPhotoSelected(event.target.result as string, file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
          Agent Identity Photo (Picture of Yourself) <span className="text-rose-500">*</span>
        </label>
        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Required for Verification
        </span>
      </div>

      {/* Guidelines callout card */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-slate-100 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Photo Verification Criteria (Strict Anti-Fraud Standard)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Good, clear, well-lit photo of yourself</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Full face clearly visible & unblurred</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-rose-500 font-bold">✕</span>
            <span>No face mask or bandanas</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-rose-500 font-bold">✕</span>
            <span>No dark sunglasses or heavy face covers</span>
          </div>
        </div>
      </div>

      {/* Camera Stream Modal / Area */}
      {isCameraActive ? (
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500 p-2 text-center space-y-3">
          <div className="relative max-w-sm mx-auto aspect-square rounded-xl overflow-hidden bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {/* Overlay Guide Ring */}
            <div className="absolute inset-0 border-2 border-dashed border-emerald-400/60 rounded-full m-8 pointer-events-none flex items-center justify-center">
              <span className="text-[10px] text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded-md font-bold">
                Position Face Here
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pb-2">
            <button
              type="button"
              onClick={capturePhoto}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg"
            >
              <Camera className="w-4 h-4" />
              Snap Clear Photo
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : photoUrl ? (
        /* Photo Preview Box */
        <div className="relative rounded-2xl p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border-2 border-emerald-500/40 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md shrink-0">
            <img
              src={photoUrl}
              alt="Agent Verification Photo"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 right-1 bg-emerald-600 text-white p-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Identity Photo Attached</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Clear face photo attached. Unmasking & clarity checks passed.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                ✓ Unblurred
              </span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                ✓ No Mask
              </span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                ✓ Clear Lighting
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onPhotoCleared}
            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Retake Photo
          </button>
        </div>
      ) : (
        /* Empty Upload / Take Photo Area */
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Take Photo button */}
            <button
              type="button"
              onClick={startCamera}
              disabled={cameraLoading}
              className="p-5 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 hover:border-emerald-500 transition-all flex flex-col items-center justify-center text-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                {cameraLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </div>
              <div>
                <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100">
                  Take Photo with Camera
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Snap live picture of yourself
                </span>
              </div>
            </button>

            {/* Choose file button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-400 transition-all flex flex-col items-center justify-center text-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100">
                  Upload Photo from Device
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Select JPG, PNG, or WEBP file
                </span>
              </div>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="user"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {cameraError && (
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {cameraError}
            </p>
          )}

          {error && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
