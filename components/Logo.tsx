import React, { useState } from 'react';
import { Sun } from 'lucide-react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'large';
}

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'default' }) => {
  const [imageError, setImageError] = useState(false);

  // Link para a logo na pasta public
  const logoUrl = "/logo.png"; 

  // Determina o tamanho baseado na variante, mas permite override via className
  const containerSize = variant === 'large' ? "w-48 h-48 md:w-64 md:h-64" : "w-10 h-10";
  const iconSize = variant === 'large' ? 80 : 24;

  if (imageError || !logoUrl) {
    return (
      <div 
        className={`relative flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-blue-700 via-blue-900 to-slate-950 border-2 border-yellow-500/50 shadow-lg shadow-blue-900/50 ${containerSize} ${className}`}
        title="Anjos da Paz"
      >
        {/* Decorative Circles (CSS Art) */}
        <div className="absolute inset-0 border-[3px] border-white/20 rounded-full scale-90"></div>
        <div className="absolute inset-0 border-[1px] border-white/10 rounded-full scale-75"></div>
        
        {/* Angelic Sun Icon */}
        <div className="z-10 animate-pulse">
           <Sun 
            size={iconSize} 
            className="text-yellow-400 drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]" 
            fill="currentColor"
            fillOpacity={0.2}
          />
        </div>
        
        {/* Shine effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50"></div>
      </div>
    );
  }

  return (
    <img 
      src={logoUrl}
      alt="Logo Anjos da Paz" 
      className={`object-contain transition-transform hover:scale-105 ${className}`}
      onError={() => setImageError(true)}
    />
  );
};