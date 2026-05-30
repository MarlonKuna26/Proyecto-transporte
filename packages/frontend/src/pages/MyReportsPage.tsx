import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Report } from '@/types';
import { ToastContainer, type ToastMessage } from '@/components/Toast';

export const MyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const totalPages = Math.ceil(reports.length / pageSize);
  const paginatedReports = reports.slice((currentPage - 1) * pageSize, currentPage * pageSize);


  const addToast = (msg: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setMessages(prev => [...prev, { id, msg, type, duration }]);
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await api.reports.getMyReports();
        setReports(res.data || []);
      } catch (err: any) {
        addToast(err.message || 'Error al cargar tus reportes', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-12 animate-pulse text-center">
          <div className="h-4 bg-dark-200 rounded w-48 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <ToastContainer messages={messages} onClose={removeToast} />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-md">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-black">Mis Reportes y Notificaciones</h1>
      </div>

      <div className="space-y-6">
        {reports.length === 0 ? (
          <div className="glass-card p-10 text-center border border-zinc-150 shadow-sm rounded-2xl bg-white">
            <p className="text-zinc-500 font-medium">Aún no has enviado ningún reporte.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedReports.map(r => (
                <div key={r.id} className="glass-card p-5 border border-zinc-150 shadow-sm rounded-2xl bg-white transition-all hover:shadow-md relative overflow-hidden flex flex-col justify-between">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          r.status === 'PENDING' 
                            ? 'bg-white text-black border-amber-500' 
                            : r.status === 'RESOLVED' 
                              ? 'bg-white text-black border-emerald-500' 
                              : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                        }`}>
                          {r.status === 'PENDING' ? 'En Revisión' : r.status === 'RESOLVED' ? 'Resuelto' : 'Descartado'}
                        </span>
                        <span className="text-black font-extrabold text-sm">{r.reason}</span>
                      </div>
                      
                      <p className="text-zinc-600 text-sm leading-relaxed mb-1">{r.description}</p>
                      <p className="text-zinc-400 text-[11px] font-medium mb-3">Reportado el {new Date(r.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      
                      {(r.status === 'RESOLVED' || r.status === 'DISMISSED') && (
                        <div className="mt-4 bg-zinc-50 border border-zinc-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-black">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span className="text-black font-bold text-xs uppercase tracking-wide">Respuesta de Administración</span>
                          </div>
                          <p className="text-zinc-700 text-sm mt-1">{r.adminNotes || 'Resuelto de acuerdo a las políticas de la institución.'}</p>
                          {r.resolvedAt && (
                            <p className="text-zinc-400 text-[10px] mt-2">Atendido el {new Date(r.resolvedAt).toLocaleDateString('es-ES')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-xl border border-zinc-200 flex items-center justify-center text-black hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all shadow-sm ${
                        currentPage === page
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-xl border border-zinc-200 flex items-center justify-center text-black hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
