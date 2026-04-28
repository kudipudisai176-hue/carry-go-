import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Volume2, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";
import { toast } from "sonner";

interface VoiceCallProps {
  userId: string; // The person we are calling or receiving from
  userName: string;
  currentUserId: string;
  currentUserName: string;
  isIncoming?: boolean;
  incomingSignal?: any;
  deliveryId?: string;
  onClose: () => void;
}

export default function VoiceCall({ userId, userName, currentUserId, currentUserName, isIncoming = false, incomingSignal, deliveryId, onClose }: VoiceCallProps) {
  const [callStatus, setCallStatus] = useState<"calling" | "ringing" | "connected" | "ended"> (isIncoming ? "ringing" : "calling");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const localStream = useRef<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Timer for connected calls
    let timer: NodeJS.Timeout;
    if (callStatus === "connected") {
      timer = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  useEffect(() => {
    const pc = new RTCPeerConnection({
       iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    peerConnection.current = pc;

    pc.ontrack = (event) => {
       if (audioRef.current) {
         audioRef.current.srcObject = event.streams[0];
       }
    };

    pc.onicecandidate = (event) => {
       if (event.candidate) {
         socket.emit("call_signal", { to: userId, signal: { type: "ice", candidate: event.candidate } });
       }
    };

    const setupCaller = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStream.current = stream;
        
        stream.getTracks().forEach(track => {
           pc.addTrack(track, stream);
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call_user", {
          userToCall: userId,
          signalData: offer,
          from: currentUserId,
          name: currentUserName,
          deliveryId
        });
      } catch (err) {
        console.error("Caller setup error", err);
        toast.error("Microphone access denied.");
        onClose();
      }
    };

    const setupReceiverInit = async () => {
       if (incomingSignal && incomingSignal.type === "offer") {
          try {
             await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));
          } catch (err) {
             console.error("Error setting remote description for offer", err);
          }
       }
    };

    if (!isIncoming) {
       setupCaller();
    } else {
       setupReceiverInit();
    }

    const handleCallAccepted = async (signal: any) => {
      setCallStatus("connected");
      if (signal && signal.type === "answer" && peerConnection.current) {
         try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
         } catch (err) {
            console.error("Error setting remote description for answer", err);
         }
      }
    };

    const handleCallSignal = async (signal: any) => {
      if (signal && signal.type === "ice" && signal.candidate && peerConnection.current) {
         try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
         } catch (e) {
            console.error("Error adding ice candidate", e);
         }
      }
    };

    const handleCallEnded = () => {
      setCallStatus("ended");
      setTimeout(onClose, 2000);
    };

    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_signal", handleCallSignal);
    socket.on("call_ended", handleCallEnded);

    return () => {
      localStream.current?.getTracks().forEach(track => track.stop());
      peerConnection.current?.close();
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_signal", handleCallSignal);
      socket.off("call_ended", handleCallEnded);
    };
  }, []);

  const handleEndCall = () => {
    socket.emit("end_call", { to: userId });
    setCallStatus("ended");
    setTimeout(onClose, 1000);
  };

  const handleAcceptCall = async () => {
    const pc = peerConnection.current;
    if (pc) {
      try {
         // Get mic access only upon accepting
         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
         localStream.current = stream;
         
         stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
         });

         const answer = await pc.createAnswer();
         await pc.setLocalDescription(answer);
         socket.emit("answer_call", { to: userId, signal: answer });
         setCallStatus("connected");
      } catch (err) {
         console.error("Error accepting call", err);
         toast.error("Microphone access denied.");
         onClose();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-6"
    >
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col items-center text-center space-y-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent" />
        
        {/* Profile Avatar */}
        <div className="relative">
          <div className={`h-32 w-32 rounded-[3rem] bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-2xl ${callStatus === 'connected' ? '' : 'animate-pulse'}`}>
            <User className="h-16 w-16" />
          </div>
          {callStatus !== "ended" && (
            <div className="absolute -inset-4 border-2 border-white/10 rounded-[3.5rem] animate-ping opacity-20" />
          )}
        </div>

        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl font-black text-white px-4">{userName}</h2>
          <p className="text-xs font-bold text-orange-500 uppercase tracking-[0.3em]">
            {callStatus === "calling" && "Calling..."}
            {callStatus === "ringing" && "Incoming Call"}
            {callStatus === "connected" && formatTime(callDuration)}
            {callStatus === "ended" && "Call Ended"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-8 relative z-10">
          {callStatus === "ringing" ? (
            <>
              <Button onClick={handleEndCall} size="icon" variant="destructive" className="h-16 w-16 rounded-full shadow-2xl shadow-red-500/40 active:scale-90 transition-all">
                <PhoneOff className="h-7 w-7" />
              </Button>
              <Button onClick={handleAcceptCall} size="icon" className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-2xl shadow-emerald-500/40 active:scale-90 transition-all">
                <Phone className="h-7 w-7" />
              </Button>
            </>
          ) : (
            <>
              <Button 
                 onClick={() => {
                   setIsMuted(!isMuted);
                   if (localStream.current) {
                     localStream.current.getAudioTracks().forEach(track => {
                       track.enabled = isMuted; // Toggle enabled state
                     });
                   }
                 }} 
                 variant="ghost" 
                 className={`h-14 w-14 rounded-full border border-white/10 ${isMuted ? 'bg-white/10 text-orange-500' : 'text-white'}`}>
                {isMuted ? <MicOff /> : <Mic />}
              </Button>
              <Button onClick={handleEndCall} size="icon" variant="destructive" className="h-16 w-16 rounded-full shadow-2xl shadow-red-500/40 active:scale-90 transition-all">
                <PhoneOff className="h-7 w-7" />
              </Button>
              <Button 
                onClick={() => {
                   if (audioRef.current) {
                      audioRef.current.muted = !audioRef.current.muted;
                   }
                }}
                variant="ghost" 
                className="h-14 w-14 rounded-full border border-white/10 text-white"
              >
                <Volume2 />
              </Button>
            </>
          )}
        </div>

        <audio ref={audioRef} autoPlay />
      </div>
    </motion.div>
  );
}
