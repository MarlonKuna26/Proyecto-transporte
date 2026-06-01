import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ToastContainer, type ToastMessage } from '@/components/Toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/dashboard');
    } catch (err: any) {
      addToast(err.message || 'Error al iniciar sesión', 'error');
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
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
              <circle cx="7" cy="17" r="1" fill="white" />
              <circle cx="17" cy="17" r="1" fill="white" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight mt-3">
            U-Ride
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
            Transporte Universitario
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold text-black">
              Ingresar
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Accede usando tus credenciales institucionales de la UTA.
            </p>
          </div>

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

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Contraseña
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                  <span>Ingresando...</span>
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="flex flex-col gap-2.5 text-center text-xs font-semibold">
          <div>
            <span className="text-zinc-400">¿Olvidaste tu contraseña? </span>
            <Link to="/forgot-password" className="text-black hover:underline underline-offset-4 decoration-2">
              Recuperar acceso
            </Link>
          </div>
          <div>
            <span className="text-zinc-400">¿No tienes una cuenta? </span>
            <Link to="/register" className="text-black hover:underline underline-offset-4 decoration-2">
              Regístrate aquí
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

