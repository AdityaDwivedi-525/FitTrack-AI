import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

const WebcamStream = ({ isRunning, setStats, stats }) => {
  const webcamRef = useRef(null);
  const wsRef = useRef(null);
  const isProcessingFrame = useRef(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const handleDevices = useCallback((mediaDevices) => {
    const videoDevices = mediaDevices.filter(({ kind }) => kind === 'videoinput');
    setDevices(videoDevices);
    
    // Explicitly auto-select Camo (which proxies Aditya's A34)
    if (!selectedDeviceId && videoDevices.length > 0) {
      const targetCam = videoDevices.find(d => {
        const label = d.label.toLowerCase();
        return label.includes('camo') || label.includes('aditya') || label.includes('a34');
      });
      setSelectedDeviceId(targetCam ? targetCam.deviceId : videoDevices[0].deviceId);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    // Request camera permission explicitly first
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setHasPermission(true);
        navigator.mediaDevices.enumerateDevices().then(handleDevices);
      })
      .catch((err) => {
        console.error("Camera access denied or error:", err);
        setHasPermission(false);
      });
  }, [handleDevices]);

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8000/ws');
    
    wsRef.current.onopen = () => console.log("WebSocket connected");
    wsRef.current.onmessage = (event) => {
      isProcessingFrame.current = false;
      const data = JSON.parse(event.data);
      if (!data.error) {
        setStats(prev => ({
          ...prev,
          image: data.image,
          reps_total: data.reps_total,
          reps_left: data.reps_left,
          reps_right: data.reps_right,
          stage_total: data.stage_total,
          stage_left: data.stage_left,
          stage_right: data.stage_right,
          feedback: data.feedback,
          angle_left: data.angle_left,
          angle_right: data.angle_right,
          exercise: data.exercise
        }));
      }
    };
    wsRef.current.onerror = (err) => console.error("WebSocket error", err);

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [setStats]);

  const captureAndSend = useCallback(() => {
    if (webcamRef.current && isRunning && wsRef.current?.readyState === WebSocket.OPEN && !isProcessingFrame.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        isProcessingFrame.current = true;
        wsRef.current.send(imageSrc);
      }
    }
  }, [isRunning]);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(captureAndSend, 50);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, captureAndSend]);

  if (hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-full bg-red-900/20 border border-red-500 rounded-xl p-6 text-center shadow-xl">
        <div>
          <h3 className="text-xl font-bold text-red-400 mb-2">Camera Access Denied</h3>
          <p className="text-gray-300">Please allow camera access in your browser.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-black border border-gray-800 shadow-2xl flex flex-col h-full min-h-[400px]">
      
      {hasPermission ? (
        <div className="w-full h-full relative">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className={`w-full h-full object-cover aspect-video transform scale-x-[-1] absolute inset-0 z-0 ${(isRunning && stats?.image) ? 'opacity-0' : 'opacity-100'}`}
            videoConstraints={selectedDeviceId ? { deviceId: selectedDeviceId } : { facingMode: "user" }}
          />
          
          {isRunning && stats?.image && (
            <img 
              src={stats.image} 
              alt="AI Tracker" 
              className="w-full h-full object-cover aspect-video transform scale-x-[-1] absolute inset-0 z-10" 
            />
          )}

          {!isRunning && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 pointer-events-none">
                 <p className="text-white font-bold tracking-wider drop-shadow-lg bg-black/50 px-4 py-2 rounded-lg">Camera Ready - Press Start</p>
            </div>
          )}

          {isRunning && !stats?.image && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
               <div className="flex flex-col items-center space-y-4">
                 <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
                 <p className="text-blue-400 font-medium animate-pulse drop-shadow-lg">Initializing Skeleton Tracking...</p>
               </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full min-h-[400px] bg-gray-900 text-gray-400">
          <div className="flex flex-col items-center space-y-3">
             <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
             <p>Requesting camera permissions...</p>
          </div>
        </div>
      )}
      
      {/* Recording Indicator */}
      {isRunning && (
        <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md z-30 shadow-xl border border-gray-700">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <span className="text-xs font-bold text-white tracking-widest uppercase">LIVE TRACKING</span>
        </div>
      )}
    </div>
  );
};

export default WebcamStream;
