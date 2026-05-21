import React, { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devHint, setDevHint] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDevHint('');
    setLoading(true);

    try {
      const result = await requestPasswordReset(email.trim().toLowerCase());
      setSuccess('Si el correo existe, enviaremos un enlace de recuperación.');
      if (result?.resetUrl) {
        setDevHint(`Enlace (dev): ${result.resetUrl}`);
      } else if (result?.resetToken) {
        setDevHint(`Token (dev): ${result.resetToken}`);
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo solicitar la recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 font-sans selection:bg-black selection:text-white">
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
          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold text-black">
              Restablecer contraseña
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Ingresa tu correo institucional y te enviaremos las instrucciones de recuperación.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3.5 text-xs rounded-xl bg-red-50 text-red-600 border border-red-100/60 animate-fade-in">
              <svg className="shrink-0 w-4 h-4 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 p-3.5 text-xs rounded-xl bg-zinc-50 text-black border border-zinc-200/80 animate-fade-in">
              <svg className="shrink-0 w-4 h-4 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="font-semibold leading-relaxed">{success}</span>
            </div>
          )}

          {devHint && (
            <div className="p-3.5 text-xs rounded-xl bg-amber-50 text-amber-800 border border-amber-100/60 break-all font-mono leading-relaxed space-y-1">
              <div className="font-bold text-[10px] uppercase tracking-wider text-amber-900">Entorno Desarrollo:</div>
              <div>{devHint}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  <span>Enviando...</span>
                </>
              ) : (
                'Enviar enlace'
              )}
            </button>
          </form>
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

