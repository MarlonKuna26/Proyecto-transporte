import React, { useState } from 'react';
import { api } from '@/services/api';
import { ToastContainer, type ToastMessage } from '@/components/Toast';

interface ReportUserModalProps {
  reportedUserId: string;
  reportedUserName: string;
  reportedUserRole: 'DRIVER' | 'PASSENGER';
  rideId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DRIVER_REPORT_REASONS = [
  'Conducta inapropiada',
  'Conducción temeraria',
  'Vehículo en mal estado',
  'No se presentó',
  'Cobro indebido',
  'Otro'
];

const PASSENGER_REPORT_REASONS = [
  'Conducta inapropiada',
  'No se presentó',
  'No pagó el valor acordado',
  'Daños al vehículo',
  'Otro'
];

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  reportedUserId,
  reportedUserName,
  reportedUserRole,
  rideId,
  onClose,
  onSuccess
}) => {
  const reasonsList = reportedUserRole === 'DRIVER' ? DRIVER_REPORT_REASONS : PASSENGER_REPORT_REASONS;
  const [reason, setReason] = useState(reasonsList[0]);
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = (msg: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setMessages(prev => [...prev, { id, msg, type, duration }]);
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      addToast('Por favor, ingresa una descripción del incidente.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.reports.create({
        reportedId: reportedUserId,
        rideId,
        reason,
        description: `[Rol: ${reportedUserRole === 'DRIVER' ? 'Conductor' : 'Pasajero'}] ` + description.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined
      });
      addToast('Reporte enviado correctamente. El equipo de administración lo revisará.', 'success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      addToast(err.message || 'Error al enviar el reporte', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <ToastContainer messages={messages} onClose={removeToast} />
      
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile">
        <div className="bg-black text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold">Reportar Usuario</h3>
            <p className="text-xs text-uber-gray-400 mt-0.5">
              Reportando a {reportedUserName} ({reportedUserRole === 'DRIVER' ? 'Conductor' : 'Pasajero'})
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-uber-gray-300 transition-colors bg-transparent border-none cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-uber-gray-400 uppercase tracking-wider">
              Motivo del reporte *
            </label>
            <div className="relative">
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-uber-gray-50 rounded-xl text-sm text-black font-medium border border-uber-gray-200 outline-none focus:border-black appearance-none"
                required
              >
                {reasonsList.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-uber-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-uber-gray-400 uppercase tracking-wider">
              Descripción de lo sucedido *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe detalladamente el incidente..."
              required
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 bg-uber-gray-50 rounded-xl border border-uber-gray-200 outline-none focus:border-black text-sm resize-none"
            />
            <div className="text-[10px] text-right text-uber-gray-400">
              {description.length}/500
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-uber-gray-400 uppercase tracking-wider">
              Enlace de evidencia (Opcional)
            </label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="Ej: Enlace a Google Drive con capturas"
              className="w-full px-4 py-3 bg-uber-gray-50 rounded-xl border border-uber-gray-200 outline-none focus:border-black text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-uber-gray-100">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 text-sm font-bold text-white bg-black hover:bg-zinc-900 border border-black hover:border-zinc-900 transition-all rounded-xl cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar Reporte'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold bg-uber-gray-50 text-black border border-uber-gray-200 rounded-xl transition-all cursor-pointer hover:bg-black hover:text-white hover:border-black"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
