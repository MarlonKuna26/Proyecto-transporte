import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Report } from '@/types';
import { ToastContainer, type ToastMessage } from '@/components/Toast';

export const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [tab, setTab] = useState<'stats' | 'users' | 'reports'>('stats');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  // ===== TOAST FUNCTIONS =====
  const addToast = (msg: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setMessages(prev => [...prev, { id, msg, type, duration }]);
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

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
      addToast('Usuario suspendido', 'success');
    } catch (err: any) { addToast(err.message, 'error'); }
  };

  const unsuspendUser = async (id: string) => {
    try {
      await api.admin.unsuspendUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_suspended: false } : u));
      addToast('Usuario reactivado', 'success');
    } catch (err: any) { addToast(err.message, 'error'); }
  };

  const resolveReport = async (id: string, status: 'RESOLVED' | 'DISMISSED') => {
    const notes = prompt('Notas del administrador:');
    if (!notes) return;
    try {
      await api.reports.resolve(id, { status, adminNotes: notes });
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      addToast('Reporte resuelto', 'success');
    } catch (err: any) { addToast(err.message, 'error'); }
  };

  const tabs = [
    {
      key: 'stats',
      label: 'Estadísticas',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline-block mr-2 -mt-0.5">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    },
    {
      key: 'users',
      label: 'Usuarios',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline-block mr-2 -mt-0.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      key: 'reports',
      label: 'Reportes',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline-block mr-2 -mt-0.5">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      )
    },
  ];

  if (loading) return <div className="max-w-6xl mx-auto"><div className="glass-card p-12 animate-pulse text-center"><div className="h-4 bg-dark-200 rounded w-48 mx-auto" /></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-md">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-black">Panel de administración</h1>
      </div>

      {/* ═══ TOAST NOTIFICATIONS ═══ */}
      <ToastContainer messages={messages} onClose={removeToast} />

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center ${tab === t.key ? 'bg-black text-white shadow-md' : 'text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50'}`}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: 'Usuarios',
              value: stats.users?.total,
              sub: `${stats.users?.verified} verificados`,
              color: 'bg-zinc-900',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              )
            },
            {
              label: 'Viajes',
              value: stats.rides?.total,
              sub: `${stats.rides?.active} activos`,
              color: 'bg-zinc-900',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                  <rect x="2" y="7" width="20" height="8" rx="1"/>
                  <path d="M5 7V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
                  <circle cx="6" cy="18" r="2"/>
                  <circle cx="18" cy="18" r="2"/>
                </svg>
              )
            },
            {
              label: 'Solicitudes',
              value: stats.requests?.total,
              sub: `${stats.requests?.pending} pendientes`,
              color: 'bg-zinc-900',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              )
            },
            {
              label: 'Reportes',
              value: stats.reports?.total,
              sub: `${stats.reports?.pending} pendientes`,
              color: 'bg-red-600',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              )
            },
            {
              label: 'Calificaciones',
              value: stats.ratings?.total,
              sub: `Prom: ${(() => {
                const score = parseFloat(stats.ratings?.avgScore as any);
                return isNaN(score) ? '5.0' : score.toFixed(1);
              })()}`,
              color: 'bg-amber-500',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )
            },
          ].map(s => (
            <div key={s.label} className="glass-card p-5 border border-zinc-150 shadow-sm rounded-2xl bg-white">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3.5 shadow-sm`}>{s.icon}</div>
              <p className="text-2xl font-black text-black">{s.value}</p>
              <p className="text-zinc-700 text-xs font-semibold mt-1">{s.label}</p>
              <p className="text-zinc-400 text-[10px] font-medium mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="glass-card p-4 overflow-x-auto border border-zinc-150 shadow-sm rounded-2xl bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-400 text-left border-b border-zinc-100 text-xs font-bold uppercase tracking-wider">
                <th className="p-3">Nombre</th>
                <th className="p-3 hidden md:table-cell">Email</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                  <td className="p-3 text-black font-semibold">{u.name}</td>
                  <td className="p-3 text-zinc-500 hidden md:table-cell font-medium">{u.email}</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-zinc-100 text-zinc-800 rounded text-[10px] font-bold uppercase tracking-wider">{u.role}</span></td>
                  <td className="p-3">
                    {u.is_suspended ? (
                      <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-[10px] font-bold uppercase tracking-wider">Suspendido</span>
                    ) : u.is_verified ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-bold uppercase tracking-wider">Activo</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-bold uppercase tracking-wider">Sin verificar</span>
                    )}
                  </td>
                  <td className="p-3">
                    {u.is_suspended ? (
                      <button onClick={() => unsuspendUser(u.id)} className="text-black hover:underline text-xs font-bold">Reactivar</button>
                    ) : (
                      <button onClick={() => suspendUser(u.id)} className="text-red-600 hover:underline text-xs font-bold">Suspender</button>
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
            <div className="glass-card p-8 text-center border border-zinc-150 shadow-sm rounded-2xl bg-white">
              <p className="text-zinc-400 font-medium">No hay reportes de usuarios registrados</p>
            </div>
          ) : (
            reports.map(r => (
              <div key={r.id} className="glass-card p-5 border border-zinc-150 shadow-sm rounded-2xl bg-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        r.status === 'PENDING' 
                          ? 'bg-amber-50 text-amber-700 border-amber-100' 
                          : r.status === 'RESOLVED' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                      }`}>
                        {r.status}
                      </span>
                      <span className="text-black font-extrabold text-sm">{r.reason}</span>
                    </div>
                    <p className="text-zinc-600 text-xs mt-1.5 leading-relaxed">{r.description}</p>
                    <p className="text-zinc-400 text-[10px] font-medium mt-1">{new Date(r.createdAt).toLocaleDateString('es')}</p>
                  </div>
                  {r.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => resolveReport(r.id, 'RESOLVED')} 
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Resolver
                      </button>
                      <button 
                        onClick={() => resolveReport(r.id, 'DISMISSED')} 
                        className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-bold hover:bg-zinc-200 transition-colors"
                      >
                        Descartar
                      </button>
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
