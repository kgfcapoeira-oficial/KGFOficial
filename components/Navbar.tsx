import React, { useState } from 'react';
import { Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { Logo } from './Logo';
import { useLanguage } from '../src/i18n/LanguageContext';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, toggleLanguage, language } = useLanguage();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-sky-200 shadow-sm shadow-sky-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer flex items-center gap-3" onClick={() => onNavigate('home')}>
            <Logo className="h-10 w-10" />
            <span className="font-extrabold text-2xl tracking-tight hidden sm:block bg-gradient-to-r from-blue-700 via-sky-500 to-blue-700 text-transparent bg-clip-text">
              Anjos da Paz
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">


            {user ? (
              <>
                <div className="text-gray-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                  <UserIcon size={16} />
                  {t('nav.hello')}, {user.name} ({user.role})
                </div>
                <button
                  onClick={onLogout}
                  className="bg-sky-100 hover:bg-sky-200 text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {t('nav.login')}
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden items-center gap-2">

            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-sky-100 focus:outline-none"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-sky-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user ? (
              <>
                <div className="text-gray-600 block px-3 py-2 rounded-md text-base font-medium">
                  {t('nav.hello')}, {user.name}
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="text-gray-600 hover:bg-sky-100 hover:text-gray-900 block w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
                >
                  <LogOut size={18} />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onNavigate('login');
                  setIsOpen(false);
                }}
                className="text-blue-500 hover:bg-sky-100 block w-full text-left px-3 py-2 rounded-md text-base font-medium"
              >
                {t('nav.student_area')}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
