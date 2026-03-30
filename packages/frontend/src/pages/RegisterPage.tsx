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

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }

    setLoading(true);
    try {
      const result = await register(email, name, password);
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

  return (
    <div className="page-gradient min-h-screen flex items-center justify-center p-4">
      <div className="fixed top-20 -right-32 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      <div className="fixed bottom-20 -left-32 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-primary-500 text-3xl mb-4">
            🎓
          </div>
          <h1 className="text-3xl font-bold text-white">Crear cuenta</h1>
          <p className="text-dark-400 mt-2">Únete a la comunidad U-Ride</p>
        </div>

        <div className="glass-card p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex-1 h-1 rounded-full ${step === 'register' ? 'bg-primary-500' : 'bg-accent-500'}`} />
            <div className={`flex-1 h-1 rounded-full ${step === 'verify' ? 'bg-accent-500' : 'bg-white/10'}`} />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <span>❌</span> {error}
            </div>
          )}

          {hint && (
            <div className="mb-4 p-3 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm">
              💡 {hint}
            </div>
          )}

          {step === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Nombre completo</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Pérez" required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Email institucional</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu.email@institucion.edu" required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Contraseña</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Confirmar contraseña</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite tu contraseña" required className="input-field" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-dark-300 text-sm mb-4">
                Hemos enviado un código de verificación a <span className="text-primary-400 font-medium">{email}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Código de verificación</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} required className="input-field text-center text-2xl tracking-[0.5em] font-mono" />
              </div>
              <button type="submit" disabled={loading} className="btn-accent w-full">
                {loading ? 'Verificando...' : 'Verificar email'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <span className="text-dark-400 text-sm">¿Ya tienes cuenta? </span>
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium text-sm transition-colors">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
