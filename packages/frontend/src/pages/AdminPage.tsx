import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Report } from '@/types';

export const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [tab, setTab] = useState<'stats' | 'users' | 'reports'>('stats');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [s, u, r] = await Promise.all([api.admin.stats(), api.admin.users(), api.reports.list()]);
        setStats(s.data);
        setUsers(u.data || []);
        setReports(r.data || []);
      } catch { }
      setLoading(false);
    };
    load();
  }, []);

  const suspendUser = async (id: string) => {
    const reason = prompt('Razón de suspensión:');
    if (!reason) return;
    try {
      await api.admin.suspendUser(id, { reason, days: 7 });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_suspended: true } : u));
      setFeedback('Usuario suspendido');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) { setFeedback(err.message); }
  };

  const unsuspendUser = async (id: string) => {
    try {
      await api.admin.unsuspendUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_suspended: false } : u));
      setFeedback('Usuario reactivado');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) { setFeedback(err.message); }
  };

  const resolveReport = async (id: string, status: 'RESOLVED' | 'DISMISSED') => {
    const notes = prompt('Notas del administrador:');
    if (!notes) return;
    try {
      await api.reports.resolve(id, { status, adminNotes: notes });
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      setFeedback('Reporte resuelto');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) { setFeedback(err.message); }
  };

  const tabs = [
    { key: 'stats', label: '📊 Estadísticas', icon: '📊' },
    { key: 'users', label: '👥 Usuarios', icon: '👥' },
    { key: 'reports', label: '🚩 Reportes', icon: '🚩' },
  ];

  if (loading) return <div className="max-w-6xl mx-auto"><div className="glass-card p-12 animate-pulse text-center"><div className="h-4 bg-white/10 rounded w-48 mx-auto" /></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">⚙️ Panel de administración</h1>

      {feedback && <div className="p-3 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm">✅ {feedback}</div>}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${tab === t.key ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-dark-400 hover:bg-white/5'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Usuarios', value: stats.users?.total, sub: `${stats.users?.verified} verificados`, icon: '👥', color: 'from-primary-500 to-primary-600' },
            { label: 'Viajes', value: stats.rides?.total, sub: `${stats.rides?.active} activos`, icon: '🚗', color: 'from-accent-500 to-accent-600' },
            { label: 'Solicitudes', value: stats.requests?.total, sub: `${stats.requests?.pending} pendientes`, icon: '📨', color: 'from-violet-500 to-violet-600' },
            { label: 'Reportes', value: stats.reports?.total, sub: `${stats.reports?.pending} pendientes`, icon: '🚩', color: 'from-amber-500 to-amber-600' },
            { label: 'Calificaciones', value: stats.ratings?.total, sub: `Prom: ${stats.ratings?.avgScore}`, icon: '⭐', color: 'from-rose-500 to-rose-600' },
          ].map(s => (
            <div key={s.label} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-dark-400 text-xs mt-1">{s.label}</p>
              <p className="text-dark-500 text-xs">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="glass-card p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-dark-400 text-left border-b border-white/10">
              <th className="p-3">Nombre</th><th className="p-3 hidden md:table-cell">Email</th><th className="p-3">Rol</th><th className="p-3">Estado</th><th className="p-3">Acciones</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3 text-white font-medium">{u.name}</td>
                  <td className="p-3 text-dark-300 hidden md:table-cell">{u.email}</td>
                  <td className="p-3"><span className="badge-info">{u.role}</span></td>
                  <td className="p-3">
                    {u.is_suspended ? <span className="badge-danger">Suspendido</span> : u.is_verified ? <span className="badge-success">Activo</span> : <span className="badge-warning">Sin verificar</span>}
                  </td>
                  <td className="p-3">
                    {u.is_suspended ? (
                      <button onClick={() => unsuspendUser(u.id)} className="text-accent-400 hover:text-accent-300 text-xs font-medium">Reactivar</button>
                    ) : (
                      <button onClick={() => suspendUser(u.id)} className="text-red-400 hover:text-red-300 text-xs font-medium">Suspender</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="glass-card p-8 text-center"><p className="text-dark-300">No hay reportes</p></div>
          ) : (
            reports.map(r => (
              <div key={r.id} className="glass-card p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${r.status === 'PENDING' ? 'badge-warning' : r.status === 'RESOLVED' ? 'badge-success' : 'badge-info'}`}>{r.status}</span>
                      <span className="text-white font-medium text-sm">{r.reason}</span>
                    </div>
                    <p className="text-dark-400 text-xs">{r.description}</p>
                    <p className="text-dark-500 text-xs mt-1">{new Date(r.createdAt).toLocaleDateString('es')}</p>
                  </div>
                  {r.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button onClick={() => resolveReport(r.id, 'RESOLVED')} className="px-3 py-1.5 rounded-lg bg-accent-500/20 text-accent-400 text-xs font-medium hover:bg-accent-500/30 transition-colors">✅ Resolver</button>
                      <button onClick={() => resolveReport(r.id, 'DISMISSED')} className="px-3 py-1.5 rounded-lg bg-dark-600 text-dark-300 text-xs font-medium hover:bg-dark-500 transition-colors">Descartar</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
