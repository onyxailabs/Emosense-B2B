import React, { useState, useRef, useEffect } from 'react';
import { analyzeText, analyzeImage, analyzeAudio } from '../services/geminiService';
import { AnalysisResult, SentimentType } from '../types';
import { 
  Loader2, ArrowRight, Lightbulb, AlertTriangle, CheckCircle2, 
  Camera, Mic, Type, StopCircle, RefreshCcw, User, Activity, Heart, Smartphone, Stethoscope, SwitchCamera, Zap, Tag, Dumbbell, Sun, Moon, Calendar, Eye, Pill, FileText, Video, Download, Baby, Accessibility 
} from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ZAxis, BarChart, Bar, Legend, LineChart, Line, Cell } from 'recharts';

interface AnalyzerProps {
  onAnalyzeComplete: (result: AnalysisResult) => void;
}

const Analyzer: React.FC<AnalyzerProps> = ({ onAnalyzeComplete }) => {
  const [mode, setMode] = useState<'text' | 'camera' | 'voice' | 'medical'>('text');
  const [medicalSubMode, setMedicalSubMode] = useState<'monitor' | 'ultrasound'>('monitor');
  const [patientProfile, setPatientProfile] = useState<'Child' | 'Adult' | 'Senior'>('Adult'); // New State
  
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Camera Refs & State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  // Video Recording State
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  // Audio & Health Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Real-time Health Simulation State
  const ekgCanvasRef = useRef<HTMLCanvasElement>(null);
  const spo2CanvasRef = useRef<HTMLCanvasElement>(null);
  const respCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // Signal processing buffers
  const lastSignalRef = useRef<number>(50);

  const [liveVitals, setLiveVitals] = useState({
    hr: 72,
    bpSys: 120,
    bpDia: 80,
    spo2: 98,
    resp: 16
  });

  // --- Effects ---

  // Connect stream to video element
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Error playing video stream:", e));
    }
  }, [stream]);

  // Restart camera when facingMode changes if already active
  useEffect(() => {
    if (stream) {
      const restart = async () => {
         stopCamera();
         setTimeout(() => startCamera(), 100);
      };
      restart();
    }
  }, [facingMode]);

  // Handle Graph Animations (ECG, SpO2, Respiration) based on Video Input
  useEffect(() => {
    // Animate if recording voice OR if camera is active in Medical Mode
    const shouldAnimate = (mode === 'voice' && isRecording) || (mode === 'medical');
    
    if (shouldAnimate) {
      let x = 0;
      const analysisCanvas = document.createElement('canvas');
      const analysisCtx = analysisCanvas.getContext('2d');

      const animate = () => {
        // --- 1. Signal Acquisition (Fake PPG from Video) ---
        let inputSignal = 0;

        if (mode === 'medical' && stream && videoRef.current && videoRef.current.readyState === 4) {
             // Sample center of video for "Vitals"
             if (!analysisCanvas.width) {
                 analysisCanvas.width = 50;
                 analysisCanvas.height = 50;
             }
             if (analysisCtx) {
                 const vw = videoRef.current.videoWidth;
                 const vh = videoRef.current.videoHeight;
                 analysisCtx.drawImage(videoRef.current, vw/2 - 25, vh/2 - 25, 50, 50, 0, 0, 50, 50);
                 const frame = analysisCtx.getImageData(0, 0, 50, 50);
                 let totalRed = 0;
                 for (let i = 0; i < frame.data.length; i += 4) totalRed += frame.data[i];
                 const avgRed = totalRed / (frame.data.length / 4);
                 inputSignal = (avgRed - 128) * 0.5;
             }
        } else {
             // Artificial heartbeat signal if no camera
             const t = Date.now() / 1000;
             inputSignal = Math.sin(t * 5) * 20; 
        }

        const currentSignal = lastSignalRef.current * 0.8 + inputSignal * 0.2;
        lastSignalRef.current = currentSignal;
        
        // --- 2. Update Vitals Display infrequently ---
        if (x % 30 === 0) {
           const hrMod = Math.abs(currentSignal) > 20 ? 5 : 0; 
           setLiveVitals(prev => ({
             hr: Math.min(140, Math.max(50, prev.hr + Math.floor(Math.random() * 3) - 1 + hrMod)),
             bpSys: Math.min(160, Math.max(100, prev.bpSys + Math.floor(Math.random() * 3) - 1)),
             bpDia: Math.min(95, Math.max(60, prev.bpDia + Math.floor(Math.random() * 3) - 1)),
             spo2: Math.min(100, Math.max(90, prev.spo2 + (Math.random() > 0.9 ? -1 : 0))),
             resp: Math.min(30, Math.max(10, prev.resp + Math.floor(Math.random() * 2) - 0.5))
           }));
        }

        // --- 3. Draw Graphs ---

        // ECG
        const ctxEcg = ekgCanvasRef.current?.getContext('2d');
        if (ctxEcg && ekgCanvasRef.current) {
           const h = ekgCanvasRef.current.height;
           const w = ekgCanvasRef.current.width;
           if (x === 0) ctxEcg.clearRect(0,0,w,h);
           
           ctxEcg.beginPath();
           ctxEcg.strokeStyle = '#10b981'; 
           ctxEcg.lineWidth = 2;
           ctxEcg.lineJoin = 'round';
           
           const baseOffset = currentSignal * 0.2;
           let y = h / 2 + baseOffset;
           
           // Synthetic QRS Complex
           const cycle = x % 80; 
           if (cycle > 30 && cycle < 50) {
                if (cycle < 35) y -= h * 0.1; // P
                else if (cycle < 40) y += h * 0.2; // Q
                else if (cycle < 45) y -= h * 0.6; // R Spike
                else y += h * 0.2; // S
           }
           
           ctxEcg.moveTo(x > 0 ? x-2 : 0, h/2); 
           ctxEcg.lineTo(x, y);
           ctxEcg.stroke();
        }

        // SpO2 (Medical Mode only)
        const ctxSpo2 = spo2CanvasRef.current?.getContext('2d');
        if (ctxSpo2 && spo2CanvasRef.current && mode === 'medical') {
           const h = spo2CanvasRef.current.height;
           const w = spo2CanvasRef.current.width;
           if (x === 0) ctxSpo2.clearRect(0,0,w,h);

           ctxSpo2.beginPath();
           ctxSpo2.strokeStyle = '#3b82f6'; 
           ctxSpo2.lineWidth = 2;
           
           const cycle = x % 80;
           let y = h/2 + Math.sin(cycle * 0.08) * (h * 0.3);
           y += currentSignal * 0.1;

           if (x > 0) { ctxSpo2.moveTo(x-2, h/2); ctxSpo2.lineTo(x, y); }
           ctxSpo2.stroke();
        }

        // Resp (Medical Mode only)
        const ctxResp = respCanvasRef.current?.getContext('2d');
        if (ctxResp && respCanvasRef.current && mode === 'medical') {
           const h = respCanvasRef.current.height;
           const w = respCanvasRef.current.width;
           if (x === 0) ctxResp.clearRect(0,0,w,h);

           ctxResp.beginPath();
           ctxResp.strokeStyle = '#eab308';
           ctxResp.lineWidth = 2;
           
           let y = h/2 + Math.sin(x * 0.05) * (h * 0.4);

           if (x > 0) { ctxResp.moveTo(x-2, h/2); ctxResp.lineTo(x, y); }
           ctxResp.stroke();
        }

        x += 2;
        if (ekgCanvasRef.current && x > ekgCanvasRef.current.width) {
          x = 0;
          [ekgCanvasRef, spo2CanvasRef, respCanvasRef].forEach(ref => {
             const ctx = ref.current?.getContext('2d');
             if(ctx && ref.current) {
                 ctx.clearRect(0, 0, ref.current.width, ref.current.height);
                 ctx.beginPath();
             }
          });
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      [ekgCanvasRef, spo2CanvasRef, respCanvasRef].forEach(ref => {
        if(ref.current) {
          ref.current.width = ref.current.offsetWidth;
          ref.current.height = ref.current.offsetHeight;
        }
      });

      animate();
    } else {
      cancelAnimationFrame(animationRef.current);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRecording, mode, stream]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
        videoRecorderRef.current.stop();
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // --- Handlers ---

  const handleTextAnalyze = async () => {
    if (!text.trim()) return;
    performAnalysis(() => analyzeText(text, patientProfile));
  };

  const handleImageAnalyze = async () => {
    if (!capturedImage) return;
    performAnalysis(() => analyzeImage(capturedImage, mode === 'medical', patientProfile));
  };

  const handleAudioAnalyze = async () => {
    if (!audioBlob) return;
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      performAnalysis(() => analyzeAudio(base64, patientProfile));
    };
  };

  const performAnalysis = async (apiCall: () => Promise<AnalysisResult>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall();
      setResult(data);
      onAnalyzeComplete(data);
    } catch (err: any) {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Camera Logic ---
  const startCamera = async () => {
    // Helper to attempt stream acquisition
    const tryGetStream = async (constraints: MediaStreamConstraints) => {
        try {
            return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
            console.warn("Stream constraint failed:", constraints, e);
            return null;
        }
    };

    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      setError(null);
      let mediaStream: MediaStream | null = null;

      // 1. Try High Quality (4K) with preferred Facing Mode
      mediaStream = await tryGetStream({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 3840 }, 
          height: { ideal: 2160 }, 
          frameRate: { ideal: 60 } 
        } 
      });

      // 2. Try Standard Quality with preferred Facing Mode
      if (!mediaStream) {
         mediaStream = await tryGetStream({ 
            video: { facingMode: facingMode } 
         });
      }

      // 3. Fallback: Any Video Device (ignore facing mode preference)
      if (!mediaStream) {
          mediaStream = await tryGetStream({ video: true });
          if (mediaStream) {
            // Warn user if we couldn't respect the facing mode (e.g. desktop environment)
            console.log("Fallback to default camera.");
          }
      }

      if (mediaStream) {
        setStream(mediaStream);
        setCapturedImage(null);
        setRecordedVideoUrl(null);
        setError(null);
      } else {
        throw new Error("No video device found after multiple attempts.");
      }

    } catch (e: any) {
      console.error(e);
      let errorMessage = "Camera access error.";
      
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        errorMessage = "Camera permission denied. Please check your browser settings.";
      } else if (e.name === 'NotFoundError' || e.message?.includes("device found")) {
        errorMessage = "No camera device detected on this system.";
      } else if (e.name === 'NotReadableError') {
         errorMessage = "Camera is currently in use by another application.";
      }
      
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      if (videoRef.current.readyState < 2) {
        setError("Camera not ready. Please wait a moment.");
        return;
      }
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Use actual video dimensions to ensure high-res capture
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // Handle mirroring for user-facing camera in capture
        // Only mirror if we requested 'user' AND the active track settings confirm it (optional check, but kept simple here)
        if (facingMode === 'user') {
          context.translate(canvasRef.current.width, 0);
          context.scale(-1, 1);
        }
        
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95); // High quality JPEG
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  // --- Video Recording Logic ---
  const startVideoRecording = () => {
    if (!stream) return;
    const recorder = new MediaRecorder(stream);
    videoRecorderRef.current = recorder;
    const chunks: BlobPart[] = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
    };

    recorder.start();
    setIsVideoRecording(true);
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current) {
      videoRecorderRef.current.stop();
      setIsVideoRecording(false);
    }
  };

  // --- Audio Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setAudioBlob(null);
      setError(null);
    } catch (e) {
      setError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  // --- Render Functions ---

  const getActionButton = () => {
    if (loading) {
      return (
        <button disabled className="bg-indigo-400 text-white px-6 py-2 rounded-lg flex items-center cursor-not-allowed">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...
        </button>
      );
    }

    let isDisabled = false;
    let onClick = () => {};
    let label = "Analyze";

    switch (mode) {
      case 'text':
        isDisabled = !text.trim();
        onClick = handleTextAnalyze;
        label = "Analyze Text";
        break;
      case 'camera':
        isDisabled = !capturedImage;
        onClick = handleImageAnalyze;
        label = "Analyze Expression";
        break;
      case 'voice':
        isDisabled = !audioBlob;
        onClick = handleAudioAnalyze;
        label = "Analyze Audio";
        break;
      case 'medical':
        isDisabled = !capturedImage;
        onClick = handleImageAnalyze;
        label = "Generate Clinical Report";
        break;
    }

    return (
      <button 
        onClick={onClick} 
        disabled={isDisabled}
        className={`px-6 py-2 rounded-lg font-medium flex items-center transition-all
          ${isDisabled ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
      >
        {label} <ArrowRight className="w-4 h-4 ml-2" />
      </button>
    );
  };

  const renderPcaChart = (point: { x: number, y: number }) => {
    const data = [{ x: point.x, y: point.y, z: 1 }];
    
    return (
      <div className="h-48 w-full relative border border-slate-100 rounded-lg bg-slate-50 mt-2">
         {/* Background Quadrant Labels */}
         <div className="absolute inset-0 pointer-events-none">
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-bold">ACTIVATED</span>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-bold">SLEEPY</span>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">UNPLEASANT</span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">PLEASANT</span>
         </div>

         <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis type="number" dataKey="x" domain={[-1, 1]} hide />
               <YAxis type="number" dataKey="y" domain={[-1, 1]} hide />
               <ReferenceLine y={0} stroke="#94a3b8" />
               <ReferenceLine x={0} stroke="#94a3b8" />
               <Tooltip cursor={{ strokeDasharray: '3 3' }} />
               <Scatter data={data} fill="#6366f1">
                 <Cell fill="#6366f1" />
               </Scatter>
            </ScatterChart>
         </ResponsiveContainer>
      </div>
    );
  };

  const renderTabs = () => (
    <div className="flex flex-wrap gap-2 mb-6 p-1 bg-slate-100 rounded-lg w-fit">
      {[
        { id: 'text', icon: Type, label: 'Text' }, 
        { id: 'camera', icon: Camera, label: 'Camera' }, 
        { id: 'voice', icon: Mic, label: 'Voice' },
        { id: 'medical', icon: Stethoscope, label: 'Medical' }
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            setMode(tab.id as any);
            setResult(null);
            stopCamera();
            if (isRecording) stopRecording();
            setCapturedImage(null);
            setAudioBlob(null);
            setError(null);
          }}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all
            ${mode === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <tab.icon className="w-4 h-4 mr-2" />
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderMedicalInterface = () => {
     const isUltrasound = medicalSubMode === 'ultrasound';

     return (
        <div className="space-y-4">
          {/* Medical Sub-Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
             <div className="flex space-x-4">
                <button 
                onClick={() => setMedicalSubMode('monitor')}
                className={`text-xs font-bold px-4 py-2 rounded-full border transition-all ${!isUltrasound ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm' : 'bg-white text-slate-500'}`}
                >
                PATIENT MONITOR
                </button>
                <button 
                onClick={() => setMedicalSubMode('ultrasound')}
                className={`text-xs font-bold px-4 py-2 rounded-full border transition-all ${isUltrasound ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm' : 'bg-white text-slate-500'}`}
                >
                SIM. ULTRASOUND
                </button>
             </div>
             
             {/* Patient Profile Selector */}
             <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wide">Patient:</span>
                {[
                  { id: 'Child', icon: Baby, label: 'Child' },
                  { id: 'Adult', icon: User, label: 'Adult' },
                  { id: 'Senior', icon: Accessibility, label: 'Senior' }
                ].map((p) => (
                   <button 
                      key={p.id}
                      onClick={() => setPatientProfile(p.id as any)}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all
                      ${patientProfile === p.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                      <p.icon className="w-3 h-3" />
                      <span>{p.label}</span>
                   </button>
                ))}
             </div>
          </div>

          <div className="bg-black rounded-xl border-4 border-slate-800 h-[500px] flex flex-col relative overflow-hidden">
             
             {/* Device Header */}
             <div className="bg-slate-900 text-slate-400 text-[10px] px-3 py-1.5 flex justify-between items-center shrink-0 border-b border-slate-700">
                <span className="font-mono">{facingMode === 'user' ? 'FRONT_CAM' : 'REAR_CAM'} // {patientProfile.toUpperCase()}_PROFILE</span>
                <span className="font-mono">{new Date().toLocaleTimeString()}</span>
                <span className="flex items-center text-emerald-500 font-bold"><Zap className="w-3 h-3 mr-1" /> LIVE</span>
             </div>

             {/* MAIN DISPLAY AREA */}
             <div className="flex-1 relative flex overflow-hidden">
                
                {/* 1. Patient Monitor Layout (Split Screen) */}
                {!isUltrasound && (
                  <div className="w-full h-full flex flex-col md:flex-row">
                    {/* Left: Graphs */}
                    <div className="w-full md:w-2/3 h-1/2 md:h-full bg-black flex flex-col border-b md:border-b-0 md:border-r border-slate-800 relative z-10">
                       {/* ECG Graph */}
                       <div className="flex-1 relative border-b border-slate-800 p-1">
                          <span className="absolute top-1 left-2 text-emerald-500 text-xs font-bold">ECG II</span>
                          <span className="absolute top-1 right-2 text-emerald-500 text-xl font-mono font-bold">{liveVitals.hr}</span>
                          <canvas ref={ekgCanvasRef} className="w-full h-full" />
                       </div>
                       {/* SpO2 Graph */}
                       <div className="flex-1 relative border-b border-slate-800 p-1">
                          <span className="absolute top-1 left-2 text-blue-500 text-xs font-bold">PLETH</span>
                          <span className="absolute top-1 right-2 text-blue-500 text-xl font-mono font-bold">{liveVitals.spo2}%</span>
                          <canvas ref={spo2CanvasRef} className="w-full h-full" />
                       </div>
                       {/* Resp Graph */}
                       <div className="flex-1 relative p-1">
                          <span className="absolute top-1 left-2 text-yellow-500 text-xs font-bold">RESP</span>
                          <span className="absolute top-1 right-2 text-yellow-500 text-xl font-mono font-bold">{liveVitals.resp}</span>
                          <canvas ref={respCanvasRef} className="w-full h-full" />
                       </div>
                    </div>

                    {/* Right: Camera Feed & NIBP */}
                    <div className="w-full md:w-1/3 h-1/2 md:h-full bg-slate-900 relative">
                       {/* Video Feed */}
                       <div className="absolute inset-0 z-0">
                          {capturedImage ? (
                             <img src={capturedImage} className="w-full h-full object-cover opacity-80" />
                          ) : stream ? (
                             <video 
                               ref={videoRef} 
                               autoPlay 
                               playsInline 
                               muted 
                               className="w-full h-full object-cover opacity-90"
                               style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                             />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                <span className="text-slate-600 text-xs">NO SIGNAL</span>
                             </div>
                          )}
                       </div>
                       
                       {/* NIBP Overlay */}
                       <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black to-transparent z-10">
                          <div className="text-right">
                             <span className="text-red-500 text-xs font-bold block">NIBP (mmHg)</span>
                             <span className="text-red-400 text-4xl font-mono font-bold">{liveVitals.bpSys}/{liveVitals.bpDia}</span>
                          </div>
                          <div className="text-right mt-2">
                             <span className="text-slate-400 text-xs font-bold block">TEMP (°F)</span>
                             <span className="text-white text-xl font-mono font-bold">98.6</span>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* 2. Ultrasound Layout (Full Screen Video with Filters) */}
                {isUltrasound && (
                   <div className="w-full h-full relative bg-black overflow-hidden">
                      {/* Video Layer */}
                      {capturedImage ? (
                         <img src={capturedImage} className="w-full h-full object-cover grayscale contrast-125 brightness-90" />
                      ) : stream ? (
                         <video 
                           ref={videoRef} 
                           autoPlay 
                           playsInline 
                           muted 
                           className="w-full h-full object-cover grayscale contrast-125 brightness-90"
                           style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                         />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center">
                            <Stethoscope className="w-12 h-12 text-slate-700 animate-pulse" />
                         </div>
                      )}
                      
                      {/* Sector Scan Overlay (Cone) */}
                      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, transparent 0%, transparent 60%, rgba(0,0,0,0.8) 65%)' }}></div>
                      
                      {/* Scan Line Animation */}
                      <div className="absolute inset-0 pointer-events-none flex justify-center">
                         <div className="w-1 h-full bg-white/20 origin-top animate-[ping_3s_ease-in-out_infinite]" style={{ transform: 'rotate(0deg)' }}></div>
                      </div>

                      {/* Info Text */}
                      <div className="absolute top-4 left-4 text-white/70 font-mono text-xs">
                         <p>FREQ: 3.5 MHz</p>
                         <p>GAIN: 85 dB</p>
                         <p>DEPTH: 14 cm</p>
                      </div>
                   </div>
                )}
             </div>

             {/* Footer Controls */}
             <div className="bg-slate-800 p-3 flex justify-between items-center z-30 shrink-0 border-t border-slate-700">
                <div className="flex space-x-3">
                   {!stream && !capturedImage && (
                     <button onClick={startCamera} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-xs font-bold flex items-center shadow-lg">
                        <Activity className="w-3 h-3 mr-2" /> POWER ON
                     </button>
                   )}
                   {stream && (
                     <button onClick={capturePhoto} className="bg-white text-slate-900 px-4 py-2 rounded text-xs font-bold hover:bg-slate-200 flex items-center shadow-lg">
                        <Camera className="w-3 h-3 mr-2" /> FREEZE
                     </button>
                   )}
                   {capturedImage && (
                     <button onClick={() => { setCapturedImage(null); startCamera(); }} className="bg-slate-600 text-white p-2 rounded hover:bg-slate-500">
                        <RefreshCcw className="w-4 h-4" />
                     </button>
                   )}
                </div>
                
                <div className="flex bg-slate-900 rounded-lg p-1 space-x-1 border border-slate-700">
                   <button onClick={() => setFacingMode('user')} className={`px-3 py-1.5 text-[10px] font-bold rounded ${facingMode === 'user' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>FRONT</button>
                   <button onClick={() => setFacingMode('environment')} className={`px-3 py-1.5 text-[10px] font-bold rounded ${facingMode === 'environment' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>REAR</button>
                </div>
             </div>
             <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
     );
  };

  const renderRoutineSection = (dailyRoutine: any) => {
    if (!dailyRoutine) return null;
    
    // Prepare Data for Charts
    const routineData = [
       { name: 'Morning', minutes: dailyRoutine.morning.reduce((acc: any, cur: any) => acc + cur.durationMinutes, 0) },
       { name: 'Afternoon', minutes: dailyRoutine.afternoon.reduce((acc: any, cur: any) => acc + cur.durationMinutes, 0) },
       { name: 'Evening', minutes: dailyRoutine.evening.reduce((acc: any, cur: any) => acc + cur.durationMinutes, 0) }
    ];

    const intensityData = [
       ...dailyRoutine.morning.map((e: any) => ({ name: e.name, calories: e.caloriesBurned, type: 'Morning' })),
       ...dailyRoutine.afternoon.map((e: any) => ({ name: e.name, calories: e.caloriesBurned, type: 'Afternoon' })),
       ...dailyRoutine.evening.map((e: any) => ({ name: e.name, calories: e.caloriesBurned, type: 'Evening' }))
    ];

    return (
      <div className="mt-6 border-t border-slate-200 pt-6">
         <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
            <Dumbbell className="w-5 h-5 mr-2 text-indigo-600" /> Personalized Daily Wellness Plan
         </h3>
         <p className="text-sm text-slate-500 mb-6">{dailyRoutine.recommendationReason}</p>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Chart 1: Duration Distribution */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
               <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Exercise Duration (Minutes)</h4>
               <div className="h-48">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={routineData} margin={{top: 5, right: 20, left: 0, bottom: 5}}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="name" tick={{fontSize: 10}} />
                       <YAxis tick={{fontSize: 10}} />
                       <Tooltip cursor={{fill: 'transparent'}} contentStyle={{fontSize: '12px'}} />
                       <Bar dataKey="minutes" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

             {/* Chart 2: Calories Burned */}
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
               <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Est. Calories Burned</h4>
               <div className="h-48">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={intensityData} margin={{top: 5, right: 20, left: 0, bottom: 5}}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="name" tick={{fontSize: 0}} />
                       <YAxis tick={{fontSize: 10}} />
                       <Tooltip contentStyle={{fontSize: '12px'}} />
                       <Line type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2} dot={{r: 4}} />
                    </LineChart>
                 </ResponsiveContainer>
               </div>
            </div>
         </div>

         {/* Detailed List */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Morning', 'Afternoon', 'Evening'].map((time) => {
               const exercises = dailyRoutine[time.toLowerCase()];
               const Icon = time === 'Morning' ? Sun : time === 'Afternoon' ? Activity : Moon;
               const color = time === 'Morning' ? 'text-amber-500' : time === 'Afternoon' ? 'text-emerald-500' : 'text-indigo-500';
               const bg = time === 'Morning' ? 'bg-amber-50' : time === 'Afternoon' ? 'bg-emerald-50' : 'bg-indigo-50';

               return (
                  <div key={time} className={`rounded-lg border border-slate-200 overflow-hidden`}>
                     <div className={`${bg} px-4 py-3 flex items-center font-semibold text-sm ${color}`}>
                        <Icon className="w-4 h-4 mr-2" /> {time} Routine
                     </div>
                     <div className="p-4 space-y-4">
                        {exercises.map((ex: any, idx: number) => (
                           <div key={idx} className="flex flex-col">
                              <div className="flex justify-between items-start mb-1">
                                 <span className="font-medium text-slate-700 text-sm">{ex.name}</span>
                                 <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{ex.durationMinutes}m</span>
                              </div>
                              <p className="text-xs text-slate-500 mb-1">{ex.description}</p>
                              <div className="flex gap-2">
                                 <span className="text-[10px] text-slate-400">Intensity: {ex.intensity}</span>
                                 <span className="text-[10px] text-slate-400">Burn: {ex.caloriesBurned} cal</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Input Section */}
      <div className="flex flex-col space-y-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          {renderTabs()}
          
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
               {mode === 'medical' ? 'Diagnostic Interface' : 'Input Data'}
            </h2>
            <p className="text-sm text-slate-500">
              {mode === 'text' ? 'Analyze text for sentiment & NLP keywords.' : 
               mode === 'camera' ? 'Capture facial expressions.' : 
               mode === 'voice' ? 'Record voice tone.' : 
               'Use medical tools to capture vitals and generate wellness plans.'}
            </p>
          </div>
          
          {mode === 'medical' ? renderMedicalInterface() : (
            <div className="flex-1 min-h-[300px] flex flex-col relative">
                {mode === 'text' && (
                  <textarea
                    className="flex-1 w-full p-4 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white resize-none h-64 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Enter text to analyze..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                )}
                {mode === 'camera' && (
                    <div className="relative h-64 bg-black rounded-lg overflow-hidden flex items-center justify-center group">
                         {capturedImage ? <img src={capturedImage} className="w-full h-full object-cover" /> : 
                          stream ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'}} /> : 
                          <div className="text-slate-500 flex flex-col items-center"><Camera className="mb-2"/>Camera Inactive</div>}
                         
                         {/* Controls Overlay */}
                         <div className="absolute bottom-4 z-20 flex gap-4">
                            {!stream && !capturedImage && (
                                <button onClick={startCamera} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium shadow-lg hover:bg-indigo-700 transition-all flex items-center">
                                    <Camera className="w-4 h-4 mr-2" /> Start Camera
                                </button>
                            )}
                            {stream && (
                                <>
                                    <button onClick={capturePhoto} className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold shadow-lg hover:bg-slate-50 transition-all flex items-center" title="Capture Image">
                                        <div className="w-3 h-3 bg-indigo-600 rounded-full mr-2"></div> Freeze
                                    </button>
                                    
                                    {!isVideoRecording ? (
                                      <button onClick={startVideoRecording} className="bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-red-600 transition-all flex items-center" title="Record Video">
                                          <Video className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <button onClick={stopVideoRecording} className="bg-white text-red-500 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-slate-50 transition-all flex items-center animate-pulse" title="Stop Recording">
                                          <StopCircle className="w-4 h-4" />
                                      </button>
                                    )}
                                </>
                            )}
                            {capturedImage && (
                                <button onClick={() => {setCapturedImage(null); startCamera()}} className="bg-white text-slate-700 px-4 py-2 rounded-full shadow-lg hover:bg-slate-50 transition-all flex items-center">
                                    <RefreshCcw className="w-4 h-4 mr-2" /> Retake
                                </button>
                            )}
                         </div>

                         {/* Recorded Video Download Link (Transient) */}
                         {recordedVideoUrl && (
                             <div className="absolute top-4 left-4 z-30 animate-in fade-in slide-in-from-top-2">
                                <a href={recordedVideoUrl} download="emosense-recording.webm" className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center hover:bg-emerald-600">
                                   <Download className="w-3 h-3 mr-1" /> Save Video
                                </a>
                             </div>
                         )}

                         {/* Camera Switcher */}
                         <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-full p-1 flex">
                             <button 
                                onClick={() => setFacingMode(p => p === 'user' ? 'environment' : 'user')} 
                                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                                title="Switch Camera"
                             >
                                <SwitchCamera className="w-5 h-5" />
                             </button>
                         </div>
                         
                         <canvas ref={canvasRef} className="hidden" />
                    </div>
                )}
                {mode === 'voice' && (
                    <div className="relative h-64 bg-slate-900 rounded-lg flex items-center justify-center">
                        {isRecording ? <div className="animate-pulse text-red-500 flex flex-col items-center"><Activity className="w-12 h-12 mb-2"/> Recording...</div> : 
                         audioBlob ? <div className="text-emerald-500">Audio Captured</div> :
                         <Mic className="w-12 h-12 text-slate-600"/>}
                         <div className="absolute bottom-4 flex gap-4">
                            {!isRecording && !audioBlob && <button onClick={startRecording} className="bg-indigo-600 text-white px-4 py-2 rounded">Record</button>}
                            {isRecording && <button onClick={stopRecording} className="bg-red-600 text-white px-4 py-2 rounded">Stop</button>}
                            {audioBlob && <button onClick={() => setAudioBlob(null)} className="text-white underline text-sm">Reset</button>}
                         </div>
                    </div>
                )}
            </div>
          )}
          
          <div className="mt-6 flex justify-between items-center">
             <span className="text-xs text-slate-400">Ready to process</span>
             {getActionButton()}
          </div>
          
          {error && (
             <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                {error}
             </div>
          )}
        </div>
      </div>

      {/* Output Section */}
      <div className="flex flex-col h-full">
        {result ? (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col animate-fade-in overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-100">
               <div>
                 <h2 className="text-lg font-semibold text-slate-800">
                   {result.source === 'Medical' ? 'Clinical Assessment' : 'Analysis Result'}
                 </h2>
                 <div className="flex items-center mt-2 space-x-2">
                    {result.source === 'Medical' ? <Stethoscope className="w-4 h-4 text-emerald-500" /> : <User className="w-4 h-4 text-indigo-500" />}
                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${result.source === 'Medical' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700 bg-indigo-50'}`}>
                      {result.source === 'Medical' ? result.medicalMetrics?.ecgStatus : `Type: ${result.personalityType}`}
                    </span>
                 </div>
               </div>
               <div className={`px-4 py-1.5 rounded-full text-sm font-bold border
                 ${result.sentiment === SentimentType.POSITIVE ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                   result.sentiment === SentimentType.NEGATIVE ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                   'bg-amber-50 text-amber-700 border-amber-200'}`}>
                 {result.sentiment.toUpperCase()}
               </div>
            </div>

            <div className="space-y-6">
              {/* MEDICAL REPORT CARD */}
              {result.medicalMetrics && (
                <div className="space-y-4">
                    {/* Vitals Summary */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-900 px-4 py-2 flex items-center justify-between">
                        <span className="text-white font-bold text-sm flex items-center"><Activity className="w-4 h-4 mr-2 text-emerald-400" /> VITAL SIGNS REPORT</span>
                        <span className="text-xs text-slate-400">AI ESTIMATE</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200">
                        <div className="bg-white p-3 text-center">
                            <span className="text-xs text-slate-400 block mb-1">HEART RATE</span>
                            <span className="text-xl font-bold text-slate-800">{result.medicalMetrics.heartRate}</span>
                        </div>
                        <div className="bg-white p-3 text-center">
                            <span className="text-xs text-slate-400 block mb-1">SpO2</span>
                            <span className="text-xl font-bold text-slate-800">{result.medicalMetrics.spO2}%</span>
                        </div>
                        <div className="bg-white p-3 text-center">
                            <span className="text-xs text-slate-400 block mb-1">RESP RATE</span>
                            <span className="text-xl font-bold text-slate-800">{result.medicalMetrics.respirationRate}</span>
                        </div>
                        <div className="bg-white p-3 text-center">
                            <span className="text-xs text-slate-400 block mb-1">TEMP</span>
                            <span className="text-xl font-bold text-slate-800">{result.medicalMetrics.temperature}°F</span>
                        </div>
                    </div>
                    <div className="p-4 bg-white border-t border-slate-200">
                        <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase flex items-center">
                             <Tag className="w-3 h-3 mr-1" /> Primary Diagnosis
                        </h4>
                        <p className="text-lg font-semibold text-slate-800">{result.medicalMetrics.diagnosis}</p>
                        <div className="mt-1 flex items-center">
                            <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden mr-2">
                                <div className="h-full bg-emerald-500" style={{ width: `${(result.medicalMetrics.confidenceScore || 0.85) * 100}%` }}></div>
                            </div>
                            <span className="text-xs text-slate-500">
                                {((result.medicalMetrics.confidenceScore || 0.85) * 100).toFixed(0)}% Confidence
                            </span>
                        </div>
                    </div>
                    </div>

                    {/* DEEP LEARNING IMPRESSIONS */}
                    {result.medicalMetrics.impressions && result.medicalMetrics.impressions.length > 0 && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                            <h3 className="text-sm font-bold text-indigo-800 mb-3 flex items-center">
                                <Eye className="w-4 h-4 mr-2" /> Visual Clinical Impressions
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {result.medicalMetrics.impressions.map((imp, idx) => (
                                    <span key={idx} className="bg-white text-indigo-700 px-3 py-1 rounded-full text-xs font-medium border border-indigo-200 shadow-sm">
                                        {imp}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PRESCRIPTION PAD */}
                    {result.medicalMetrics.medications && result.medicalMetrics.medications.length > 0 && (
                        <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm relative">
                            <div className="absolute top-0 left-0 w-2 h-full bg-red-400"></div>
                            <div className="p-4 pl-6">
                                <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-2">
                                    <div>
                                        <h3 className="font-serif text-xl font-bold text-slate-800 italic">Rx Prescription</h3>
                                        <p className="text-[10px] text-slate-400">Generated for: <span className="font-bold text-slate-600 uppercase">{patientProfile}</span></p>
                                    </div>
                                    <Pill className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div className="space-y-3">
                                    {result.medicalMetrics.medications.map((med, idx) => (
                                        <div key={idx} className="flex flex-col pb-2 border-b border-dashed border-slate-200 last:border-0">
                                            <div className="flex justify-between">
                                                <span className="font-bold text-slate-800">{med.name}</span>
                                                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{med.type}</span>
                                            </div>
                                            <div className="text-sm text-slate-600 mt-1">
                                                {med.dosage} • {med.frequency} • {med.duration}
                                            </div>
                                            <div className="text-xs text-slate-400 italic mt-0.5">
                                                Indication: {med.purpose}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                                    DISCLAIMER: This is a simulation. Consult a real doctor before taking medication.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              )}
              
              {/* NEW: Routine & Exercise Section */}
              {renderRoutineSection(result.dailyRoutine)}

              {/* NLP Keywords Section */}
              {result.keywords && result.keywords.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                   <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                      <Tag className="w-3 h-3 mr-1" /> NLP Keywords (Stemmed)
                   </h3>
                   <div className="flex flex-wrap gap-2">
                      {result.keywords.map((kw, i) => (
                         <span key={i} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-mono">
                           {kw}
                         </span>
                      ))}
                   </div>
                </div>
              )}

              {/* Emotions & PCA Graph (Skip PCA if Medical Mode) */}
              {mode !== 'medical' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Detected Emotions</h3>
                   <div className="flex flex-wrap gap-2">
                    {result.emotions.map((emo, idx) => (
                      <div key={idx} className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-full justify-between">
                        <span className="text-sm font-medium text-slate-700">{emo.name}</span>
                        <div className="flex items-center">
                          <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden mr-2">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${emo.score * 100}%` }}/>
                          </div>
                          <span className="text-xs text-slate-500">{(emo.score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                   {result.pcaPoint && renderPcaChart(result.pcaPoint)}
                </div>
              </div>
              )}

              {/* Summary */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                 <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-indigo-500"/> Summary
                 </h3>
                 <p className="text-slate-600 text-sm leading-relaxed">{result.summary}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
               <Activity className="w-8 h-8 text-slate-300" />
             </div>
             <h3 className="text-lg font-medium text-slate-700">Ready to Analyze</h3>
             <p className="text-slate-500 max-w-xs mt-2">
               Provide input to generate emotional analysis or medical wellness reports.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analyzer;
