import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

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
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [expiresInMinutes, setExpiresInMinutes] = useState<number | null>(null);
  const institutionalEmailRegex = /^[a-z0-9._%+-]+@uta\.edu\.ec$/;

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();

    if (!institutionalEmailRegex.test(normalizedEmail)) {
      setError('Solo se permiten correos institucionales @uta.edu.ec');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
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
      setError(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyEmail(email, code);
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 border border-[#ccc] text-[#1a1a2e] text-sm bg-[#fafaf8] outline-none transition-colors duration-200 focus:border-[#1a1a2e] focus:bg-white placeholder-[#bbb]';
  const inputStyle = { borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-[#f5f3ef]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
      `}</style>

      <div className="w-full max-w-md">
        <div className="bg-white border border-[#d8d4cc] overflow-hidden" style={{ borderRadius: '4px' }}>
          <div className="bg-[#1a1a2e] px-10 py-10 text-center">
            <div
              className="inline-flex items-center justify-center w-12 h-12 bg-[#c8a96e] mb-4"
              style={{ borderRadius: '2px' }}
            >
              <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
              </svg>
            </div>
            <h1
              className="text-white text-2xl tracking-wide m-0"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {step === 'register' ? 'Crear cuenta' : 'Verificar email'}
            </h1>
            <p className="text-[#8a8fa8] text-xs tracking-widest uppercase mt-1 mb-0">
              Únete a la comunidad U-Ride
            </p>
            <div className="w-10 h-px bg-[#c8a96e] mx-auto mt-4" />
          </div>

          <div className="px-10 py-8">
            <div className="flex gap-1.5 mb-7">
              <div
                className="flex-1 h-0.5 transition-colors duration-300"
                style={{ background: '#c8a96e', borderRadius: '1px' }}
              />
              <div
                className="flex-1 h-0.5 transition-colors duration-300"
                style={{ background: step === 'verify' ? '#c8a96e' : '#e8e4dc', borderRadius: '1px' }}
              />
            </div>

            <p className="text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-6">
              {step === 'register' ? 'Datos de registro' : 'Código de verificación'}
            </p>

            {error && (
              <div className="mb-5 px-4 py-3 bg-[#fdf2f2] border-l-2 border-[#c0392b] text-[#c0392b] text-sm">
                {error}
              </div>
            )}

            {hint && (
              <div className="mb-5 px-4 py-3 bg-[#fdf8f0] border-l-2 border-[#c8a96e] text-[#8a6a2e] text-sm">
                {hint}
              </div>
            )}

            {step === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Pérez"
                    required
                    disabled={loading}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">
                    Email institucional
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu.email@uta.edu.ec"
                    pattern="^[a-z0-9._%+-]+@uta\.edu\.ec$"
                    title="Ingresa un correo institucional @uta.edu.ec"
                    required
                    disabled={loading}
                    className={inputClass}
                    style={inputStyle}
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
                    placeholder="Mínimo 8 caracteres"
                    required
                    disabled={loading}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    required
                    disabled={loading}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#1a1a2e] text-white text-xs font-medium tracking-widest uppercase transition-colors duration-200 hover:bg-[#2d2d4e] disabled:opacity-50 mt-2"
                  style={{
                    borderRadius: '2px',
                    fontFamily: "'DM Sans', sans-serif",
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Registrando...' : 'Crear cuenta'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <p className="text-[#888] text-sm mb-2 leading-relaxed">
                  Hemos enviado un código de verificación a{' '}
                  <span className="text-[#c8a96e] font-medium">{email}</span>
                </p>
                {expiresInMinutes && (
                  <p className="text-[#888] text-xs mb-3">El código expira en {expiresInMinutes} minutos.</p>
                )}
                <div>
                  <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">
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
                    className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
                    style={inputStyle}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#1a1a2e] text-white text-xs font-medium tracking-widest uppercase transition-colors duration-200 hover:bg-[#2d2d4e] disabled:opacity-50 mt-2"
                  style={{
                    borderRadius: '2px',
                    fontFamily: "'DM Sans', sans-serif",
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Verificando...' : 'Verificar email'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <span className="text-[#888] text-sm">¿Ya tienes cuenta? </span>
              <Link to="/login" className="text-[#c8a96e] font-medium text-sm hover:underline">
                Inicia sesión
              </Link>
            </div>
          </div>

          <div className="px-10 py-5 border-t border-[#e8e4dc] bg-[#fafaf8]" />
        </div>
      </div>
    </div>
  );
};
