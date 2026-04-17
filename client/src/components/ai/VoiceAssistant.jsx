import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { motionConfigs } from '../animations/BatOverlay';

const VoiceAssistant = ({ voiceInsight }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [userActivated, setUserActivated] = useState(false);
  const [voicesAvailable, setVoicesAvailable] = useState(false);
  const queueRef = useRef([]);
  const synthRef = useRef(window.speechSynthesis);
  const isSpeakingRef = useRef(false);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      if (synthRef.current) {
        const voices = synthRef.current.getVoices();
        setVoicesAvailable(voices.length > 0);
      }
    };

    loadVoices();
    synthRef.current?.addEventListener('voiceschanged', loadVoices);
    return () => {
      synthRef.current?.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Require user interaction to activate audio
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserActivated(true);
    };

    const removeListeners = () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };

    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('keydown', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, { once: true });

    return removeListeners;
  }, []);

  const processQueue = useCallback(() => {
    if (isSpeakingRef.current || isMuted || queueRef.current.length === 0 || !userActivated || !voicesAvailable) {
      return;
    }
    
    const text = queueRef.current.shift();
    if (!text) return;

    setTranscript(text);
    isSpeakingRef.current = true;
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.7;
    utterance.rate = 0.85;
    utterance.volume = 1;

    try {
      const voices = synthRef.current.getVoices();
      const techVoice = voices.find(v => 
        v.name.toLowerCase().includes('google') || 
        v.name.toLowerCase().includes('samantha') ||
        v.lang === 'en-US'
      ) || voices[0];
      
      if (techVoice) {
        utterance.voice = techVoice;
      }
    } catch (error) {
      console.warn('Could not set voice:', error);
    }

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setTimeout(() => processQueue(), 600);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setTimeout(() => processQueue(), 500);
    };

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setIsSpeaking(true);
    };

    try {
      synthRef.current.cancel();
      synthRef.current.speak(utterance);
    } catch (error) {
      console.error('Error calling speak():', error);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setTimeout(() => processQueue(), 500);
    }
  }, [isMuted, userActivated, voicesAvailable]);

  // Queue new messages
  useEffect(() => {
    if (!voiceInsight?.message || typeof voiceInsight.message !== 'string' || !voiceInsight.message.trim()) {
      return;
    }
    
    // Prevent duplicate queuing
    const lastInQueue = queueRef.current[queueRef.current.length - 1];
    if (lastInQueue === voiceInsight.message) {
      return;
    }

    // Limit queue size
    if (queueRef.current.length >= 5) {
      queueRef.current.shift();
    }

    queueRef.current.push(voiceInsight.message);
    
    // Start processing if ready
    if (userActivated && !isMuted && !isSpeakingRef.current) {
      processQueue();
    }
  }, [voiceInsight, userActivated, isMuted, processQueue]);

  // Handle muting
  useEffect(() => {
    if (isMuted) {
      try {
        synthRef.current.cancel();
      } catch (error) {
        console.warn('Error canceling speech:', error);
      }
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      queueRef.current = [];
    } else if (!isMuted && queueRef.current.length > 0 && !isSpeakingRef.current) {
      processQueue();
    }
  }, [isMuted, processQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        synthRef.current.cancel();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    };
  }, []);

  const handleToggleVoice = useCallback(() => {
    setUserActivated(true);
    setIsMuted(prev => !prev);
  }, []);

  return (
    <AnimatePresence>
      {(isSpeaking || userActivated) && (
        <motion.div 
          {...motionConfigs.slideUp}
          className={`fixed bottom-4 right-4 z-40 p-3 rounded-md border flex flex-col gap-2 w-[280px] transition-colors backdrop-blur-md ${isSpeaking ? 'bg-batman-yellow/10 border-batman-yellow shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'bg-black/90 border-batman-border'}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Waveform Animation */}
              <div className="flex items-end gap-[2px] h-4 w-6">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={isSpeaking ? { height: ['4px', '16px', '4px'] } : { height: '4px' }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                    className={`w-[3px] ${isSpeaking ? 'bg-batman-yellow drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]' : 'bg-batman-muted'} rounded-t-sm`}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] text-batman-muted uppercase tracking-widest leading-none">
                {isMuted ? 'SILENCED' : isSpeaking ? 'SYS_VOICE_ACTIVE' : 'STANDBY'}
              </span>
            </div>
            
            <button 
              onClick={handleToggleVoice}
              className="text-batman-muted hover:text-white transition-colors"
              title={isMuted ? "Enable Voice" : "Disable Voice"}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
          
          {transcript && !isMuted && isSpeaking && (
            <motion.div 
              {...motionConfigs.fadeIn} 
              className="font-mono text-[11px] text-gray-200 border-t border-batman-border/40 pt-2 break-words leading-relaxed"
            >
              <span className="text-batman-yellow mr-2">&gt;</span>
              {transcript}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoiceAssistant;
