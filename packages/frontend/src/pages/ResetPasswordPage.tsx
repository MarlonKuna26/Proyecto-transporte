import React, { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const ResetPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const passwordHint = 'Minimo 8 caracteres, con mayuscula, minuscula y numero.';

  const isStrongPassword = useMemo(() => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  }, [password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token.trim()) {
      setError('El token de recuperacion es obligatorio');
      return;
    }

    if (!isStrongPassword) {
      setError('La contrasena no cumple los requisitos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token.trim(), password);
      setSuccess('Contrasena actualizada. Ya puedes iniciar sesion.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la contrasena');
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
                <path d="M17 8h-1V6a4 4 0 00-8 0v2H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2v-8a2 2 0 00-2-2zm-7-2a2 2 0 114 0v2h-4V6zm2 7a2 2 0 110 4 2 2 0 010-4z" />
              </svg>
            </div>
            <h1 className="text-white text-2xl tracking-wide m-0" style={{ fontFamily: "'Playfair Display', serif" }}>
              Nueva contrasena
            </h1>
            <p className="text-[#8a8fa8] text-xs tracking-widest uppercase mt-1 mb-0">
              Seguridad U-Ride
            </p>
            <div className="w-10 h-px bg-[#c8a96e] mx-auto mt-4" />
          </div>

          <div className="px-10 py-8">
            <p className="text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-7">
              Restablecer contrasena
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">
                  Token de recuperacion
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Pega tu token o usa el enlace"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-[#ccc] text-[#1a1a2e] text-sm bg-[#fafaf8] outline-none transition-colors duration-200 focus:border-[#1a1a2e] focus:bg-white placeholder-[#bbb]"
                  style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">
                  Nueva contrasena
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={passwordHint}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-[#ccc] text-[#1a1a2e] text-sm bg-[#fafaf8] outline-none transition-colors duration-200 focus:border-[#1a1a2e] focus:bg-white placeholder-[#bbb]"
                  style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}
                />
                <p className="text-[#888] text-xs mt-2">{passwordHint}</p>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">
                  Confirmar contrasena
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contrasena"
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
                {loading ? 'Actualizando...' : 'Actualizar contrasena'}
              </button>
            </form>
          </div>

          <div className="px-10 py-5 border-t border-[#e8e4dc] bg-[#fafaf8] text-center">
            <span className="text-[#888] text-sm">¿Ya tienes cuenta? </span>
            <Link
              to="/login"
              className="text-[#c8a96e] font-medium text-sm hover:underline"
            >
              Inicia sesion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
