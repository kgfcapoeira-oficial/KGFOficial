import React from 'react';
import { Button } from '../components/Button';
import { Users, Calendar, MapPin, Instagram, ShoppingBag } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useLanguage } from '../src/i18n/LanguageContext';

interface Props {
  onLoginClick: () => void;
  onOpenStore: () => void;
}

export const Landing: React.FC<Props> = ({ onLoginClick, onOpenStore }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-20">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-slate-950/80 to-sky-100 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1542408375-9279769db387?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <div className="mb-8 animate-fade-in-down hover:scale-105 transition-transform duration-500">
             <Logo variant="large" className="drop-shadow-[0_0_50px_rgba(14,165,233,0.7)] md:drop-shadow-[0_0_80px_rgba(14,165,233,0.5)]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-4 sr-only">
            Anjos da Paz
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 font-light max-w-2xl">
            {t('landing.tagline')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
            <Button onClick={onLoginClick} className="text-lg px-8 py-4 w-full sm:w-auto shadow-blue-900/50 bg-gradient-to-r from-blue-700 to-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              {t('landing.cta')}
            </Button>

            <Button onClick={onOpenStore} variant="outline" className="text-lg px-8 py-4 w-full sm:w-auto flex items-center justify-center gap-2 border-amber-600/50 text-amber-700 hover:bg-amber-600 hover:text-white transition-all duration-300">
              <ShoppingBag size={24} />
              Nossa Loja Virtual
            </Button>
            
            <a 
              href="https://www.instagram.com/grupoanjosdapaz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button variant="outline" className="text-lg px-8 py-4 w-full flex items-center justify-center gap-2 hover:text-gray-900 hover:border-yellow-500 hover:bg-gradient-to-r hover:from-yellow-600 hover:to-yellow-500 transition-all duration-300 border-yellow-500/50">
                <Instagram size={24} />
                {t('landing.instagram')}
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-white py-24 px-4 border-t border-sky-200 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('landing.essence')}</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-blue-700 via-white to-blue-700 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-sky-50/60 backdrop-blur-md p-8 rounded-2xl border border-blue-500/20 hover:border-blue-400 transition-all group flex flex-col items-center text-center hover:-translate-y-2 duration-300 shadow-2xl">
              <div className="p-4 bg-white rounded-full mb-6 group-hover:bg-blue-600/20 transition-colors">
                <Users className="w-10 h-10 text-blue-700 group-hover:text-gray-900 transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('landing.community')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('landing.community_desc')}</p>
            </div>
            
            <div className="bg-sky-50/60 backdrop-blur-md p-8 rounded-2xl border border-blue-500/20 hover:border-blue-400 transition-all group flex flex-col items-center text-center hover:-translate-y-2 duration-300 shadow-2xl">
              <div className="p-4 bg-white rounded-full mb-6 group-hover:bg-blue-600/20 transition-colors">
                <Calendar className="w-10 h-10 text-blue-700 group-hover:text-gray-900 transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('landing.classes')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('landing.classes_desc')}</p>
            </div>
            
            <div className="bg-sky-50/60 backdrop-blur-md p-8 rounded-2xl border border-blue-500/20 hover:border-blue-400 transition-all group flex flex-col items-center text-center hover:-translate-y-2 duration-300 shadow-2xl">
              <div className="p-4 bg-white rounded-full mb-6 group-hover:bg-blue-600/20 transition-colors">
                <MapPin className="w-10 h-10 text-blue-700 group-hover:text-gray-900 transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('landing.card3.title')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('landing.card3.desc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white py-12 px-4 border-t border-sky-300">
        <div className="max-w-7xl mx-auto flex justify-center items-center">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="text-gray-600 font-semibold">Anjos da Paz © 2005 — {t('landing.footer')}</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
