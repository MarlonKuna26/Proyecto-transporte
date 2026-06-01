import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ToastContainer, type ToastMessage } from '@/components/Toast';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, verifyEmail } = useAuth();
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const [hint, setHint] = useState('');
  const [expiresInMinutes, setExpiresInMinutes] = useState<number | null>(null);
  const institutionalEmailRegex = /^[a-z0-9._%+-]+@uta\.edu\.ec$/;
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  // ===== TOAST FUNCTIONS =====
  const addToast = (msg: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setMessages(prev => [...prev, { id, msg, type, duration }]);
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!institutionalEmailRegex.test(normalizedEmail)) {
      addToast('Solo se permiten correos institucionales @uta.edu.ec', 'error');
      return;
    }

    if (password !== confirmPassword) {
      addToast('Las contraseñas no coinciden', 'error');
      return;
    }

    if (!strongPasswordRegex.test(password)) {
      addToast('La contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula y número', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await register(normalizedEmail, name, password);
      setEmail(normalizedEmail);
      setExpiresInMinutes(result?.expiresInMinutes ?? 30);
      if (result?.verificationCode) {
        setHint(`Código de verificación (dev): ${result.verificationCode}`);
      }
      setStep('verify');
    } catch (err: any) {
      addToast(err.message || 'Error al registrar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyEmail(email, code);
      navigate('/login');
    } catch (err: any) {
      addToast(err.message || 'Código inválido', 'error');
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
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight mt-3">
            {step === 'register' ? 'Crear cuenta' : 'Verificar cuenta'}
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
            Únete a la comunidad U-Ride
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xl p-8 space-y-6">

          {/* Progress Indicators */}
          <div className="flex gap-2">
            <div className="flex-1 h-1 rounded-full bg-black transition-all duration-350" />
            <div className={`flex-1 h-1 rounded-full transition-all duration-350 ${step === 'verify' ? 'bg-black' : 'bg-zinc-100'}`} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold text-black">
              {step === 'register' ? 'Datos de registro' : 'Código de verificación'}
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              {step === 'register' ? 'Completa los campos para crear tu cuenta institucional.' : 'Ingresa el código enviado a tu correo institucional.'}
            </p>
          </div>

          {hint && (
            <div className="p-3.5 text-xs rounded-xl bg-white text-black border border-amber-500 break-all font-mono leading-relaxed space-y-1 animate-fade-in">
              <div className="font-bold text-[10px] uppercase tracking-wider text-black">Entorno Desarrollo:</div>
              <div>{hint}</div>
            </div>
          )}

          {step === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Pérez"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-black placeholder-zinc-300 outline-none transition-all duration-200 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Email institucional
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@uta.edu.ec"
                  pattern="^[-a-zA-Z0-9._%]+@uta\.edu\.ec$"
                  title="Ingresa un correo institucional @uta.edu.ec"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-black placeholder-zinc-300 outline-none transition-all duration-200 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-black placeholder-zinc-300 outline-none transition-all duration-200 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                />
                <p className="text-[10px] font-medium text-zinc-400">
                  Debe incluir al menos una mayúscula, una minúscula y un número.
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
                  placeholder="Repite tu contraseña"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-black placeholder-zinc-300 outline-none transition-all duration-200 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-800 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-md shadow-black/10 mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Registrando...</span>
                  </>
                ) : (
                  'Crear cuenta'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl space-y-1">
                <p className="text-xs text-zinc-500 font-medium">
                  Enviamos un código de verificación de 6 dígitos a:
                </p>
                <p className="text-sm font-extrabold text-black">{email}</p>
                {expiresInMinutes && (
                  <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">
                    Expira en {expiresInMinutes} minutos
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center">
                  Código de verificación
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={loading}
                  className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 rounded-xl text-2xl font-mono text-center tracking-[0.5em] text-black placeholder-zinc-300 outline-none transition-all duration-200 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
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
                    <span>Verificando...</span>
                  </>
                ) : (
                  'Verificar email'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer links */}
        <div className="text-center text-xs font-semibold">
          <span className="text-zinc-400">¿Ya tienes una cuenta? </span>
          <Link to="/login" className="text-black hover:underline underline-offset-4 decoration-2">
            Inicia sesión
          </Link>
        </div>

      </div>
    </div>
  );
};

