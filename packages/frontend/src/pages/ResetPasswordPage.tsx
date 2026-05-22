import React, { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ToastContainer, type ToastMessage } from '@/components/Toast';

export const ResetPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  // ===== TOAST FUNCTIONS =====
  const addToast = (msg: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setMessages(prev => [...prev, { id, msg, type, duration }]);
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const passwordHint = 'Mínimo 8 caracteres, con mayúscula, minúscula y número.';

  const isStrongPassword = useMemo(() => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  }, [password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      addToast('El token de recuperación es obligatorio', 'error');
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
      await resetPassword(token.trim(), password);
      addToast('Contraseña actualizada con éxito. Redirigiendo...', 'success');
      setTimeout(() => navigate('/login'), 1500);
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
              <path d="M17 8h-1V6a4 4 0 00-8 0v2H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2v-8a2 2 0 00-2-2zm-7-2a2 2 0 114 0v2h-4V6zm2 7a2 2 0 110 4 2 2 0 010-4z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight mt-3">
            Nueva contraseña
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
            Seguridad U-Ride
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold text-black">
              Restablecer credenciales
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Completa los campos a continuación para configurar tu nueva contraseña de acceso.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Token de recuperación
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Pega el token recibido o usa el enlace"
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-black placeholder-zinc-300 outline-none transition-all duration-200 focus:border-black focus:bg-white focus:ring-1 focus:ring-black font-mono"
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
                placeholder="Mínimo 8 caracteres"
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-black placeholder-zinc-300 outline-none transition-all duration-200 focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
              />
              <p className="text-[10px] font-medium text-zinc-400">
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
                placeholder="Repite la nueva contraseña"
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
                  <span>Actualizando...</span>
                </>
              ) : (
                'Restablecer contraseña'
              )}
            </button>
          </form>
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

