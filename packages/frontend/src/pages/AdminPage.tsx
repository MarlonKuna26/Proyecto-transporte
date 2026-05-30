import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import type { Report } from '@/types';
import { ToastContainer, type ToastMessage } from '@/components/Toast';

export const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as 'stats' | 'users' | 'reports' | 'config') || 'stats';
  const setTab = (newTab: 'stats' | 'users' | 'reports' | 'config') => {
    setSearchParams({ tab: newTab });
  };
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  // Search & Pagination States
  const [userSearch, setUserSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const usersPageSize = 6;

  const [reportsPage, setReportsPage] = useState(1);
  const reportsPageSize = 4;

  // General Parameters State (persisted in localStorage)
  const [params, setParams] = useState({
    maxPricePerSeat: 5.00,
    platformFee: 10,
    maxWaitTimeMinutes: 15,
    maxPassengerSeats: 4,
    requireEmailVerification: true,
    autoWarnSuspiciousUsers: false,
    emergencyRadiusKm: 5,
  });

  // Modal States
  const [suspendModal, setSuspendModal] = useState<{ isOpen: boolean, userId: string }>({ isOpen: false, userId: '' });
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDays, setSuspendDays] = useState(7);
  
  const [resolveModal, setResolveModal] = useState<{ isOpen: boolean, reportId: string, status: 'RESOLVED' | 'DISMISSED' }>({ isOpen: false, reportId: '', status: 'RESOLVED' });
  const [resolveNotes, setResolveNotes] = useState('');

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
        const [s, u, r] = await Promise.all([
          api.admin.stats(),
          api.admin.users(),
          api.reports.list()
        ]);
        setStats(s.data);
        setUsers(u.data || []);
        setReports(r.data || []);
      } catch (err: any) {
        addToast(err.message || 'Error al cargar datos del panel', 'error');
      }
      setLoading(false);
    };
    load();

    // Load general parameters from localStorage
    const savedParams = localStorage.getItem('u_ride_general_params');
    if (savedParams) {
      try {
        setParams(JSON.parse(savedParams));
      } catch (e) {
        console.error('Error parsing general parameters:', e);
      }
    }
  }, []);

  const suspendUser = (id: string) => {
    setSuspendModal({ isOpen: true, userId: id });
    setSuspendReason('');
    setSuspendDays(7);
  };

  const executeSuspendUser = async () => {
    if (!suspendReason.trim()) {
      addToast('Ingresa la razón de la suspensión', 'error');
      return;
    }
    try {
      await api.admin.suspendUser(suspendModal.userId, { reason: suspendReason, days: suspendDays });
      setUsers(prev => prev.map(u => u.id === suspendModal.userId ? { ...u, is_suspended: true } : u));
      addToast('Usuario suspendido correctamente', 'success');
      setSuspendModal({ isOpen: false, userId: '' });
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const unsuspendUser = async (id: string) => {
    try {
      await api.admin.unsuspendUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_suspended: false } : u));
      addToast('Usuario reactivado correctamente', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const resolveReport = (id: string, status: 'RESOLVED' | 'DISMISSED') => {
    setResolveModal({ isOpen: true, reportId: id, status });
    setResolveNotes('');
  };

  const executeResolveReport = async () => {
    if (!resolveNotes.trim()) {
      addToast('Ingresa las notas de la resolución', 'error');
      return;
    }
    try {
      await api.reports.resolve(resolveModal.reportId, { status: resolveModal.status, adminNotes: resolveNotes });
      setReports(prev => prev.map(r => r.id === resolveModal.reportId ? { ...r, status: resolveModal.status } : r));
      addToast(resolveModal.status === 'RESOLVED' ? 'Reporte resuelto' : 'Reporte descartado', 'success');
      setResolveModal({ isOpen: false, reportId: '', status: 'RESOLVED' });
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleSaveParams = () => {
    localStorage.setItem('u_ride_general_params', JSON.stringify(params));
    addToast('Parámetros generales actualizados correctamente', 'success');
  };

  // Reset pagination on search or tab change
  useEffect(() => {
    setUsersPage(1);
  }, [userSearch]);

  useEffect(() => {
    setUsersPage(1);
    setReportsPage(1);
  }, [tab]);

  const tabs = [
    {
      key: 'stats',
      label: 'Estadísticas',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline-block mr-2">
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
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline-block mr-2">
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
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline-block mr-2">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      )
    },
    {
      key: 'config',
      label: 'Configuración',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline-block mr-2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  // Calculated values for Stats Dashboard
  const verificationRate = stats?.users?.total ? Math.round((stats.users.verified / stats.users.total) * 100) : 0;
  const suspensionRate = stats?.users?.total ? Math.round((stats.users.suspended / stats.users.total) * 100) : 0;
  const completionRate = stats?.rides?.total ? Math.round((stats.rides.completed / stats.rides.total) * 100) : 0;
  const acceptanceRate = stats?.requests?.total ? Math.round((stats.requests.accepted / stats.requests.total) * 100) : 0;

  // Filter & Paginate Users
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const totalUsersPages = Math.ceil(filteredUsers.length / usersPageSize) || 1;
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * usersPageSize, usersPage * usersPageSize);

  // Paginate Reports
  const totalReportsPages = Math.ceil(reports.length / reportsPageSize) || 1;
  const paginatedReports = reports.slice((reportsPage - 1) * reportsPageSize, reportsPage * reportsPageSize);

  if (loading) return <div className="max-w-7xl mx-auto"><div className="glass-card p-12 animate-pulse text-center"><div className="h-4 bg-zinc-200 rounded w-48 mx-auto" /></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in px-4 md:px-0 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Panel de Control</h1>
          <p className="text-sm text-zinc-500 font-medium">Administra usuarios, reportes y parámetros globales del sistema</p>
        </div>
      </div>

      {/* ═══ TOAST NOTIFICATIONS ═══ */}
      <ToastContainer messages={messages} onClose={removeToast} />

      {/* ═══ MODALS ═══ */}
      {suspendModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md bg-white border border-zinc-150 p-6 rounded-2xl animate-scale-up">
            <h3 className="text-xl font-bold text-black mb-2">Suspender Usuario</h3>
            <p className="text-sm text-zinc-500 mb-4">Ingresa el motivo y la duración de la suspensión.</p>
            <textarea
              className="w-full bg-zinc-50 border border-zinc-200 text-black text-sm rounded-xl p-4 min-h-[100px] mb-4 outline-none focus:border-black transition-colors resize-none"
              placeholder="Razón detallada de la suspensión..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
            <div className="mb-6">
              <label className="block text-sm font-semibold text-black mb-2">Duración de la suspensión</label>
              <div className="relative">
                <select 
                  value={suspendDays} 
                  onChange={(e) => setSuspendDays(Number(e.target.value))}
                  className="w-full bg-zinc-50 border border-zinc-200 text-black text-sm font-medium rounded-xl p-3.5 outline-none focus:border-black transition-colors appearance-none"
                >
                  <option value={1}>1 día</option>
                  <option value={3}>3 días</option>
                  <option value={7}>1 semana</option>
                  <option value={15}>15 días</option>
                  <option value={30}>1 mes</option>
                  <option value={180}>6 meses</option>
                  <option value={365}>1 año</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSuspendModal({ isOpen: false, userId: '' })} className="px-5 py-2.5 rounded-xl font-bold text-sm text-zinc-500 hover:bg-zinc-100 transition-colors">Cancelar</button>
              <button onClick={executeSuspendUser} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm">Suspender Usuario</button>
            </div>
          </div>
        </div>
      )}

      {resolveModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md bg-white border border-zinc-150 p-6 rounded-2xl animate-scale-up">
            <h3 className="text-xl font-bold text-black mb-2">{resolveModal.status === 'RESOLVED' ? 'Resolver Reporte' : 'Descartar Reporte'}</h3>
            <p className="text-sm text-zinc-500 mb-4">Añade una nota explicativa que se enviará al usuario correspondiente.</p>
            <textarea
              className="w-full bg-zinc-50 border border-zinc-200 text-black text-sm rounded-xl p-4 min-h-[100px] mb-4 outline-none focus:border-black transition-colors resize-none"
              placeholder="Notas de administración..."
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setResolveModal({ isOpen: false, reportId: '', status: 'RESOLVED' })} className="px-5 py-2.5 rounded-xl font-bold text-sm text-zinc-500 hover:bg-zinc-100 transition-colors">Cancelar</button>
              <button onClick={executeResolveReport} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${resolveModal.status === 'RESOLVED' ? 'bg-black text-white hover:bg-zinc-800' : 'bg-red-600 text-white hover:bg-red-700'}`}>Aceptar Acción</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs - Hidden on desktop as it's displayed in the top navbar */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-zinc-100 scrollbar-hide md:hidden">
        {tabs.map(t => (
          <button 
            key={t.key} 
            onClick={() => setTab(t.key as any)}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              tab === t.key 
                ? 'bg-black text-white shadow-md scale-[1.02]' 
                : 'text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ STATS TAB (DASHBOARD) ═══ */}
      {tab === 'stats' && stats && (
        <div className="space-y-8">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                label: 'Usuarios Registrados',
                value: stats.users?.total,
                sub: `${stats.users?.verified || 0} verificados`,
                color: 'bg-zinc-100 text-black border-zinc-200',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )
              },
              {
                label: 'Viajes Creados',
                value: stats.rides?.total,
                sub: `${stats.rides?.active || 0} en curso/publicados`,
                color: 'bg-zinc-100 text-black border-zinc-200',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="2" y="7" width="20" height="8" rx="1"/>
                    <path d="M5 7V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
                    <circle cx="6" cy="18" r="2"/>
                    <circle cx="18" cy="18" r="2"/>
                  </svg>
                )
              },
              {
                label: 'Solicitudes Realizadas',
                value: stats.requests?.total,
                sub: `${stats.requests?.pending || 0} pendientes`,
                color: 'bg-zinc-100 text-black border-zinc-200',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                )
              },
              {
                label: 'Reportes Emitidos',
                value: stats.reports?.total,
                sub: `${stats.reports?.pending || 0} sin resolver`,
                color: 'bg-red-50 text-red-700 border-red-100',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                )
              },
              {
                label: 'Reputación General',
                value: `${(() => {
                  const score = parseFloat(stats.ratings?.avgScore as any);
                  return isNaN(score) ? '5.0' : score.toFixed(1);
                })()}`,
                sub: `${stats.ratings?.total || 0} calificaciones`,
                color: 'bg-amber-50 text-amber-700 border-amber-100',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )
              },
            ].map((s, idx) => (
              <div 
                key={idx} 
                className="glass-card p-5 border border-zinc-150 shadow-sm rounded-2xl bg-white hover:-translate-y-1 hover:shadow-uber-md transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-zinc-500 tracking-wider uppercase">{s.label}</span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${s.color}`}>
                    {s.icon}
                  </div>
                </div>
                <div>
                  <h4 className="text-3xl font-black text-black tracking-tight">{s.value}</h4>
                  <p className="text-zinc-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 inline-block" />
                    {s.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* System Health Indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Stats */}
            <div className="glass-card p-6 bg-white border border-zinc-150 rounded-2xl lg:col-span-2 space-y-6">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Indicadores de Salud del Sistema
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-semibold text-zinc-700 mb-1">
                    <span>Tasa de Verificación de Usuarios</span>
                    <span>{verificationRate}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-black h-full rounded-full transition-all duration-500" style={{ width: `${verificationRate}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold text-zinc-700 mb-1">
                    <span>Tasa de Finalización de Viajes</span>
                    <span>{completionRate}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold text-zinc-700 mb-1">
                    <span>Aceptación de Solicitudes</span>
                    <span>{acceptanceRate}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${acceptanceRate}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold text-zinc-700 mb-1">
                    <span>Proporción de Usuarios Suspendidos</span>
                    <span>{suspensionRate}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${suspensionRate}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="glass-card p-6 bg-zinc-950 border border-zinc-800 text-white rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-400">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  Acciones Rápidas
                </h3>
                <p className="text-zinc-400 text-xs mb-6 font-medium">Realiza tareas operativas esenciales de mantenimiento del sistema.</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => { setTab('reports'); }}
                  className="w-full py-3 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors text-xs font-bold flex items-center justify-between"
                >
                  Revisar Reportes Pendientes
                  <span className="bg-red-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black">{stats.reports?.pending || 0}</span>
                </button>

                <button 
                  onClick={() => { setTab('users'); }}
                  className="w-full py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-xs font-bold flex items-center justify-between"
                >
                  Administrar Usuarios Activos
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>

                <button 
                  onClick={() => { setTab('config'); }}
                  className="w-full py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-xs font-bold flex items-center justify-between"
                >
                  Ajustar Parámetros de Operación
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ USERS TAB ═══ */}
      {tab === 'users' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <input 
                type="text" 
                placeholder="Buscar usuarios por nombre o correo..." 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full px-11 py-3 bg-zinc-50 border border-zinc-200 text-black placeholder-zinc-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
              Total encontrados: {filteredUsers.length}
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedUsers.map(u => (
              <div 
                key={u.id} 
                className="glass-card p-6 bg-white border border-zinc-150 rounded-2xl hover:shadow-uber-md transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-black mb-0.5">{u.name}</h4>
                      <p className="text-zinc-400 text-xs font-semibold">{u.email}</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-800 rounded-md text-[9px] font-black uppercase tracking-wider border border-zinc-200">
                      {u.role}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-semibold">Reputación:</span>
                    <span className="font-extrabold text-black flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      {parseFloat(u.reputation || 5.0).toFixed(1)} / 5.0
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-semibold">Estado:</span>
                    {u.is_suspended ? (
                      <span className="px-2 py-0.5 bg-white text-red-600 border border-red-500 rounded text-[9px] font-black uppercase tracking-wider shadow-sm">Suspendido</span>
                    ) : u.is_verified ? (
                      <span className="px-2 py-0.5 bg-white text-emerald-600 border border-emerald-500 rounded text-[9px] font-black uppercase tracking-wider shadow-sm">Activo</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-white text-amber-500 border border-amber-500 rounded text-[9px] font-black uppercase tracking-wider shadow-sm">Sin verificar</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-4 flex justify-end">
                  {u.is_suspended ? (
                    <button 
                      onClick={() => unsuspendUser(u.id)} 
                      className="px-4 py-2 bg-white text-black border border-black hover:bg-black hover:text-white rounded-xl text-xs font-black tracking-wide shadow-sm transition-all duration-300 cursor-pointer"
                    >
                      Reactivar Cuenta
                    </button>
                  ) : (
                    <button 
                      onClick={() => suspendUser(u.id)} 
                      className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded-xl text-xs font-black tracking-wide shadow-sm transition-all duration-300 cursor-pointer"
                    >
                      Suspender
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="glass-card p-12 text-center border border-zinc-150 rounded-2xl bg-white">
              <p className="text-zinc-400 font-medium">No se encontraron usuarios registrados con esos criterios.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredUsers.length > usersPageSize && (
            <div className="flex items-center justify-center gap-1.5 mt-8">
              <button 
                onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                disabled={usersPage === 1}
                className="w-10 h-10 rounded-xl border border-zinc-200 text-black flex items-center justify-center hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              
              {Array.from({ length: totalUsersPages }, (_, i) => i + 1).map(p => (
                <button 
                  key={p}
                  onClick={() => setUsersPage(p)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                    usersPage === p 
                      ? 'bg-black text-white shadow-md' 
                      : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50 bg-white'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button 
                onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))}
                disabled={usersPage === totalUsersPages}
                className="w-10 h-10 rounded-xl border border-zinc-200 text-black flex items-center justify-center hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ REPORTS TAB ═══ */}
      {tab === 'reports' && (
        <div className="space-y-6">
          {reports.length === 0 ? (
            <div className="glass-card p-12 text-center border border-zinc-150 rounded-2xl bg-white shadow-sm">
              <p className="text-zinc-400 font-medium">No hay reportes de usuarios registrados en el sistema.</p>
            </div>
          ) : (
            <>
              {/* Reports Grid Layout (2 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedReports.map(r => (
                  <div 
                    key={r.id} 
                    className="glass-card p-6 border border-zinc-150 shadow-sm rounded-2xl bg-white flex flex-col justify-between space-y-4 hover:shadow-uber-md transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                          r.status === 'PENDING' 
                            ? 'bg-white text-amber-500 border-amber-500' 
                            : r.status === 'RESOLVED' 
                              ? 'bg-white text-emerald-600 border-emerald-500' 
                              : 'bg-zinc-50 text-zinc-600 border-zinc-300'
                        }`}>
                          {r.status === 'PENDING' ? 'Pendiente' : r.status === 'RESOLVED' ? 'Resuelto' : 'Descartado'}
                        </span>
                        <span className="text-zinc-400 text-[10px] font-semibold">{new Date(r.createdAt).toLocaleDateString('es-ES', { dateStyle: 'medium' })}</span>
                      </div>
                      
                      <h4 className="text-black font-extrabold text-base mb-1.5 flex items-center gap-1.5">
                        <svg className="text-red-500 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        {r.reason}
                      </h4>
                      <p className="text-zinc-600 text-xs mt-1.5 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-100 min-h-[70px]">
                        {r.description}
                      </p>
                    </div>

                    {r.status === 'PENDING' && (
                      <div className="border-t border-zinc-100 pt-4 flex justify-end gap-2">
                        <button 
                          onClick={() => resolveReport(r.id, 'DISMISSED')} 
                          className="px-4 py-2 rounded-xl bg-white border border-zinc-300 hover:bg-black hover:text-white hover:border-black text-black text-xs font-black shadow-sm transition-all duration-300 cursor-pointer"
                        >
                          Descartar
                        </button>
                        <button 
                          onClick={() => resolveReport(r.id, 'RESOLVED')} 
                          className="px-4 py-2 rounded-xl bg-white border border-emerald-500 hover:bg-emerald-500 hover:text-white text-emerald-600 text-xs font-black shadow-sm transition-all duration-300 cursor-pointer flex items-center gap-1.5"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          Resolver
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {reports.length > reportsPageSize && (
                <div className="flex items-center justify-center gap-1.5 mt-8">
                  <button 
                    onClick={() => setReportsPage(p => Math.max(1, p - 1))}
                    disabled={reportsPage === 1}
                    className="w-10 h-10 rounded-xl border border-zinc-200 text-black flex items-center justify-center hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  
                  {Array.from({ length: totalReportsPages }, (_, i) => i + 1).map(p => (
                    <button 
                      key={p}
                      onClick={() => setReportsPage(p)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                        reportsPage === p 
                          ? 'bg-black text-white shadow-md' 
                          : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50 bg-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button 
                    onClick={() => setReportsPage(p => Math.min(totalReportsPages, p + 1))}
                    disabled={reportsPage === totalReportsPages}
                    className="w-10 h-10 rounded-xl border border-zinc-200 text-black flex items-center justify-center hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ CONFIGURATION (PARÁMETROS GENERALES) TAB ═══ */}
      {tab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Panel de Límites y Tarifas */}
            <div className="glass-card p-6 bg-white border border-zinc-150 rounded-2xl space-y-6">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-black">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
                Parámetros Operativos e Impositivos
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-2">Precio máximo por asiento ($)</label>
                  <input 
                    type="number"
                    step="0.05"
                    value={params.maxPricePerSeat}
                    onChange={(e) => setParams(prev => ({ ...prev, maxPricePerSeat: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 text-black text-sm rounded-xl outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-2">Comisión de plataforma (%)</label>
                  <input 
                    type="number"
                    value={params.platformFee}
                    onChange={(e) => setParams(prev => ({ ...prev, platformFee: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 text-black text-sm rounded-xl outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-2">Máximo de pasajeros por viaje</label>
                  <input 
                    type="number"
                    value={params.maxPassengerSeats}
                    onChange={(e) => setParams(prev => ({ ...prev, maxPassengerSeats: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 text-black text-sm rounded-xl outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-2">Espera máxima solicitudes (minutos)</label>
                  <input 
                    type="number"
                    value={params.maxWaitTimeMinutes}
                    onChange={(e) => setParams(prev => ({ ...prev, maxWaitTimeMinutes: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 text-black text-sm rounded-xl outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Panel de Políticas y Seguridad */}
            <div className="glass-card p-6 bg-white border border-zinc-150 rounded-2xl space-y-6">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-black">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Políticas de Seguridad y Alertas
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                  <div>
                    <h5 className="text-sm font-bold text-black">Verificación Obligatoria de Email</h5>
                    <p className="text-zinc-400 text-xs font-medium">Enviar código único al registrar estudiantes.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={params.requireEmailVerification}
                    onChange={(e) => setParams(prev => ({ ...prev, requireEmailVerification: e.target.checked }))}
                    className="w-5 h-5 accent-black rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                  <div>
                    <h5 className="text-sm font-bold text-black">Advertencia Automática por Reportes</h5>
                    <p className="text-zinc-400 text-xs font-medium">Emitir alertar automáticas en perfiles con reportes recurrentes.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={params.autoWarnSuspiciousUsers}
                    onChange={(e) => setParams(prev => ({ ...prev, autoWarnSuspiciousUsers: e.target.checked }))}
                    className="w-5 h-5 accent-black rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <h5 className="text-sm font-bold text-black">Radio de Cobertura de Emergencia (km)</h5>
                    <p className="text-zinc-400 text-xs font-medium">Distancia permitida para alertas rápidas perimetrales.</p>
                  </div>
                  <input 
                    type="number"
                    value={params.emergencyRadiusKm}
                    onChange={(e) => setParams(prev => ({ ...prev, emergencyRadiusKm: Number(e.target.value) }))}
                    className="w-24 px-3 py-1.5 bg-zinc-50 border border-zinc-200 text-black text-sm rounded-xl outline-none focus:border-black font-semibold text-center"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end pt-2">
              <button 
                onClick={handleSaveParams}
                className="w-full md:w-auto px-8 py-3 bg-black text-white hover:bg-zinc-800 font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-black hover:border-zinc-800 tracking-wide cursor-pointer shadow-md"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Guardar Parámetros
              </button>
            </div>

          </div>

          {/* Info Side Panel */}
          <div className="glass-card p-6 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h4 className="text-base font-bold text-black flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-500">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Información de Parámetros
              </h4>
              <p className="text-zinc-500 text-xs leading-relaxed font-medium">
                Las modificaciones en esta sección controlan de forma centralizada los límites máximos y los controles automáticos del sistema.
              </p>
              <div className="bg-white border border-zinc-150 p-4 rounded-xl space-y-2 text-xs">
                <p className="text-zinc-600 font-medium">
                  <strong className="text-black font-extrabold">Precio por Asiento:</strong> El conductor no podrá exceder este monto al registrar un viaje.
                </p>
                <p className="text-zinc-600 font-medium">
                  <strong className="text-black font-extrabold">Comisión:</strong> Porcentaje aplicado a transacciones realizadas digitalmente dentro del sistema.
                </p>
              </div>
            </div>

            <div className="bg-black/5 p-4 rounded-xl border border-black/5 text-[11px] text-zinc-600 font-semibold leading-relaxed">
              * Nota: Los parámetros generales modificados aquí se almacenan localmente y actúan como reglas por defecto a aplicar a toda la interfaz.
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
