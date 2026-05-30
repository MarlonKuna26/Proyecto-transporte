import React, { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ToastContainer, type ToastMessage } from '@/components/Toast';

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset, resetPassword } = useAuth();
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const [devCode, setDevCode] = useState('');

  // ===== TOAST FUNCTIONS =====
  const addToast = (msg: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setMessages(prev => [...prev, { id, msg, type, duration }]);
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  // ===== STEP 1: Solicitar código por email =====
  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    setDevCode('');
    setLoading(true);

    try {
      const result = await requestPasswordReset(email.trim().toLowerCase());
      addToast('Se envió un código de verificación a tu correo.', 'success');
      if (result?.code) {
        setDevCode(`Código (dev): ${result.code}`);
      }
      setStep('verify');
    } catch (err: any) {
      addToast(err.message || 'No se pudo solicitar el código', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ===== STEP 2: Verificar código y cambiar contraseña =====
  const passwordHint = 'Mínimo 8 caracteres, con mayúscula, minúscula y número.';

  const isStrongPassword = useMemo(() => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  }, [password]);

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      addToast('El código de verificación es obligatorio', 'error');
      return;
    }

    if (!isStrongPassword) {
      addToast('La contraseña no cumple con los requisitos mínimos de seguridad', 'error');
      return;
    }

    if (password !== confirmPassword) {
      addToast('Las contraseñas no coinciden', 'error');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase(), code.trim(), password);
      addToast('Contraseña actualizada con éxito. Redirigiendo a inicio de sesión...', 'success');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err: any) {
      addToast(err.message || 'No se pudo actualizar la contraseña', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 font-sans selection:bg-black selection:text-white">
      {/* ═══ TOAST NOTIFICATIONS ═══ */}
      <ToastContainer messages={messages} onClose={removeToast} />

      <div className="w-full max-w-[420px] space-y-6">
        
        {/* Logo / Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-black rounded-2xl shadow-lg border border-zinc-800 transition-transform duration-300 hover:scale-105">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 00-7 7v3H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2v-6a2 2 0 00-2-2h-1V9a7 7 0 00-7-7zm-5 7a5 5 0 0110 0v3H7V9zm5 6a2 2 0 110 4 2 2 0 010-4z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight mt-3">
            Recuperar
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
            Seguridad U-Ride
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xl p-8 space-y-6">
          {step === 'email' ? (
            <>
              <div className="space-y-1.5">
                <h2 className="text-lg font-extrabold text-black">
                  Restablecer contraseña
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  Ingresa tu correo institucional y te enviaremos un código de verificación.
                </p>
              </div>

              {devCode && (
                <div className="p-3.5 text-xs rounded-xl bg-white text-black border border-amber-500/80 break-all font-mono leading-relaxed space-y-1 font-black">
                  <div className="font-bold text-[10px] uppercase tracking-wider text-black">Entorno Desarrollo:</div>
                  <div>{devCode}</div>
                </div>
              )}

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Email institucional
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@uta.edu.ec"
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-black placeholder-zinc-300 outline-none transition-all duration-200 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-800 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-md shadow-black/10"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Enviando código...</span>
                    </>
                  ) : (
                    'Enviar código'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <h2 className="text-lg font-extrabold text-black">
                  Cambiar contraseña
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  Ingresa el código recibido en tu correo y tu nueva contraseña.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Código de verificación
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-black placeholder-zinc-300 outline-none transition-all duration-200 focus:border-black focus:bg-white focus:ring-1 focus:ring-black text-center tracking-widest"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className={`w-full px-4 py-3 bg-zinc-50 border rounded-xl text-sm font-semibold text-black placeholder-zinc-300 outline-none transition-all duration-200 ${
                      password ? (isStrongPassword ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500' : 'border-red-500 focus:ring-1 focus:ring-red-500') : 'border-zinc-200 focus:border-black focus:bg-white focus:ring-1 focus:ring-black'
                    }`}
                  />
                  <p className={`text-[10px] font-medium ${isStrongPassword ? 'text-green-600' : 'text-zinc-400'}`}>
                    {passwordHint}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className={`w-full px-4 py-3 bg-zinc-50 border rounded-xl text-sm font-semibold text-black placeholder-zinc-300 outline-none transition-all duration-200 ${
                      confirmPassword ? (password === confirmPassword ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500' : 'border-red-500 focus:ring-1 focus:ring-red-500') : 'border-zinc-200 focus:border-black focus:bg-white focus:ring-1 focus:ring-black'
                    }`}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setCode('');
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    disabled={loading}
                    className="flex-1 py-3.5 bg-zinc-100 text-black text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !isStrongPassword || password !== confirmPassword}
                    className="flex-1 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-800 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-md shadow-black/10"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Actualizando...</span>
                      </>
                    ) : (
                      'Actualizar contraseña'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer links */}
        <div className="text-center text-xs font-semibold">
          <span className="text-zinc-400">¿Ya recordaste tu contraseña? </span>
          <Link to="/login" className="text-black hover:underline underline-offset-4 decoration-2">
            Inicia sesión
          </Link>
        </div>

      </div>
    </div>
  );
};

