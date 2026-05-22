import React, { useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { LiveMap } from '@/components/LiveMap';
import type { Ride, RideRequest, UserProfile, Vehicle } from '@/types';
import { ZONAS_AMBATO, CAMPUS_UTA, ZONE_COORDINATES } from '@/constants';


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

export const RidesPage: React.FC = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(params.get('create') === 'true');
  const [viewRide, setViewRide] = useState<Ride | null>(null);

  const [editRideId, setEditRideId] = useState<string | null>(null);
  const isEditing = !!editRideId;

  const [requestMsg, setRequestMsg] = useState('');
  const [filters, setFilters] = useState({ originZone: '', destinationZone: '', departureDate: '' });
  const [feedback, setFeedback] = useState({ msg: '', type: '' });
  const [selectMode, setSelectMode] = useState<'origin' | 'destination' | null>(null);
  const [autoLocate, setAutoLocate] = useState(true);

  const [formData, setFormData] = useState({
    originZone: '', originDetail: '', destinationZone: '', destinationDetail: '',
    departureDate: '', departureTime: '', availableSeats: '3', pricePerSeat: '0',
    notes: '', rules: '',
    originLat: null as number | null, originLng: null as number | null,
    destinationLat: null as number | null, destinationLng: null as number | null,
  });

  const [acceptedUsers, setAcceptedUsers] = useState<UserProfile[]>([]);
  const [loadingAccepted, setLoadingAccepted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [driverProfile, setDriverProfile] = useState<UserProfile | null>(null);
  const [loadingDriver, setLoadingDriver] = useState(false);

  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);

  const [hasVehicles, setHasVehicles] = useState<boolean>(false);
  const [myRequests, setMyRequests] = useState<RideRequest[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
 const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  /* ===== LOAD ===== */
  const loadRides = async () => {
    setLoading(true);
    try {
      const res = await api.rides.list({ status: 'PUBLISHED' });
      setRides(res.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    if (feedback.msg) {
      const timer = setTimeout(() => {
        setFeedback({ msg: '', type: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    loadRides();
    if (user?.id) {
      api.users.getProfile(user.id).then(res => setMyProfile(res.data)).catch();
      api.users.getVehicles().then(res => {
  const list: Vehicle[] = res.data || [];
  setVehicles(list);
  setHasVehicles(list.length > 0);
}).catch();
      api.rideRequests.myRequests().then(res => setMyRequests(res.data || [])).catch();
    }
  }, [user?.id]);

  useEffect(() => {
  const fetchAccepted = async () => {
    if (!viewRide) {
      setAcceptedUsers([]);
      setDriverProfile(null);
      return;
    }
    setLoadingDriver(true);
    setLoadingAccepted(true);

    // Cargar pasajeros aceptados (endpoint público)
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

    // Cargar perfil del conductor
    try {
      const resDriver = await api.users.getProfile(viewRide.driverId);
      if (resDriver?.data) setDriverProfile(resDriver.data);
    } catch {
      setDriverProfile(null);
    }
    setLoadingDriver(false);
  };
  fetchAccepted();
}, [viewRide]);

  /* ===== CREATE ===== */
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();

    if (!hasVehicles) {
      setFeedback({ msg: 'Debes registrar un vehículo en tu perfil antes de publicar un viaje.', type: 'error' });
      return;
    }

    if (!selectedVehicleId) {
  setFeedback({ msg: 'Selecciona el vehículo que usarás en este viaje.', type: 'error' });
  return;
}

    const { originZone, destinationZone, departureDate, departureTime, availableSeats } = formData;
    if (!originZone || !destinationZone || !departureDate || !departureTime || !availableSeats) {
      setFeedback({ msg: 'Por favor, completa todos los datos del viaje antes de publicarlo.', type: 'error' });
      return;
    }

    // Validación: Mismo origen y destino
    if (formData.originZone === formData.destinationZone) {
      setFeedback({ msg: 'El destino no puede ser el mismo que el origen', type: 'error' });
      return;
    }
if (!formData.pricePerSeat || parseFloat(formData.pricePerSeat) <= 0) {
  setFeedback({ msg: 'El precio por persona debe ser mayor a $0.', type: 'error' });
  return;
}
    try {
      await api.rides.create({
        ...formData,
         vehicleId: selectedVehicleId,
        availableSeats: parseInt(formData.availableSeats),
        pricePerSeat: parseFloat(formData.pricePerSeat),
      });
      setFeedback({ msg: '¡Viaje publicado con éxito!', type: 'success' });
      resetForm(
        
      );
      loadRides();
    } catch (err: any) {
      setFeedback({ msg: err.message, type: 'error' });
    }
  };

  /* ===== UPDATE ===== */
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
if (!selectedVehicleId) {
  setFeedback({ msg: 'Selecciona el vehículo que usarás en este viaje.', type: 'error' });
  return;
}
    const { originZone, destinationZone, departureDate, departureTime, availableSeats } = formData;
    if (!originZone || !destinationZone || !departureDate || !departureTime || !availableSeats) {
      setFeedback({ msg: 'Por favor, completa todos los datos del viaje antes de actualizarlo.', type: 'error' });
      return;
    }

    // Validación: Mismo origen y destino
    if (formData.originZone === formData.destinationZone) {
      setFeedback({ msg: 'El destino no puede ser el mismo que el origen', type: 'error' });
      return;
    }

    if (!editRideId) return;
    try {
      await api.rides.update(editRideId, {
        ...formData,
        vehicleId: selectedVehicleId,
        availableSeats: parseInt(formData.availableSeats),
        pricePerSeat: parseFloat(formData.pricePerSeat),
      });
      setFeedback({ msg: '¡Viaje actualizado con éxito!', type: 'success' });
      resetForm();
      loadRides();
    } catch (err: any) {
      setFeedback({ msg: err.message, type: 'error' });
    }
  };

  /* ===== EDIT ===== */
  const handleEdit = (ride: Ride) => {
    setEditRideId(ride.id);
    setShowCreate(true);
    
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

  /* ===== RESET ===== */
  const resetForm = () => {
    setEditRideId(null);
    setShowCreate(false);
    setSelectedVehicleId('');
    setFormData({
      originZone: '', originDetail: '', destinationZone: '', destinationDetail: '',
      departureDate: '', departureTime: '', availableSeats: '3', pricePerSeat: '0',
      notes: '', rules: '',
      originLat: null, originLng: null,
      destinationLat: null, destinationLng: null,
    });
  };

  const handleVehicleChange = (vehicleId: string) => {
  setSelectedVehicleId(vehicleId);
  if (!vehicleId) return;
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (vehicle) {
    setFormData(prev => ({ ...prev, availableSeats: String(vehicle.capacity) }));
  }
};

  const handleRequestJoin = async (rideId: string) => {
    if (!myProfile || !myProfile.career || !myProfile.phone) {
      setFeedback({ msg: 'Por favor, actualiza tu perfil (carrera y teléfono) en la sección de Perfil antes de solicitar unirte a un viaje.', type: 'error' });
      return;
    }

    try {
      await api.rideRequests.create({ rideId, message: requestMsg || null, seatsRequested: 1 });
      setFeedback({ msg: '¡Solicitud enviada con éxito!', type: 'success' });

      if (user?.id) {
        api.rideRequests.myRequests().then(res => setMyRequests(res.data || [])).catch();
      }

      setViewRide(null);
      setRequestMsg('');
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('already have a pending or accepted')) {
        setFeedback({ msg: 'Ya tienes una solicitud pendiente o aceptada para este viaje.', type: 'error' });
      } else {
        setFeedback({ msg: err.message || 'Error al solicitar viaje.', type: 'error' });
      }
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    try {
      await api.rides.cancel(rideId);
      setFeedback({ msg: 'Viaje eliminado correctamente.', type: 'success' });
      setConfirmDelete(null);
      setViewRide(null);
      loadRides();
    } catch (err: any) {
      setFeedback({ msg: err.message || 'Error al eliminar el viaje.', type: 'error' });
      setConfirmDelete(null);
    }
  };

  const statusStyleMap: Record<string, { label: string; bg: string; color: string }> = {
    PUBLISHED:   { label: 'Disponible', bg: '#E6F4EA', color: '#06C167' },
    FULL:        { label: 'Lleno',      bg: '#FFF3E0', color: '#FF6937' },
    IN_PROGRESS: { label: 'En curso',   bg: '#E8F0FE', color: '#276EF1' },
    COMPLETED:   { label: 'Completado', bg: '#F6F6F6', color: '#545454' },
    CANCELLED:   { label: 'Cancelado',  bg: '#FDECEA', color: '#E11900' },
  };

  const today = new Date().toISOString().split('T')[0];

  // Frontend filtration based on filters state
  const filteredRides = rides.filter(ride => {
    if (filters.originZone && ride.originZone !== filters.originZone) return false;
    if (filters.destinationZone && ride.destinationZone !== filters.destinationZone) return false;
    if (filters.departureDate && ride.departureDate !== filters.departureDate) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══ HEADER SECTION ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-uber-gray-100">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
            Viajes disponibles
          </h1>
          <p className="text-sm text-uber-gray-500 mt-1">
            Encuentra o publica rutas estudiantiles para tu campus
          </p>
        </div>

        <button
          onClick={() => {
            if (showCreate) {
              resetForm();
            } else {
              if (!myProfile || !myProfile.phone || !myProfile.emergencyContact || !myProfile.emergencyPhone) {
                setFeedback({ msg: '¡Alto ahí! Debes completar tu perfil (teléfono, contacto de emergencia) antes de publicar un viaje.', type: 'error' });
                return;
              }
              if (!hasVehicles) {
                setFeedback({ msg: 'Debes registrar un vehículo en tu perfil antes de publicar un viaje.', type: 'error' });
                return;
              }
              setShowCreate(true);
            }
          }}
          className={`uber-btn-primary self-start sm:self-center inline-flex items-center gap-2 ${showCreate ? '!bg-uber-gray-100 !text-black hover:!bg-uber-gray-200' : ''}`}
        >
          {showCreate ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Cancelar
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo viaje
            </>
          )}
        </button>
      </div>

      {/* ═══ FEEDBACK NOTIFICATIONS ═══ */}
      {feedback.msg && (
        <div
          className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl border animate-fade-in`}
          style={{
            background: feedback.type === 'success' ? '#E6F4EA' : '#FDECEA',
            borderColor: feedback.type === 'success' ? '#C2EAD0' : '#FAD4D0',
            color: feedback.type === 'success' ? '#06C167' : '#E11900',
          }}
        >
          {feedback.type === 'success' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          )}
          <span className="font-medium">{feedback.msg}</span>
          <button
            onClick={() => setFeedback({ msg: '', type: '' })}
            className="ml-auto bg-transparent border-none cursor-pointer text-current opacity-60 hover:opacity-100 font-semibold"
          >✕</button>
        </div>
      )}

      {/* ═══ SEARCH & FILTERS BAR (Uber aesthetic) ═══ */}
      {!showCreate && (
        <div className="bg-uber-gray-50 rounded-2xl p-5 border border-uber-gray-100 flex flex-col md:flex-row items-stretch md:items-center gap-4">
          {/* Origin Zone Filter */}
          <div className="flex-1 relative">
            <label className="block text-[10px] font-bold text-uber-gray-500 uppercase tracking-wider mb-1.5 pl-1">Origen</label>
            <div className="relative">
              <select
                className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-uber-gray-200 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black appearance-none"
                value={filters.originZone}
                onChange={e => setFilters(prev => ({ ...prev, originZone: e.target.value }))}
              >
                <option value="">Todas las zonas</option>
                <optgroup label="Campus UTA">
                  {CAMPUS_UTA.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
                <optgroup label="Zonas Ambato">
                  {ZONAS_AMBATO.map(z => <option key={z} value={z}>{z}</option>)}
                </optgroup>
              </select>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-black pointer-events-none" />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-uber-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>

          {/* Destination Zone Filter */}
          <div className="flex-1 relative">
            <label className="block text-[10px] font-bold text-uber-gray-500 uppercase tracking-wider mb-1.5 pl-1">Destino</label>
            <div className="relative">
              <select
                className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-uber-gray-200 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black appearance-none"
                value={filters.destinationZone}
                onChange={e => setFilters(prev => ({ ...prev, destinationZone: e.target.value }))}
              >
                <option value="">Todas las zonas</option>
                <optgroup label="Campus UTA">
                  {CAMPUS_UTA.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
                <optgroup label="Zonas Ambato">
                  {ZONAS_AMBATO.map(z => <option key={z} value={z}>{z}</option>)}
                </optgroup>
              </select>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-black pointer-events-none" style={{ borderRadius: '2px' }} />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-uber-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>

          {/* Date Filter */}
          <div className="w-full md:w-48 relative">
            <label className="block text-[10px] font-bold text-uber-gray-500 uppercase tracking-wider mb-1.5 pl-1">Fecha</label>
            <input
              type="date"
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-uber-gray-200 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
              value={filters.departureDate}
              onChange={e => setFilters(prev => ({ ...prev, departureDate: e.target.value }))}
            />
          </div>

          {/* Clear Filters Button */}
          {(filters.originZone || filters.destinationZone || filters.departureDate) && (
            <button
              onClick={() => setFilters({ originZone: '', destinationZone: '', departureDate: '' })}
              className="self-end md:self-center px-4 py-2.5 text-xs font-semibold text-uber-red hover:bg-red-50 rounded-xl transition-colors shrink-0"
              style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* ═══ CREATE / EDIT FORM (Uber style) ═══ */}
      {showCreate && (
        <form onSubmit={isEditing ? handleUpdate : handleCreate} className="bg-white rounded-2xl p-6 md:p-8 border border-uber-gray-100 shadow-uber-sm space-y-6 animate-fade-in">
          {/* Form Header */}
          {/* ── Selector de vehículo ── */}
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
    {selectedVehicleId && <span className="ml-2 normal-case text-[10px] font-medium text-uber-gray-400">(definido por el vehículo)</span>}
  </label>
  {selectedVehicleId ? (
    <div className="w-full px-4 py-3 bg-uber-gray-100 rounded-xl text-sm font-extrabold text-black border border-uber-gray-200 flex items-center gap-3 cursor-not-allowed select-none">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <span>{formData.availableSeats}</span>
      <span className="text-uber-gray-400 font-normal text-xs">asientos</span>
      <div className="ml-auto flex items-center gap-1.5 text-[10px] text-uber-gray-400 font-medium bg-uber-gray-200 px-2.5 py-1 rounded-lg">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Solo lectura
      </div>
    </div>
  ) : (
    <input type="number" min="1" max="8" className="w-full px-4 py-3 bg-uber-gray-50 rounded-xl text-sm text-black border-none outline-none focus:bg-uber-gray-100 focus:ring-2 focus:ring-black/10" required value={formData.availableSeats} onChange={e => setFormData({ ...formData, availableSeats: e.target.value })} />
  )}
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
              <textarea
                placeholder="Ej: Prohibido fumar, no comer en el auto, uso obligatorio de mascarilla..."
                className="w-full px-4 py-3 bg-uber-gray-50 rounded-xl text-sm text-black placeholder-uber-gray-400 border-none outline-none focus:bg-uber-gray-100 focus:ring-2 focus:ring-black/10 resize-none h-20"
                value={formData.rules}
                onChange={e => setFormData({ ...formData, rules: e.target.value })}
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
          {[1, 2, 3, 4].map(i => (
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
      ) : filteredRides.length === 0 ? (
        /* Styled Empty state */
        <div className="bg-white rounded-3xl p-12 text-center border border-uber-gray-100 shadow-uber-sm max-w-xl mx-auto my-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-uber-gray-50 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBCBCB" strokeWidth="1.5">
              <path d="M3 17l3-10 3 10M15 17l3-10 3 10M9 7h6"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-black mb-2">No se encontraron viajes</h3>
          <p className="text-sm text-uber-gray-500 mb-6 max-w-sm mx-auto">
            {filters.originZone || filters.destinationZone || filters.departureDate
              ? 'Prueba modificando tus filtros o eliminándolos para buscar otras opciones.'
              : 'Actualmente no hay viajes publicados en esta sección. ¡Sé el primero en publicar uno!'}
          </p>
          {filters.originZone || filters.destinationZone || filters.departureDate ? (
            <button
              onClick={() => setFilters({ originZone: '', destinationZone: '', departureDate: '' })}
              className="uber-btn-secondary inline-flex items-center gap-2"
            >
              Quitar filtros
            </button>
          ) : (
            <button
              onClick={() => {
                if (!myProfile || !myProfile.phone || !myProfile.emergencyContact || !myProfile.emergencyPhone) {
                  setFeedback({ msg: '¡Alto ahí! Debes completar tu perfil (teléfono, contacto de emergencia) antes de publicar un viaje.', type: 'error' });
                  return;
                }
                if (!hasVehicles) {
                  setFeedback({ msg: 'Debes registrar un vehículo en tu perfil antes de publicar un viaje.', type: 'error' });
                  return;
                }
                setShowCreate(true);
              }}
              className="uber-btn-primary inline-flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Publicar el primero
            </button>
          )}
        </div>
      ) : (
        /* Ride cards grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRides.map(ride => {
            const s = statusStyleMap[ride.status] || statusStyleMap.IN_PROGRESS;
            return (
              <div
                key={ride.id}
                onClick={() => setViewRide(ride)}
                className="bg-white rounded-2xl p-6 border border-uber-gray-100 shadow-uber-sm hover:shadow-uber-md transition-all duration-200 cursor-pointer flex flex-col group relative animate-fade-in"
              >
                {/* Top line: Route with dot indicators */}
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

                  {/* Top-right Actions & Badges */}
                  <div className="flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
                    <span
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>

                    {/* Driver options if owner */}
                    {ride.driverId === user?.id && (
                      <div className="flex gap-1.5 mt-2">
                        <button
                          onClick={() => handleEdit(ride)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-uber-gray-50 border border-uber-gray-200 text-uber-gray-700 hover:bg-uber-gray-100 hover:text-black transition-colors"
                          style={{ cursor: 'pointer' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(ride.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 border border-red-100 text-uber-red hover:bg-red-100 transition-colors"
                          style={{ cursor: 'pointer' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom line: details + price */}
                <div className="mt-auto pt-4 border-t border-uber-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-uber-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {ride.departureDate} · {ride.departureTime}
                    </span>
                    <span>·</span>
                    <span>{ride.availableSeats} asientos</span>
                  </div>

                  {ride.pricePerSeat > 0 ? (
                    <div className="text-right">
                      <span className="text-[9px] text-uber-gray-400 block font-bold uppercase tracking-wider">Por persona</span>
                      <span className="text-base font-bold text-black">${ride.pricePerSeat.toLocaleString()}</span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-uber-green bg-green-50 px-2 py-0.5 rounded">Gratis</span>
                  )}
                </div>

                {/* Hover arrow indicator */}
                <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ VIEW RIDE MODAL ═══ */}
      {/* ═══ VIEW RIDE MODAL ═══ */}
      {viewRide && (() => {
        const originLat = viewRide.originLat ?? ZONE_COORDINATES[viewRide.originZone]?.lat;
        const originLng = viewRide.originLng ?? ZONE_COORDINATES[viewRide.originZone]?.lng;
        const destLat = viewRide.destinationLat ?? ZONE_COORDINATES[viewRide.destinationZone]?.lat;
        const destLng = viewRide.destinationLng ?? ZONE_COORDINATES[viewRide.destinationZone]?.lng;

        const mapOrigin = originLat && originLng ? { lat: originLat, lng: originLng, label: viewRide.originZone } : null;
        const mapDest = destLat && destLng ? { lat: destLat, lng: destLng, label: viewRide.destinationZone } : null;

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
                  <p className="text-xs text-uber-gray-400 mt-0.5">Ruta de transporte universitario</p>
                </div>
                <button
                  onClick={() => setViewRide(null)}
                  className="text-uber-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-1.5 rounded-full hover:bg-white/10 text-xl font-medium"
                >✕</button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Driver Info Card */}
                <div className="bg-uber-gray-50 rounded-2xl p-4 border border-uber-gray-100 shadow-uber-sm flex items-center justify-between gap-4">
                  {loadingDriver ? (
                    <div className="flex items-center gap-3 w-full animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-uber-gray-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-uber-gray-200 rounded w-1/3" />
                        <div className="h-2.5 bg-uber-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ) : driverProfile ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Driver photo */}
                        {driverProfile.photoUrl ? (
                          <img
                            src={driverProfile.photoUrl}
                            alt={driverProfile.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-base border-2 border-white shadow-sm shrink-0">
                            {driverProfile.name?.[0].toUpperCase() || '?'}
                          </div>
                        )}

                        {/* Driver details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-extrabold text-black truncate">{driverProfile.name}</span>
                            {driverProfile.isVerified && (
                              <span className="text-uber-green inline-flex shrink-0" title="Perfil verificado">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-uber-gray-500 truncate mt-0.5">
                            {driverProfile.career || 'Conductor Universitario'}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-100 rounded-md px-1.5 py-0.5 w-fit">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            <span>{(() => {
                              const val = parseFloat(driverProfile.reputation as any);
                              return isNaN(val) ? '5.0' : val.toFixed(1);
                            })()}</span>
                            <span className="text-uber-gray-400 font-normal">({driverProfile.totalRatings || 0} calif.)</span>
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp / Phone Action buttons */}
                      {driverProfile.phone && (
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${driverProfile.phone}`}
                            className="w-9 h-9 rounded-full bg-white border border-uber-gray-200 flex items-center justify-center text-uber-gray-700 hover:bg-uber-gray-100 transition-colors shadow-sm"
                            title="Llamar al conductor"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          </a>
                          <a
                            href={`https://wa.me/${driverProfile.phone.startsWith('+') ? driverProfile.phone.replace('+', '') : (driverProfile.phone.startsWith('09') ? '593' + driverProfile.phone.substring(1) : driverProfile.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors shadow-sm"
                            title="Enviar WhatsApp"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-uber-gray-400 font-medium py-1">Información de conductor no disponible</div>
                  )}
                </div>

                {/* Route segment */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1.5 mt-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-black animate-pulse" />
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
                    <span className="text-[9px] text-uber-gray-400 block font-bold uppercase tracking-wider mb-1">Capacidad</span>
                    <span className="text-xs font-extrabold text-black block">{viewRide.availableSeats} asientos</span>
                    <span className="text-[10px] text-uber-gray-500 font-medium block mt-0.5">Disponibles</span>
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
                {/* Solicitar unirse form */}
                {viewRide.driverId !== user?.id && viewRide.status === 'PUBLISHED' && (
                  (() => {
                    const alreadyRequested = myRequests.some(r => r.rideId === viewRide.id && (r.status === 'PENDING' || r.status === 'ACCEPTED'));
                    if (alreadyRequested) {
                      return (
                        <div className="text-center p-3.5 bg-green-50 border border-green-200 text-uber-green text-xs font-bold rounded-xl uppercase tracking-wider shadow-xs">
                          Ya has enviado una solicitud para este viaje
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-3">
                        <input
                          className="w-full px-4 py-3 bg-white rounded-xl text-sm text-black border border-uber-gray-200 outline-none focus:ring-2 focus:ring-black/10 focus:border-black placeholder-uber-gray-400"
                          placeholder="Escribe un mensaje al conductor (ej: Llevo mochila grande)..."
                          value={requestMsg}
                          onChange={e => setRequestMsg(e.target.value)}
                        />
                        <button onClick={() => handleRequestJoin(viewRide.id)} className="uber-btn-primary w-full py-3.5 text-sm font-bold tracking-wide">
                          Solicitar unirme al viaje
                        </button>
                      </div>
                    );
                  })()
                )}

                {/* Owner options: Delete */}
                {viewRide.driverId === user?.id && (
                  <div className="flex gap-3">
                    <button
                      className="flex-1 py-3 text-xs font-extrabold text-white bg-uber-red hover:bg-red-700 transition-colors border border-red-200 rounded-xl inline-flex items-center justify-center gap-2 tracking-wider"
                      onClick={() => setConfirmDelete(viewRide.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      ELIMINAR ESTE VIAJE
                    </button>
                    <button
                      onClick={() => setViewRide(null)}
                      className="uber-btn-secondary flex-1 py-3 text-xs font-bold tracking-wider"
                    >
                      CERRAR
                    </button>
                  </div>
                )}

                {/* Visitor view closing if they can't request */}
                {viewRide.driverId !== user?.id && viewRide.status !== 'PUBLISHED' && (
                  <button
                    onClick={() => setViewRide(null)}
                    className="uber-btn-secondary w-full py-3 text-xs font-bold tracking-wider"
                  >
                    CERRAR
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ DELETE CONFIRMATION MODAL ═══ */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-black text-white px-6 py-5 shrink-0">
              <h3 className="text-lg font-bold">¿Eliminar este viaje?</h3>
              <p className="text-xs text-uber-gray-400 mt-0.5">Esta acción no se puede deshacer</p>
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
                    El viaje será borrado del sistema. Los pasajeros aceptados y pendientes serán notificados automáticamente de la cancelación.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-uber-gray-100">
                <button
                  onClick={() => handleDeleteRide(confirmDelete)}
                  className="flex-1 py-3 text-sm font-bold text-white bg-uber-red hover:bg-red-700 transition-colors rounded-xl inline-flex items-center justify-center gap-2"
                  style={{ border: 'none', cursor: 'pointer' }}
                >
                  Confirmar eliminación
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
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
    </div>
  );
};