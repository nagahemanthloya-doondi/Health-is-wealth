import React, { useRef, useState, useEffect, useCallback } from 'react';
import { NeoButton, NeoCard, NeoInput } from './NeoComponents';
import { analyzeProductImage, analyzeProductText } from '../services/geminiService';
import { fetchProductFromOFF } from '../services/openFoodFactsService';
import { HealthyReport } from '../types';

interface ScannerProps {
  apiKey: string;
  onReportGenerated: (report: HealthyReport) => void;
}

const Scanner: React.FC<ScannerProps> = ({ apiKey, onReportGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("ANALYZING...");
  const [mode, setMode] = useState<'scan' | 'text'>('scan');
  const [textInput, setTextInput] = useState('');
  
  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  // Stop camera cleanup
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      window.clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Barcode detection loop
  const startBarcodeDetection = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!('BarcodeDetector' in window)) {
      console.log("BarcodeDetector not supported in this browser. Manual capture only.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const barcodeDetector = new (window as any).BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128']
    });

    detectionIntervalRef.current = window.setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            setDetectedCode(code);
            // Wait a brief moment to show user we found it, then capture
            if (!loading) {
                 stopCamera(); 
                 captureImage(code);
            }
          }
        } catch (e) {
          // Detection error (often silent)
        }
      }
    }, 500); 
  }, [loading, stopCamera]); 

  // Start camera logic
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setDetectedCode(null);
    
    // Safety timeout
    const timeoutId = setTimeout(() => {
        if (!streamRef.current) {
            setCameraError("CAMERA TIMED OUT. CHECK PERMISSIONS OR UPLOAD.");
        }
    }, 8000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      clearTimeout(timeoutId);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.onloadedmetadata = () => {
            setCameraActive(true);
            startBarcodeDetection();
        };
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Camera access error:", err);
      setCameraError("CAMERA PERMISSION DENIED OR UNAVAILABLE.");
    }
  }, [startBarcodeDetection]);

  const captureImage = async (barcodeVal?: string) => {
    if (!videoRef.current || !canvasRef.current) return;

    setLoading(true);
    setLoadingStatus("SCANNING IMAGE...");
    
    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
      
      const base64String = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      stopCamera();

      try {
        let offContext = null;
        let offImageUrl = null;

        if (barcodeVal) {
          setLoadingStatus("FETCHING PRODUCT DATA...");
          const productData = await fetchProductFromOFF(barcodeVal);
          if (productData) {
            offContext = JSON.stringify(productData);
            offImageUrl = productData.image_url;
            console.log("Found product in Open Food Facts:", productData.product_name);
          } else {
            console.log("Product not found in Open Food Facts, using Gemini Vision fallback.");
          }
        }

        setLoadingStatus("AI ANALYZING...");
        const report = await analyzeProductImage(apiKey, base64String, offContext);
        
        // Inject image if found
        if (offImageUrl) {
          report.product_image = offImageUrl;
        }

        onReportGenerated(report);
      } catch (err) {
        alert('ANALYSIS FAILED. TRY AGAIN.');
        console.error(err);
        setLoading(false);
      }
    }
  };

  // Switch modes
  useEffect(() => {
    if (mode === 'scan' && !loading) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, startCamera, stopCamera, loading]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    setLoading(true);
    setLoadingStatus("JUDGING YOUR CHOICE...");
    try {
      const report = await analyzeProductText(apiKey, textInput);
      onReportGenerated(report);
    } catch (err) {
      alert('TEXT ANALYSIS FAILED.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
  
      setLoading(true);
      setLoadingStatus("PROCESSING IMAGE...");
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];
          try {
            setLoadingStatus("AI ANALYZING...");
            // No barcode context for file upload unless we processed it via a library, but sticking to pure vision for upload
            const report = await analyzeProductImage(apiKey, base64String);
            onReportGenerated(report);
          } catch (err) {
            alert('ANALYSIS FAILED. TRY AGAIN.');
            console.error(err);
            setLoading(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
      <div className="flex gap-2 justify-center">
        <NeoButton 
          variant={mode === 'scan' ? 'primary' : 'secondary'}
          onClick={() => { setMode('scan'); }}
          className="flex-1"
          disabled={loading}
        >
          SCANNER
        </NeoButton>
        <NeoButton 
          variant={mode === 'text' ? 'primary' : 'secondary'}
          onClick={() => { setMode('text'); }}
          className="flex-1"
          disabled={loading}
        >
          MANUAL
        </NeoButton>
      </div>

      <NeoCard className="bg-white min-h-[350px] flex flex-col items-center justify-center text-center p-0 overflow-hidden relative">
        {loading ? (
          <div className="animate-pulse flex flex-col items-center gap-4 p-8 absolute inset-0 bg-white z-50 justify-center">
            <div className="w-16 h-16 border-8 border-black border-t-[#FFDE59] rounded-full animate-spin"></div>
            <h3 className="text-2xl font-black uppercase">PROCESSING</h3>
            <p className="font-mono text-sm bg-black text-white px-2">
              {loadingStatus}
            </p>
          </div>
        ) : (
          <>
            {mode === 'scan' && (
              <div className="w-full h-full flex flex-col relative bg-black min-h-[400px]">
                {/* Camera View */}
                <div className={`relative w-full h-[400px] bg-black ${cameraActive ? 'block' : 'hidden'}`}>
                     <video 
                       ref={videoRef}
                       autoPlay 
                       playsInline 
                       muted
                       className="w-full h-full object-cover"
                     />
                     <canvas ref={canvasRef} className="hidden" />
                     
                     {/* Overlay UI */}
                     <div className="absolute inset-0 border-[6px] border-black pointer-events-none z-10 opacity-30"></div>
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        {/* Target Box */}
                        <div className={`w-64 h-40 border-4 transition-colors duration-200 relative ${detectedCode ? 'border-[#7ED957]' : 'border-[#FFDE59]'}`}>
                           <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-black -translate-x-1 -translate-y-1"></div>
                           <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-black translate-x-1 -translate-y-1"></div>
                           <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-black -translate-x-1 translate-y-1"></div>
                           <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-black translate-x-1 translate-y-1"></div>
                           
                           {/* Scanning Line */}
                           {!detectedCode && (
                             <div className="w-full h-1 bg-[#FF5757] absolute top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_10px_#FF5757]"></div>
                           )}
                           
                           <div className="absolute -bottom-8 left-0 right-0 text-center">
                               <span className="bg-[#CB6CE6] text-white text-[10px] font-bold px-2 py-1 uppercase shadow-[2px_2px_0px_#000]">
                                 OPEN FOOD FACTS CONNECTED
                               </span>
                           </div>
                        </div>
                     </div>
                     
                     <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center px-4">
                        <NeoButton onClick={() => captureImage()} className="w-full py-4 text-xl shadow-none active:scale-95">
                           CAPTURE PHOTO
                        </NeoButton>
                     </div>
                </div>

                {/* Fallback / Initializing View */}
                {!cameraActive && (
                  <div className="flex flex-col items-center justify-center h-full p-6 bg-[#F0F0F0] border-4 border-black w-full min-h-[400px]">
                    <p className={`font-bold mb-4 text-center ${cameraError ? 'text-red-600' : 'text-black'}`}>
                         {cameraError ? cameraError : "INITIALIZING CAMERA..."}
                    </p>
                    
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                         <NeoButton onClick={() => fileInputRef.current?.click()} variant="primary">
                           UPLOAD PHOTO
                         </NeoButton>
                         <NeoButton onClick={startCamera} variant="secondary">
                           {cameraError ? "RETRY CAMERA" : "RELOAD CAMERA"}
                         </NeoButton>
                    </div>
                    
                    {!cameraError && (
                        <p className="mt-6 text-xs font-mono opacity-60">
                            Waiting for permissions...
                        </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {mode === 'text' && (
              <form onSubmit={handleTextSubmit} className="w-full p-6 flex flex-col justify-center h-full min-h-[400px]">
                <p className="mb-4 font-bold text-left">PASTE PRODUCT NAME OR DETAILS:</p>
                <NeoInput 
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="e.g., Snickers Bar 50g"
                  autoFocus
                />
                <NeoButton type="submit" className="w-full mt-4">
                  ANALYZE TEXT
                </NeoButton>
              </form>
            )}
          </>
        )}
        
        {/* Hidden File Input for Fallback */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileUpload}
        />
      </NeoCard>
    </div>
  );
};

export default Scanner;