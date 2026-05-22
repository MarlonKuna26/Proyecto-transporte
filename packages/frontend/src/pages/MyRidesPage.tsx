import React, { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ToastContainer, type ToastMessage } from '@/components/Toast';
import type { Ride, RideRequest, UserProfile, Vehicle } from '@/types';
import { LiveMap } from '@/components/LiveMap';
import { ZONE_COORDINATES, ZONAS_AMBATO, CAMPUS_UTA } from '@/constants';

const findNearestZone = (lat: number, lng: number): string => {
  let nearestZone = '';
  let minDistance = Infinity;
  for (const [zone, coords] of Object.entries(ZONE_COORDINATES)) {
    const dist = Math.pow(coords.lat - lat, 2) + Math.pow(coords.lng - lng, 2);
    if (dist < minDistance) {
      minDistance = dist;
      nearestZone = zone;
    }
  }
  return nearestZone;
};

export const MyRidesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(searchParams.get('create') === 'true');

  const [editRideId, setEditRideId] = useState<string | null>(null);
  const isEditing = !!editRideId;

  const [selectMode, setSelectMode] = useState<'origin' | 'destination' | null>(null);
  const [autoLocate, setAutoLocate] = useState(true);

  const [formData, setFormData] = useState({
    originZone: '', originDetail: '', destinationZone: '', destinationDetail: '',
    departureDate: '', departureTime: '', availableSeats: '3', pricePerSeat: '0',
    notes: '', rules: '',
    originLat: null as number | null, originLng: null as number | null,
    destinationLat: null as number | null, destinationLng: null as number | null,
  });

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [customRule, setCustomRule] = useState<string>('');

  const [rides, setRides] = useState<Ride[]>([]);
  const [requests, setRequests] = useState<Record<string, RideRequest[]>>({});
  const [viewRide, setViewRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hasVehicles, setHasVehicles] = useState<boolean>(false);
  const [acceptedUsers, setAcceptedUsers] = useState<UserProfile[]>([]);
  const [loadingAccepted, setLoadingAccepted] = useState(false);

  // Custom Modal States
  const [cancelRideId, setCancelRideId] = useState<string | null>(null);
  const [rejectReqId, setRejectReqId] = useState<string | null>(null);
  const [rejectRideId, setRejectRideId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // ===== TOAST FUNCTIONS =====
  const addToast = (msg: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setMessages(prev => [...prev, { id, msg, type, duration }]);
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const loadMyRides = async () => {
    setLoading(true);
    try {
      const res = await api.rides.myRides({});
      setRides(res.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    loadMyRides();
    
    api.users.getVehicles().then(res => {
      const list: Vehicle[] = res.data || [];
      setVehicles(list);
      setHasVehicles(list.length > 0);
    }).catch();

    if (user?.id) {
      api.users.getProfile(user.id).then(res => setMyProfile(res.data)).catch();
    }
  }, [user?.id]);

  useEffect(() => {
    setShowCreate(searchParams.get('create') === 'true');
  }, [searchParams]);

  useEffect(() => {
    const fetchAccepted = async () => {
      if (!viewRide) {
        setAcceptedUsers([]);
        return;
      }
      setLoadingAccepted(true);
      try {
        const res = await api.rideRequests.passengers(viewRide.id);
        const accepted: RideRequest[] = res.data || [];
        const profiles: UserProfile[] = [];
        for (const req of accepted) {
          try {
            const userRes = await api.users.getProfile(req.passengerId);
            if (userRes.data) profiles.push(userRes.data);
          } catch {}
        }
        setAcceptedUsers(profiles);
      } catch {
        setAcceptedUsers([]);
      }
      setLoadingAccepted(false);
    };
    fetchAccepted();
  }, [viewRide]);

  const today = new Date().toISOString().split('T')[0];

  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    if (!vehicleId) return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setFormData(prev => ({ ...prev, availableSeats: String(vehicle.capacity) }));
    }
  };

  const resetForm = () => {
    setSelectedRules([]);
    setCustomRule('');
    setEditRideId(null);
    setShowCreate(false);
    setSearchParams({});
    setSelectedVehicleId('');
    setFormData({
      originZone: '', originDetail: '', destinationZone: '', destinationDetail: '',
      departureDate: '', departureTime: '', availableSeats: '3', pricePerSeat: '0',
      notes: '', rules: '',
      originLat: null, originLng: null,
      destinationLat: null, destinationLng: null,
    });
  };

  const handleEdit = (ride: Ride) => {
    const rulesStr = ride.rules || '';
    const parts = rulesStr.split(',').map(s => s.trim()).filter(Boolean);
    
    const normalizedParts = parts.map(p => {
      if (p === 'No llevar mascotas') return 'Sin mascotas';
      return p;
    });

    const predefinedList = ['Puntualidad', 'Sin mascotas', 'No tomar', 'No fumar'];
    const predefined = normalizedParts.filter(p => predefinedList.includes(p));
    const custom = normalizedParts.filter(p => !predefinedList.includes(p)).join(', ');
    
    setSelectedRules(predefined);
    setCustomRule(custom);

    setEditRideId(ride.id);
    setShowCreate(true);
    setSearchParams({ create: 'true' });
    setSelectedVehicleId(ride.vehicleId || '');
    
    setFormData({
      originZone: ride.originZone,
      originDetail: ride.originDetail || '',
      destinationZone: ride.destinationZone,
      destinationDetail: ride.destinationDetail || '',
      departureDate: ride.departureDate,
      departureTime: ride.departureTime,
      availableSeats: ride.availableSeats.toString(),
      pricePerSeat: ride.pricePerSeat.toString(),
      notes: ride.notes || '',
      rules: ride.rules || '',
      originLat: ride.originLat ?? null,
      originLng: ride.originLng ?? null,
      destinationLat: ride.destinationLat ?? null,
      destinationLng: ride.destinationLng ?? null,
    });
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();

    if (!hasVehicles) {
      addToast('Debes registrar un vehículo en tu perfil antes de publicar un viaje.', 'error');
      return;
    }

    if (!selectedVehicleId) {
      addToast('Selecciona el vehículo que usarás en este viaje.', 'error');
      return;
    }

    const { originZone, destinationZone, departureDate, departureTime, availableSeats } = formData;
    if (!originZone || !destinationZone || !departureDate || !departureTime || !availableSeats) {
      addToast('Por favor, completa todos los datos del viaje antes de publicarlo.', 'error');
      return;
    }

    if (formData.originZone === formData.destinationZone) {
      addToast('El destino no puede ser el mismo que el origen', 'error');
      return;
    }
    if (!formData.pricePerSeat || parseFloat(formData.pricePerSeat) <= 0) {
      addToast('El precio por persona debe ser mayor a $0.', 'error');
      return;
    }
    try {
      const combinedRules = [...selectedRules, customRule].map(r => r.trim()).filter(Boolean).join(', ');
      await api.rides.create({
        ...formData,
        rules: combinedRules,
        vehicleId: selectedVehicleId,
        availableSeats: parseInt(formData.availableSeats),
        pricePerSeat: parseFloat(formData.pricePerSeat),
      });
      addToast('¡Viaje publicado con éxito!', 'success');
      resetForm();
      loadMyRides();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      addToast('Selecciona el vehículo que usarás en este viaje.', 'error');
      return;
    }
    const { originZone, destinationZone, departureDate, departureTime, availableSeats } = formData;
    if (!originZone || !destinationZone || !departureDate || !departureTime || !availableSeats) {
      addToast('Por favor, completa todos los datos del viaje antes de actualizarlo.', 'error');
      return;
    }

    if (formData.originZone === formData.destinationZone) {
      addToast('El destino no puede ser el mismo que el origen', 'error');
      return;
    }
    if (!editRideId) return;
    try {
      const combinedRules = [...selectedRules, customRule].map(r => r.trim()).filter(Boolean).join(', ');
      await api.rides.update(editRideId, {
        ...formData,
        rules: combinedRules,
        vehicleId: selectedVehicleId,
        availableSeats: parseInt(formData.availableSeats),
        pricePerSeat: parseFloat(formData.pricePerSeat),
      });
      addToast('¡Viaje actualizado con éxito!', 'success');
      resetForm();
      loadMyRides();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handlePublishRide = () => {
    if (!myProfile || !myProfile.phone || !myProfile.emergencyContact || !myProfile.emergencyPhone) {
      addToast('¡Alto ahí! Debes completar tu perfil (teléfono, contacto de emergencia) antes de publicar un viaje.', 'error');
      return;
    }
    if (!hasVehicles) {
      addToast('Debes registrar un vehículo en tu perfil antes de publicar un viaje.', 'error');
      return;
    }
    setSearchParams({ create: 'true' });
  };

  const loadRequests = async (rideId: string) => {
    if (requests[rideId]) {
      setRequests(prev => {
        const n = { ...prev };
        delete n[rideId];
        return n;
      });
      return;
    }
    try {
      const res = await api.rideRequests.byRide(rideId);
      setRequests(prev => ({ ...prev, [rideId]: res.data || [] }));
    } catch { }
  };

  const handleResponse = async (requestId: string, rideId: string, action: 'accept' | 'reject') => {
    if (action === 'accept') {
      try {
        await api.rideRequests.accept(requestId);
        addToast('Solicitud aceptada con éxito', 'success');
        loadRequests(rideId);
      } catch (err: any) {
        addToast(err.message, 'error');
      }
    } else {
      // Trigger custom rejection modal instead of raw window.prompt
      setRejectReqId(requestId);
      setRejectRideId(rideId);
      setRejectReasonInput('');
    }
  };

  const confirmRejectRequest = async () => {
    if (!rejectReqId || !rejectRideId) return;
    if (!rejectReasonInput.trim()) {
      alert("Por favor, ingresa un motivo para el rechazo.");
      return;
    }
    try {
      await api.rideRequests.reject(rejectReqId, { rejectReason: rejectReasonInput });
      addToast('Solicitud rechazada con éxito', 'success');
      loadRequests(rejectRideId);
      setRejectReqId(null);
      setRejectRideId(null);
      setRejectReasonInput('');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const executeCancelRide = async () => {
    if (!cancelRideId) return;
    try {
      await api.rides.cancel(cancelRideId);
      setRides(prev => prev.map(r => r.id === cancelRideId ? { ...r, status: 'CANCELLED' as const } : r));
      addToast('Viaje cancelado con éxito', 'success');
      setCancelRideId(null);
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const startRide = async (rideId: string) => {
    try {
      await api.tracking.startRide(rideId);
      setRides(prev => prev.map(r => r.id === rideId ? { ...r, status: 'IN_PROGRESS' as const } : r));
      addToast('¡Viaje iniciado! Redirigiendo al seguimiento...', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const completeRide = async (rideId: string) => {
    try {
      await api.tracking.completeRide(rideId);
      setRides(prev => prev.map(r => r.id === rideId ? { ...r, status: 'COMPLETED' as const } : r));
      addToast('¡Viaje completado!', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const statusStyleMap: Record<string, { bg: string; color: string; label: string }> = {
    PUBLISHED:   { bg: '#E6F4EA', color: '#06C167', label: 'Disponible' },
    FULL:        { bg: '#FFF3E0', color: '#FF6937', label: 'Lleno' },
    IN_PROGRESS: { bg: '#E8F0FE', color: '#276EF1', label: 'En curso' },
    COMPLETED:   { bg: '#F6F6F6', color: '#545454', label: 'Completado' },
    CANCELLED:   { bg: '#FDECEA', color: '#E11900', label: 'Cancelado' },
  };

  const reqStatusStyleMap: Record<string, { bg: string; color: string; label: string }> = {
    PENDING:   { bg: '#FFF3E0', color: '#FF6937', label: 'Pendiente' },
    ACCEPTED:  { bg: '#E6F4EA', color: '#06C167', label: 'Aceptado' },
    REJECTED:  { bg: '#FDECEA', color: '#E11900', label: 'Rechazado' },
    CANCELLED: { bg: '#F6F6F6', color: '#545454', label: 'Cancelado' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══ HEADER SECTION ═══ */}
      <div className="pb-4 border-b border-uber-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
            Mis Viajes
          </h1>
          <p className="text-sm text-uber-gray-500 mt-1">
            Administra tus viajes publicados y solicitudes de pasajeros como conductor
          </p>
        </div>

        <button
          onClick={handlePublishRide}
          className="uber-btn-primary self-start sm:self-center inline-flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Publicar nuevo viaje
        </button>
      </div>

      {/* ═══ TOAST NOTIFICATIONS ═══ */}
      <ToastContainer messages={messages} onClose={removeToast} />

      {/* ═══ CREATE / EDIT FORM (Uber style) ═══ */}
      {showCreate && (
        <form onSubmit={isEditing ? handleUpdate : handleCreate} className="bg-white rounded-2xl p-6 md:p-8 border border-uber-gray-100 shadow-uber-sm space-y-6 animate-fade-in">
          {/* Selector de vehículo */}
          <div className="bg-uber-gray-50 rounded-2xl p-4 border border-uber-gray-100 space-y-3">
            <label className="block text-[11px] font-bold text-uber-gray-500 tracking-wider uppercase">
              Vehículo del viaje *
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-uber-gray-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l3-4h8l3 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
                  <circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>
                </svg>
              </div>
              <select
                className="w-full pl-10 pr-10 py-3 bg-white rounded-xl border border-uber-gray-200 text-sm text-black font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black appearance-none"
                value={selectedVehicleId}
                onChange={e => handleVehicleChange(e.target.value)}
                required
              >
                <option value="">— Selecciona un vehículo —</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {[v.brand, v.model, v.year].filter(Boolean).join(' ')}
                    {v.plate ? ` · ${v.plate}` : ''}
                    {v.color ? ` · ${v.color}` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-uber-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            {/* Badge del vehículo seleccionado */}
            {selectedVehicleId && vehicles.find(v => v.id === selectedVehicleId) && (() => {
              const sv = vehicles.find(v => v.id === selectedVehicleId)!;
              return (
                <div className="flex items-center gap-3 px-4 py-3 bg-white border border-uber-gray-200 rounded-xl">
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm shrink-0" style={{ background: sv.color || '#1a1a1a' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-black truncate">
                      {[sv.brand, sv.model].filter(Boolean).join(' ')}{sv.year ? ` (${sv.year})` : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {sv.plate && <span className="text-[10px] font-bold text-uber-gray-500 bg-uber-gray-100 border border-uber-gray-200 px-2 py-0.5 rounded-md tracking-widest uppercase">{sv.plate}</span>}
                      <span className="text-[10px] text-uber-gray-500 font-medium">
                        {sv.capacity} asientos en total
                      </span>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#06C167" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="pb-4 border-b border-uber-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-black flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
              {isEditing ? 'Editar viaje' : 'Publicar nuevo viaje'}
            </h2>
            {isEditing && (
              <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Modo edición
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Map Selection (takes 1 col on large screens) */}
            <div className="lg:col-span-1 space-y-4">
              <label className="block text-[11px] font-bold text-uber-gray-500 tracking-wider uppercase">
                Selección en mapa (Opcional)
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectMode(selectMode === 'origin' ? null : 'origin')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all inline-flex items-center justify-center gap-1.5 ${
                    selectMode === 'origin'
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-uber-gray-50 text-uber-gray-700 border-uber-gray-200 hover:bg-uber-gray-100'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Seleccionar Origen
                </button>
                <button
                  type="button"
                  onClick={() => setSelectMode(selectMode === 'destination' ? null : 'destination')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all inline-flex items-center justify-center gap-1.5 ${
                    selectMode === 'destination'
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-uber-gray-50 text-uber-gray-700 border-uber-gray-200 hover:bg-uber-gray-100'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                  Seleccionar Destino
                </button>
              </div>

              {selectMode && (
                <div className="p-3 bg-black text-white text-xs rounded-lg text-center font-medium animate-pulse">
                  Toca el mapa a continuación para ubicar el punto de {selectMode === 'origin' ? 'origen' : 'destino'}
                </div>
              )}

              <div className="rounded-xl overflow-hidden border border-uber-gray-200 shadow-sm">
                <LiveMap
                  height="220px"
                  selectMode={selectMode}
                  onMapClick={(lat, lng) => {
                    const nearestZone = findNearestZone(lat, lng);
                    if (selectMode === 'origin') {
                      setFormData(prev => ({
                        ...prev,
                        originLat: lat,
                        originLng: lng,
                        originZone: nearestZone || prev.originZone
                      }));
                      setSelectMode(null);
                    } else if (selectMode === 'destination') {
                      setFormData(prev => ({
                        ...prev,
                        destinationLat: lat,
                        destinationLng: lng,
                        destinationZone: nearestZone || prev.destinationZone
                      }));
                      setSelectMode(null);
                    }
                  }}
                  origin={formData.originLat && formData.originLng ? { lat: formData.originLat, lng: formData.originLng, label: 'Origen' } : null}
                  destination={formData.destinationLat && formData.destinationLng ? { lat: formData.destinationLat, lng: formData.destinationLng, label: 'Destino' } : null}
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs font-bold text-black cursor-pointer select-none bg-uber-gray-50 hover:bg-uber-gray-100/70 p-3 rounded-xl border border-uber-gray-200/60 transition-colors w-full mt-2.5">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-uber-gray-300 text-black focus:ring-black accent-black cursor-pointer"
                  checked={autoLocate}
                  onChange={(e) => setAutoLocate(e.target.checked)}
                />
                <span>Ubicar en mapa automáticamente según zona</span>
              </label>
            </div>

            {/* Right Cols: Form Inputs (takes 2 cols) */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Origin zone */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-uber-gray-500 tracking-wider uppercase mb-1.5">Zona origen *</label>
                <div className="relative">
                  <select
                    className="w-full pl-4 pr-10 py-3 bg-uber-gray-50 rounded-xl text-sm text-black font-medium border-none outline-none focus:bg-uber-gray-100 focus:ring-2 focus:ring-black/10 appearance-none"
                    required
                    value={formData.originZone}
                    onChange={e => {
                      const zone = e.target.value;
                      const coords = autoLocate && zone ? ZONE_COORDINATES[zone] : null;
                      setFormData(prev => ({
                        ...prev,
                        originZone: zone,
                        originLat: coords ? coords.lat : prev.originLat,
                        originLng: coords ? coords.lng : prev.originLng
                      }));
                    }}
                  >
                    <option value="">Seleccionar zona</option>
                    <optgroup label="Campus UTA">
                      {CAMPUS_UTA.map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                    <optgroup label="Zonas Ambato">
                      {ZONAS_AMBATO.map(z => <option key={z} value={z}>{z}</option>)}
                    </optgroup>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-uber-gray-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>

              {/* Destination zone */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-uber-gray-500 tracking-wider uppercase mb-1.5">Zona destino *</label>
                <div className="relative">
                  <select
                    className="w-full pl-4 pr-10 py-3 bg-uber-gray-50 rounded-xl text-sm text-black font-medium border-none outline-none focus:bg-uber-gray-100 focus:ring-2 focus:ring-black/10 appearance-none"
                    required
                    value={formData.destinationZone}
                    onChange={e => {
                      const zone = e.target.value;
                      const coords = autoLocate && zone ? ZONE_COORDINATES[zone] : null;
                      setFormData(prev => ({
                        ...prev,
                        destinationZone: zone,
                        destinationLat: coords ? coords.lat : prev.destinationLat,
                        destinationLng: coords ? coords.lng : prev.destinationLng
                      }));
                    }}
                  >
                    <option value="">Seleccionar zona</option>
                    <optgroup label="Campus UTA">
                      {CAMPUS_UTA.map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                    <optgroup label="Zonas Ambato">
                      {ZONAS_AMBATO.map(z => <option key={z} value={z}>{z}</option>)}
                    </optgroup>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-uber-gray-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>

              {/* Origin detail */}
              <div>
                <label className="block text-[11px] font-bold text-uber-gray-500 tracking-wider uppercase mb-1.5">Detalle origen (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Frente al parque, entrada principal"
                  className="w-full px-4 py-3 bg-uber-gray-50 rounded-xl text-sm text-black placeholder-uber-gray-400 border-none outline-none focus:bg-uber-gray-100 focus:ring-2 focus:ring-black/10"
                  value={formData.originDetail}
                  onChange={e => setFormData({ ...formData, originDetail: e.target.value })}
                />
              </div>

              {/* Destination detail */}
              <div>
                <label className="block text-[11px] font-bold text-uber-gray-500 tracking-wider uppercase mb-1.5">Detalle destino (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Puerta norte, bloque de ingeniería"
                  className="w-full px-4 py-3 bg-uber-gray-50 rounded-xl text-sm text-black placeholder-uber-gray-400 border-none outline-none focus:bg-uber-gray-100 focus:ring-2 focus:ring-black/10"
                  value={formData.destinationDetail}
                  onChange={e => setFormData({ ...formData, destinationDetail: e.target.value })}
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold text-uber-gray-500 tracking-wider uppercase mb-1.5">Fecha *</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-uber-gray-50 rounded-xl text-sm text-black border-none outline-none focus:bg-uber-gray-100 focus:ring-2 focus:ring-black/10"
                  required
                  min={today}
                  value={formData.departureDate}
                  onChange={e => setFormData({ ...formData, departureDate: e.target.value })}
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-[11px] font-bold text-uber-gray-500 tracking-wider uppercase mb-1.5">Hora *</label>
                <input
                  type="time"
                  className="w-full px-4 py-3 bg-uber-gray-50 rounded-xl text-sm text-black border-none outline-none focus:bg-uber-gray-100 focus:ring-2 focus:ring-black/10"
                  required
                  value={formData.departureTime}
                  onChange={e => setFormData({ ...formData, departureTime: e.target.value })}
                />
              </div>

              {/* Seats */}
              <div>
                <label className="block text-[11px] font-bold text-uber-gray-500 tracking-wider uppercase mb-1.5">
                  Asientos disponibles *
                  {selectedVehicleId && (() => {
                    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
                    return vehicle ? (
                      <span className="ml-2 normal-case text-[10px] font-medium text-uber-gray-400">
                        (máx. {vehicle.capacity} por el vehículo)
                      </span>
                    ) : null;
                  })()}
                </label>
                <input
                  type="number"
                  min="1"
                  max={(() => {
                    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
                    return vehicle ? vehicle.capacity : 8;
                  })()}
                  className="w-full px-4 py-3 bg-uber-gray-50 rounded-xl text-sm text-black border-none outline-none focus:bg-uber-gray-100 focus:ring-2 focus:ring-black/10 font-medium"
                  required
                  value={formData.availableSeats}
                  onChange={e => {
                    const valStr = e.target.value;
                    if (valStr === '') {
                      setFormData(prev => ({ ...prev, availableSeats: '' }));
                      return;
                    }
                    const val = parseInt(valStr, 10);
                    if (!isNaN(val)) {
                      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
                      const maxSeats = vehicle ? vehicle.capacity : 8;
                      if (val > maxSeats) {
                        setFormData(prev => ({ ...prev, availableSeats: String(maxSeats) }));
                      } else if (val < 1) {
                        setFormData(prev => ({ ...prev, availableSeats: '1' }));
                      } else {
                        setFormData(prev => ({ ...prev, availableSeats: String(val) }));
                      }
                    }
                  }}
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-[11px] font-bold text-uber-gray-500 tracking-wider uppercase mb-1.5">Precio por persona ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.10"
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-uber-gray-50 rounded-xl text-sm text-black border-none outline-none focus:bg-uber-gray-100 focus:ring-2 focus:ring-black/10"
                  value={formData.pricePerSeat}
                  onChange={e => setFormData({ ...formData, pricePerSeat: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Full-width fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-uber-gray-500 tracking-wider uppercase mb-1.5">Notas del viaje</label>
              <textarea
                placeholder="Ej: Saldré 5 minutos tarde máximo, paso por la gasolinera..."
                className="w-full px-4 py-3 bg-uber-gray-50 rounded-xl text-sm text-black placeholder-uber-gray-400 border-none outline-none focus:bg-uber-gray-100 focus:ring-2 focus:ring-black/10 resize-none h-20"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-uber-gray-500 tracking-wider uppercase mb-1.5">Reglas del viaje</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { id: 'puntualidad', label: 'Puntualidad', icon: '⏱️' },
                  { id: 'sin_mascotas', label: 'Sin mascotas', icon: '🐾' },
                  { id: 'no_tomar', label: 'No tomar', icon: '🚫🍺' },
                  { id: 'no_fumar', label: 'No fumar', icon: '🚭' }
                ].map(rule => {
                  const isChecked = selectedRules.includes(rule.label);
                  return (
                    <label
                      key={rule.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all select-none ${
                        isChecked
                          ? 'bg-black text-white border-black shadow-sm'
                          : 'bg-uber-gray-50 text-uber-gray-700 border-uber-gray-200 hover:bg-uber-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedRules(prev => prev.filter(r => r !== rule.label));
                          } else {
                            setSelectedRules(prev => [...prev, rule.label]);
                          }
                        }}
                      />
                      <span>{rule.icon}</span>
                      <span>{rule.label}</span>
                    </label>
                  );
                })}
              </div>
              <input
                type="text"
                placeholder="Ej: No comer en el auto, uso de mascarilla..."
                className="w-full px-4 py-3 bg-uber-gray-50 rounded-xl text-sm text-black placeholder-uber-gray-400 border-none outline-none focus:bg-uber-gray-100 focus:ring-2 focus:ring-black/10"
                value={customRule}
                onChange={e => setCustomRule(e.target.value)}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-uber-gray-100">
            <button type="submit" className="uber-btn-primary px-8">
              {isEditing ? 'Guardar cambios' : 'Publicar viaje'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="uber-btn-secondary px-6"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* ═══ RIDES LIST SECTION ═══ */}
      {loading ? (
        /* Uber Skeleton loaders */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-uber-gray-100 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-uber-gray-100" />
                <div className="flex-1">
                  <div className="h-3.5 bg-uber-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-uber-gray-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-uber-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : rides.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-uber-gray-100 shadow-uber-sm max-w-xl mx-auto my-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-uber-gray-50 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBCBCB" strokeWidth="1.5">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/>
              <circle cx="6.5" cy="15.5" r="1.5"/><circle cx="17.5" cy="15.5" r="1.5"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-black mb-2">Aún no has publicado viajes</h3>
          <p className="text-sm text-uber-gray-500 mb-6 max-w-sm mx-auto">
            Publica tus rutas de ida o regreso al campus para compartir tu auto con otros compañeros de la UTA.
          </p>
          <button
            onClick={handlePublishRide}
            className="uber-btn-primary inline-flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Publicar mi primer viaje
          </button>
        </div>
      ) : (
        /* Rides Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rides.map(ride => {
            const s = statusStyleMap[ride.status] || statusStyleMap.IN_PROGRESS;
            const expanded = !!requests[ride.id];
            return (
              <div
                key={ride.id}
                onClick={() => setViewRide(ride)}
                className="bg-white rounded-2xl p-6 border border-uber-gray-100 shadow-uber-sm hover:shadow-uber-md transition-all duration-200 cursor-pointer flex flex-col group relative animate-fade-in"
              >
                {/* Route Header with dots */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex gap-3 min-w-0">
                    <div className="flex flex-col items-center gap-1.5 mt-1 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-black" />
                      <div className="w-0.5 h-7 bg-uber-gray-200" />
                      <div className="w-2.5 h-2.5 bg-black" style={{ borderRadius: '2px' }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-black truncate">{ride.originZone}</h3>
                      {ride.originDetail && (
                        <p className="text-xs text-uber-gray-400 truncate mt-0.5">{ride.originDetail}</p>
                      )}
                      <h3 className="text-sm font-semibold text-black truncate mt-3.5">{ride.destinationZone}</h3>
                      {ride.destinationDetail && (
                        <p className="text-xs text-uber-gray-400 truncate mt-0.5">{ride.destinationDetail}</p>
                      )}
                    </div>
                  </div>

                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Ride Info Panel */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-uber-gray-500 font-medium mb-4">
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {ride.departureDate} · {ride.departureTime}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {ride.availableSeats} asientos
                  </span>
                  {ride.pricePerSeat > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-black font-semibold">${ride.pricePerSeat.toLocaleString()}</span>
                    </>
                  )}
                </div>

                {/* Actions bottom strip */}
                <div className="mt-auto pt-4 border-t border-uber-gray-100 flex flex-wrap items-center gap-2" onClick={e => e.stopPropagation()}>
                  {/* Start / Cancel actions */}
                  {(ride.status === 'PUBLISHED' || ride.status === 'FULL') && (
                    <>
                      <button
                        onClick={() => startRide(ride.id)}
                        className="px-4 py-2 text-xs font-bold bg-uber-black text-white hover:bg-uber-gray-800 rounded-lg transition-colors border-none"
                        style={{ cursor: 'pointer' }}
                      >
                        INICIAR VIAJE
                      </button>
                      <button
                        disabled={ride.hasRequests}
                        onClick={() => handleEdit(ride)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${
                          ride.hasRequests
                            ? 'bg-uber-gray-100 border-uber-gray-200 text-uber-gray-400 cursor-not-allowed'
                            : 'bg-white text-black border border-uber-gray-200 hover:bg-uber-gray-50'
                        }`}
                        style={{ cursor: ride.hasRequests ? 'not-allowed' : 'pointer' }}
                        title={ride.hasRequests ? "No puedes editar el viaje si ya tiene pasajeros solicitando unirse o aceptados" : "Editar este viaje"}
                      >
                        EDITAR
                      </button>
                      <button
                        onClick={() => setCancelRideId(ride.id)}
                        className="px-4 py-2 text-xs font-bold bg-white text-uber-red border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                        style={{ cursor: 'pointer' }}
                      >
                        CANCELAR
                      </button>
                    </>
                  )}

                  {/* Tracking / Complete actions */}
                  {ride.status === 'IN_PROGRESS' && (
                    <>
                      <Link
                        to={`/tracking/${ride.id}`}
                        className="px-4 py-2 text-xs font-bold bg-uber-blue text-white hover:bg-blue-700 rounded-lg transition-colors"
                        style={{ textDecoration: 'none' }}
                      >
                        SEGUIMIENTO LIVE
                      </Link>
                      <button
                        onClick={() => completeRide(ride.id)}
                        className="px-4 py-2 text-xs font-bold bg-uber-black text-white hover:bg-uber-gray-800 rounded-lg transition-colors border-none"
                        style={{ cursor: 'pointer' }}
                      >
                        COMPLETAR
                      </button>
                    </>
                  )}

                  {/* Toggle requests expansion */}
                  <button
                    onClick={() => loadRequests(ride.id)}
                    className={`ml-auto px-3.5 py-2 text-xs font-bold rounded-lg border transition-all inline-flex items-center gap-1.5 ${
                      expanded
                        ? 'bg-uber-gray-100 text-black border-uber-gray-200'
                        : 'bg-white text-uber-gray-600 border-uber-gray-200 hover:bg-uber-gray-50'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <span>SOLICITUDES</span>
                    <svg
                      width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                      style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                </div>

                {/* Expanded Requests Section */}
                {expanded && (
                  <div className="mt-4 pt-4 border-t border-uber-gray-100 space-y-2 animate-fade-in" onClick={e => e.stopPropagation()}>
                    <span className="block text-[10px] font-bold text-uber-gray-400 uppercase tracking-wider mb-2">
                      Solicitudes de pasajeros
                    </span>
                    {requests[ride.id].length === 0 ? (
                      <p className="text-xs text-uber-gray-400 pl-1 font-medium italic">No hay solicitudes pendientes o activas para este viaje.</p>
                    ) : (
                      <div className="space-y-2">
                        {requests[ride.id].map(req => {
                          const rs = reqStatusStyleMap[req.status] || reqStatusStyleMap.PENDING;
                          return (
                            <div
                              key={req.id}
                              className="p-3 bg-uber-gray-50 rounded-xl border border-uber-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                                    style={{ background: rs.bg, color: rs.color }}
                                  >
                                    {rs.label}
                                  </span>
                                  <span className="text-xs font-semibold text-black">
                                    {req.seatsRequested} asiento{req.seatsRequested > 1 ? 's' : ''} solicitado{req.seatsRequested > 1 ? 's' : ''}
                                  </span>
                                </div>
                                {req.message && (
                                  <p className="text-xs text-uber-gray-600 bg-white px-3 py-2 rounded-lg border border-uber-gray-100 mt-2 italic">
                                    "{req.message}"
                                  </p>
                                )}
                              </div>

                              {/* Response actions if pending */}
                              {req.status === 'PENDING' && (
                                <div className="flex gap-1.5 shrink-0 self-end sm:self-center" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleResponse(req.id, ride.id, 'accept')}
                                    className="px-3 py-1.5 text-xs font-bold bg-uber-black text-white hover:bg-uber-gray-800 rounded-lg transition-colors border-none"
                                    style={{ cursor: 'pointer' }}
                                  >
                                    ACEPTAR
                                  </button>
                                  <button
                                    onClick={() => handleResponse(req.id, ride.id, 'reject')}
                                    className="px-3 py-1.5 text-xs font-bold bg-white text-uber-gray-700 hover:bg-uber-gray-100 border border-uber-gray-200 rounded-lg transition-colors"
                                    style={{ cursor: 'pointer' }}
                                  >
                                    RECHAZAR
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ CUSTOM MODAL: REJECT REQUEST MOTIVE ═══ */}
      {rejectReqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile">
            {/* Header */}
            <div className="bg-black text-white px-6 py-5 shrink-0">
              <h3 className="text-lg font-bold">Rechazar solicitud</h3>
              <p className="text-xs text-uber-gray-400 mt-0.5">Por favor, especifica el motivo del rechazo</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-uber-gray-400 uppercase tracking-wider mb-1.5 pl-1">
                  Motivo del rechazo
                </label>
                <textarea
                  placeholder="Ej: Lo siento, ya no voy por esa ruta / Cupos completos por fuera..."
                  className="w-full px-4 py-3 bg-uber-gray-50 rounded-xl text-sm text-black border border-uber-gray-200 outline-none focus:ring-2 focus:ring-black/10 focus:border-black resize-none h-24"
                  value={rejectReasonInput}
                  onChange={e => setRejectReasonInput(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-uber-gray-100">
                <button
                  onClick={confirmRejectRequest}
                  className="flex-1 py-3 text-sm font-bold text-white bg-uber-black hover:bg-uber-gray-800 transition-colors rounded-xl border-none"
                  style={{ cursor: 'pointer' }}
                >
                  Enviar y Rechazar
                </button>
                <button
                  onClick={() => {
                    setRejectReqId(null);
                    setRejectRideId(null);
                    setRejectReasonInput('');
                  }}
                  className="flex-1 py-3 text-sm font-semibold bg-uber-gray-50 hover:bg-uber-gray-100 text-black border border-uber-gray-200 rounded-xl transition-all"
                  style={{ cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CUSTOM MODAL: CANCEL RIDE CONFIRMATION ═══ */}
      {cancelRideId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile">
            {/* Header */}
            <div className="bg-black text-white px-6 py-5 shrink-0">
              <h3 className="text-lg font-bold">¿Cancelar este viaje?</h3>
              <p className="text-xs text-uber-gray-400 mt-0.5">Esta acción notificará a todos tus pasajeros</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-red-50 border border-red-200 rounded-full text-uber-red">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black">¿Confirmas la cancelación definitiva?</h4>
                  <p className="text-xs text-uber-gray-500 mt-1 leading-relaxed">
                    Esta acción marcará el viaje como CANCELADO permanentemente. Los pasajeros aceptados serán notificados de forma inmediata.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-uber-gray-100">
                <button
                  onClick={executeCancelRide}
                  className="flex-1 py-3 text-sm font-bold text-white bg-uber-red hover:bg-red-700 transition-colors rounded-xl border-none"
                  style={{ cursor: 'pointer' }}
                >
                  Confirmar cancelación
                </button>
                <button
                  onClick={() => setCancelRideId(null)}
                  className="flex-1 py-3 text-sm font-semibold bg-uber-gray-50 hover:bg-uber-gray-100 text-black border border-uber-gray-200 rounded-xl transition-all"
                  style={{ cursor: 'pointer' }}
                >
                  Regresar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VIEW RIDE MODAL ═══ */}
      {viewRide && (() => {
        const originLat = viewRide.originLat ?? ZONE_COORDINATES[viewRide.originZone]?.lat;
        const originLng = viewRide.originLng ?? ZONE_COORDINATES[viewRide.originZone]?.lng;
        const destLat = viewRide.destinationLat ?? ZONE_COORDINATES[viewRide.destinationZone]?.lat;
        const destLng = viewRide.destinationLng ?? ZONE_COORDINATES[viewRide.destinationZone]?.lng;

        const mapOrigin = originLat && originLng ? { lat: originLat, lng: originLng, label: viewRide.originZone } : null;
        const mapDest = destLat && destLng ? { lat: destLat, lng: destLng, label: viewRide.destinationZone } : null;

        // Buscar vehículo asociado
        const sv = vehicles.find(v => v.id === viewRide.vehicleId);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setViewRide(null)}
          >
            <div
              className="w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="bg-black text-white px-6 py-5 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-bold">Detalle del viaje</h2>
                  <p className="text-xs text-uber-gray-400 mt-0.5">Ruta de transporte universitario (Tu viaje)</p>
                </div>
                <button
                  onClick={() => setViewRide(null)}
                  className="text-uber-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-1.5 rounded-full hover:bg-white/10 text-xl font-medium"
                >✕</button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Conductor y Vehículo Info Card */}
                <div className="bg-uber-gray-50 rounded-2xl p-4 border border-uber-gray-100 shadow-uber-sm space-y-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Foto del conductor */}
                    {myProfile?.photoUrl ? (
                      <img
                        src={myProfile.photoUrl}
                        alt={myProfile.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-base border-2 border-white shadow-sm shrink-0">
                        {myProfile?.name?.[0].toUpperCase() || '?'}
                      </div>
                    )}
                    {/* Detalles del conductor */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-black truncate">{myProfile?.name} (Tú)</span>
                        {myProfile?.isVerified && (
                          <span className="text-uber-green inline-flex shrink-0" title="Perfil verificado">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-uber-gray-500 truncate mt-0.5">
                        {myProfile?.career || 'Conductor Universitario'}
                      </p>
                    </div>
                  </div>

                  {/* Vehículo del viaje */}
                  {sv && (
                    <div className="flex items-center gap-3 pt-3 border-t border-uber-gray-200/60">
                      <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm shrink-0" style={{ background: sv.color || '#1a1a1a' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-black truncate">
                          Vehículo: {[sv.brand, sv.model].filter(Boolean).join(' ')}{sv.year ? ` (${sv.year})` : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {sv.plate && <span className="text-[9px] font-bold text-uber-gray-500 bg-uber-gray-100 border border-uber-gray-200 px-1.5 py-0.5 rounded uppercase tracking-wider">{sv.plate}</span>}
                          <span className="text-[10px] text-uber-gray-400 font-medium">{sv.capacity} asientos totales</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Route segment */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1.5 mt-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-black" />
                    <div className="w-0.5 h-12 bg-uber-gray-200" />
                    <div className="w-2.5 h-2.5 bg-black" style={{ borderRadius: '2px' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-uber-gray-400 font-bold uppercase tracking-wider">Origen</span>
                    <h4 className="text-sm font-bold text-black leading-tight">{viewRide.originZone}</h4>
                    {viewRide.originDetail && (
                      <p className="text-xs text-uber-gray-500 mt-0.5">{viewRide.originDetail}</p>
                    )}

                    <div className="h-4" />

                    <span className="text-[10px] text-uber-gray-400 font-bold uppercase tracking-wider">Destino</span>
                    <h4 className="text-sm font-bold text-black leading-tight">{viewRide.destinationZone}</h4>
                    {viewRide.destinationDetail && (
                      <p className="text-xs text-uber-gray-500 mt-0.5">{viewRide.destinationDetail}</p>
                    )}
                  </div>
                </div>

                {/* Ride details parameters */}
                <div className="grid grid-cols-3 gap-4 py-3.5 border-t border-b border-uber-gray-100 text-center">
                  <div>
                    <span className="text-[9px] text-uber-gray-400 block font-bold uppercase tracking-wider mb-1">Salida</span>
                    <span className="text-xs font-extrabold text-black block">{viewRide.departureDate}</span>
                    <span className="text-[10px] text-uber-gray-500 font-medium block mt-0.5">{viewRide.departureTime}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-uber-gray-400 block font-bold uppercase tracking-wider mb-1">Disponibilidad</span>
                    <span className="text-xs font-extrabold text-black block">{viewRide.availableSeats} asientos</span>
                    <span className="text-[10px] text-uber-gray-500 font-medium block mt-0.5">libres</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-uber-gray-400 block font-bold uppercase tracking-wider mb-1">Costo</span>
                    <span className="text-xs font-extrabold text-black block">
                      {viewRide.pricePerSeat > 0 ? `$${viewRide.pricePerSeat.toLocaleString()}` : 'Gratis'}
                    </span>
                    <span className="text-[10px] text-uber-gray-500 font-medium block mt-0.5">Por pasajero</span>
                  </div>
                </div>

                {/* Note / rules row */}
                {(viewRide.notes || viewRide.rules) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewRide.notes && (
                      <div className="p-3.5 bg-uber-gray-50 rounded-2xl border border-uber-gray-100 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-uber-gray-100 flex items-center justify-center shrink-0 text-uber-gray-700 border border-uber-gray-200/50">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-uber-gray-400 block font-bold uppercase tracking-wider">Notas del viaje</span>
                          <p className="text-xs text-uber-gray-700 font-semibold mt-1 leading-relaxed">{viewRide.notes}</p>
                        </div>
                      </div>
                    )}

                    {viewRide.rules && (
                      <div className="p-3.5 bg-uber-gray-50 rounded-2xl border border-uber-gray-100 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 text-uber-red border border-red-100/50">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-uber-gray-400 block font-bold uppercase tracking-wider">Reglas</span>
                          <p className="text-xs text-uber-gray-700 font-semibold mt-1 leading-relaxed">{viewRide.rules}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Map visualization */}
                {mapOrigin && (
                  <div className="rounded-2xl overflow-hidden border border-uber-gray-200 shadow-uber-sm relative">
                    <div className="absolute top-3 left-3 z-10 bg-black/85 text-white text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-sm">
                      Ruta del viaje en mapa
                    </div>
                    <LiveMap
                      origin={mapOrigin}
                      destination={mapDest}
                      height="200px"
                    />
                  </div>
                )}

                {/* Passenger list */}
                <div className="space-y-3 pt-1">
                  <span className="block text-[10px] font-bold text-uber-gray-400 tracking-wider uppercase">
                    Pasajeros aceptados
                  </span>
                  {loadingAccepted ? (
                    <div className="h-8 bg-uber-gray-50 rounded-xl animate-pulse w-full" />
                  ) : acceptedUsers.length === 0 ? (
                    <p className="text-xs text-uber-gray-400 pl-1 font-medium italic">Ningún pasajero aceptado aún</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {acceptedUsers.map(u => (
                        <div key={u.userId} className="flex items-center gap-3 px-3 py-2 bg-uber-gray-50 rounded-xl border border-uber-gray-100/60 hover:bg-uber-gray-100 transition-colors">
                          {u.photoUrl ? (
                            <img
                              src={u.photoUrl}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-white shadow-xs shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {u.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-black truncate leading-tight">{u.name}</p>
                            {u.career && <p className="text-[9px] text-uber-gray-400 truncate mt-0.5 leading-none">{u.career}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal footer (Actions) */}
              <div className="p-6 border-t border-uber-gray-100 bg-uber-gray-50 shrink-0">
                <button
                  onClick={() => setViewRide(null)}
                  className="uber-btn-secondary w-full py-3 text-xs font-bold tracking-wider"
                >
                  CERRAR
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
