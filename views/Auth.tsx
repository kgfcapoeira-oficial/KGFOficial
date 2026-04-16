import React, { useState } from 'react';
import { Button } from '../components/Button';
import { User } from '../types';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { Logo } from '../components/Logo';
import { supabase } from '../src/integrations/supabase/client';
import { useLanguage } from '../src/i18n/LanguageContext';

interface Props {
  onLogin: (user: User) => void;
  onBack: () => void;
}

export const Auth: React.FC<Props> = ({ onLogin, onBack }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              nickname: nickname,
            }
          }
        });
        if (error) throw error;
        alert(t('auth.verify_email'));
      } else {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Buscar perfil diretamente após login bem-sucedido
        if (signInData?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signInData.user.id)
            .single();

          if (profileError) throw new Error('Perfil não encontrado. Contate o administrador.');

          const loggedUser: User = {
            id: signInData.user.id,
            name: profile.first_name || signInData.user.email || 'Usuário',
            nickname: profile.nickname || undefined,
            email: profile.email || signInData.user.email || '',
            role: profile.role,
            belt: profile.belt || undefined,
            beltColor: profile.belt_color || undefined,
            professorName: profile.professor_name || undefined,
            birthDate: profile.birth_date || undefined,
            graduationCost: profile.graduation_cost != null ? parseFloat(String(profile.graduation_cost)) : profile.graduationcost != null ? parseFloat(String(profile.graduationcost)) : 0,
            phone: profile.phone || undefined,
            first_name: profile.first_name || undefined,
            last_name: profile.last_name || undefined,
            photo_url: profile.photo_url || profile.avatar_url || undefined,
            status: profile.status as 'active' | 'blocked' | undefined,
          };

          if (profile.status === 'blocked') throw new Error('Sua conta está bloqueada.');
          if (!profile.role) throw new Error('Perfil sem cargo definido. Contate o administrador.');

          onLogin(loggedUser);
          return;
        }
      }
    } catch (error: any) {
      alert(error.message || t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_0_50px_rgba(30,64,175,0.15)] border border-sky-300 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-sky-50 p-8 text-center relative overflow-hidden">
          <div className="relative z-10 flex justify-center mb-4">
            <Logo className="h-24 w-24 drop-shadow-[0_0_20px_rgba(14,165,233,0.5)]" variant="large" />
          </div>

          <h2 className="relative z-10 text-2xl font-bold text-gray-900">
            {isSignUp ? t('auth.signup.title') : t('auth.login.title')}
          </h2>
          <p className="relative z-10 text-gray-900/80 text-sm mt-2">
            {isSignUp ? t('auth.signup.subtitle') : t('auth.login.subtitle')}
          </p>

          <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
        </div>

        {/* Custom Auth Form */}
        <div className="p-8">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('common.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-600" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-lg py-2 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>
            
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('auth.full_name')}</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-gray-600" size={18} />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-white border border-sky-200 rounded-lg py-2 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder={t('common.name')}
                      required={isSignUp}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('auth.nickname')}</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 text-gray-600" size={18} />
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-white border border-sky-200 rounded-lg py-2 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder={t('profile.nickname')}
                      required={isSignUp}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-600" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-sky-300 rounded-lg py-2 pl-10 pr-10 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-600 hover:text-gray-900 transition-colors"
                  title={showPassword ? t('auth.hide_pw') : t('auth.show_pw')}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              className="mt-6 font-extrabold py-3 uppercase tracking-wider"
            >
              {loading ? t('common.loading') : (isSignUp ? t('auth.register') : t('nav.login'))}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {isSignUp ? (
              <p>
                {t('auth.have_account')}{' '}
                <button onClick={() => setIsSignUp(false)} className="text-blue-700 hover:text-gray-900 font-bold hover:underline transition-colors">
                  {t('nav.login')}
                </button>
              </p>
            ) : (
              <p>
                {t('auth.no_account')}{' '}
                <button onClick={() => setIsSignUp(true)} className="text-blue-700 hover:text-gray-900 font-bold hover:underline transition-colors">
                  {t('auth.signup_link')}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
