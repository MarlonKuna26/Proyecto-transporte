import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f5f3ef]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
      `}</style>

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white border border-[#d8d4cc] overflow-hidden" style={{ borderRadius: '4px' }}>

          {/* Header */}
          <div className="bg-[#1a1a2e] px-10 py-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#c8a96e] mb-4" style={{ borderRadius: '2px' }}>
              <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <h1 className="text-white text-2xl tracking-wide m-0" style={{ fontFamily: "'Playfair Display', serif" }}>
              U-Ride
            </h1>
            <p className="text-[#8a8fa8] text-xs tracking-widest uppercase mt-1 mb-0">
              Transporte seguro para estudiantes
            </p>
            <div className="w-10 h-px bg-[#c8a96e] mx-auto mt-4" />
          </div>

          {/* Body */}
          <div className="px-10 py-8">
            <p className="text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-7">
              Acceso institucional
            </p>

            {error && (
              <div className="mb-5 px-4 py-3 bg-[#fdf2f2] border-l-2 border-[#c0392b] text-[#c0392b] text-sm">
                {error}
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
                  placeholder="tu.email@institucion.edu"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-[#ccc] text-[#1a1a2e] text-sm bg-[#fafaf8] outline-none transition-colors duration-200 focus:border-[#1a1a2e] focus:bg-white placeholder-[#bbb]"
                  style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-10 py-5 border-t border-[#e8e4dc] bg-[#fafaf8] text-center">
            <span className="text-[#888] text-sm">¿No tienes cuenta? </span>
            <Link
              to="/register"
              className="text-[#c8a96e] font-medium text-sm hover:underline"
            >
              Regístrate aquí
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
