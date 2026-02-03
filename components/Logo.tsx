import React, { useState } from 'react';

export const Logo = ({ className = "w-full" }: { className?: string }) => {
  const [error, setError] = useState(false);

  // Link provided: https://drive.google.com/file/d/1IKEQbaGqr9Y25bGvzrHyWzMbv0MaHoPN/view?usp=sharing
  // We use the thumbnail API (sz=w1000) to ensure high-quality loading without 403 restrictions.
  const imageId = "1IKEQbaGqr9Y25bGvzrHyWzMbv0MaHoPN";
  const src = `https://drive.google.com/thumbnail?id=${imageId}&sz=w1000`;

  if (error) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-4`}>
        <span className="text-4xl mb-2">🦅</span>
        <span className="text-[10px] font-black uppercase text-slate-400 text-center leading-tight">TEKAN<br/>PEACE DESK</span>
      </div>
    );
  }

  return (
    <div className={`${className} relative flex items-center justify-center perspective-[1200px] group`}>
      <style>
        {`
          @keyframes float-3d {
            0% { transform: rotateY(-10deg) rotateX(10deg) translateY(0px); }
            50% { transform: rotateY(10deg) rotateX(5deg) translateY(-10px); }
            100% { transform: rotateY(-10deg) rotateX(10deg) translateY(0px); }
          }
        `}
      </style>
       <img 
        src={src}
        alt="TEKAN PEACE DESK AWAKE Logo" 
        className="object-contain h-full w-full transition-all duration-700 ease-out"
        style={{
            filter: 'drop-shadow(0px 25px 35px rgba(0,0,0,0.7)) brightness(1.1) contrast(1.15)',
            transformStyle: 'preserve-3d',
            animation: 'float-3d 6s ease-in-out infinite'
        }}
        loading="eager"
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
      />
      
      {/* Dynamic light reflection */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none mix-blend-overlay"></div>
    </div>
  );
};