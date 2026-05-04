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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f5f3ef]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
      `}</style>

      <div className="w-full max-w-md">
        <div className="bg-white border border-[#d8d4cc] overflow-hidden" style={{ borderRadius: '4px' }}>
          <div className="bg-[#1a1a2e] px-10 py-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#c8a96e] mb-4" style={{ borderRadius: '2px' }}>
              <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                <path d="M12 2a7 7 0 00-7 7v3H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2v-6a2 2 0 00-2-2h-1V9a7 7 0 00-7-7zm-5 7a5 5 0 0110 0v3H7V9zm5 6a2 2 0 110 4 2 2 0 010-4z" />
              </svg>
            </div>
            <h1 className="text-white text-2xl tracking-wide m-0" style={{ fontFamily: "'Playfair Display', serif" }}>
              Recuperar contraseña
            </h1>
            <p className="text-[#8a8fa8] text-xs tracking-widest uppercase mt-1 mb-0">
              Acceso institucional
            </p>
            <div className="w-10 h-px bg-[#c8a96e] mx-auto mt-4" />
          </div>

          <div className="px-10 py-8">
            <p className="text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-7">
              Solicitud de recuperación
            </p>

            {error && (
              <div className="mb-5 px-4 py-3 bg-[#fdf2f2] border-l-2 border-[#c0392b] text-[#c0392b] text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 px-4 py-3 bg-[#f2f8ff] border-l-2 border-[#1a1a2e] text-[#1a1a2e] text-sm">
                {success}
              </div>
            )}

            {devHint && (
              <div className="mb-5 px-4 py-3 bg-[#fdf8f0] border-l-2 border-[#c8a96e] text-[#8a6a2e] text-sm break-words">
                {devHint}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">
                  Email institucional
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.email@uta.edu.ec"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-[#ccc] text-[#1a1a2e] text-sm bg-[#fafaf8] outline-none transition-colors duration-200 focus:border-[#1a1a2e] focus:bg-white placeholder-[#bbb]"
                  style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1a1a2e] text-white text-xs font-medium tracking-widest uppercase transition-colors duration-200 hover:bg-[#2d2d4e] disabled:opacity-50 mt-2"
                style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif", border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          </div>

          <div className="px-10 py-5 border-t border-[#e8e4dc] bg-[#fafaf8] text-center">
            <span className="text-[#888] text-sm">¿Ya recordaste? </span>
            <Link
              to="/login"
              className="text-[#c8a96e] font-medium text-sm hover:underline"
            >
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
