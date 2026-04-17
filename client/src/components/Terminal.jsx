import { useState, useEffect } from 'react';

const Terminal = ({ explanation }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    if (!explanation || typeof explanation !== 'string' || explanation.trim() === '') return;
    
    let currentIndex = 0;
    let intervalId;
    setDisplayedText('');
    
    const delayId = setTimeout(() => {
      intervalId = setInterval(() => {
        if (currentIndex <= explanation.length) {
          setDisplayedText(prev => explanation.slice(0, currentIndex));
          currentIndex += 1;
        } else {
          clearInterval(intervalId);
        }
      }, 20);
    }, 50);
    
    return () => {
      clearTimeout(delayId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [explanation]);

  return (
    <div className="bg-[#050505] border border-batman-border rounded-lg p-4 font-mono text-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden h-32 flex flex-col">
      <div className="flex items-center gap-2 border-b border-batman-border/50 pb-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-batman-yellow animate-pulse"></div>
        <span className="text-batman-yellow text-xs tracking-widest uppercase opacity-70">Bat-Computer Analysis</span>
      </div>
      <div className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)] leading-relaxed flex-1 overflow-y-auto">
        <span className="text-batman-muted mr-2">&gt;</span>
        {displayedText}
        <span className="inline-block w-2.5 h-4 bg-green-400 ml-1 animate-pulse align-middle opacity-80" />
      </div>
      
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]" />
    </div>
  );
};

export default Terminal;
