import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/* ── Navigation config ── */
const navItems = [
  { path: '/dashboard',    label: 'Inicio',      icon: NavHomeIcon },
  { path: '/rides',        label: 'Viajes',       icon: NavCarIcon },
  { path: '/my-rides',     label: 'Mis Viajes',   icon: NavListIcon },
  { path: '/my-requests',  label: 'Solicitudes',  icon: NavInboxIcon },
  { path: '/payments',     label: 'Pagos',        icon: NavWalletIcon },
  { path: '/my-reports',   label: 'Mis Reportes', icon: NavReportIcon },
];

const adminNav = [
  { path: '/admin?tab=stats', label: 'Estadísticas', icon: NavStatsIcon },
  { path: '/admin?tab=users', label: 'Usuarios', icon: NavUsersIcon },
  { path: '/admin?tab=reports', label: 'Reportes', icon: NavReportIcon },
  { path: '/admin?tab=config', label: 'Configuración', icon: NavSettingsIcon },
];

/* ── Mobile bottom tabs ── */
const mobileBottomTabs = [
  { path: '/dashboard',    label: 'Inicio',     icon: MobileHomeIcon },
  { path: '/rides',        label: 'Viajes',     icon: MobileCarIcon },
  { path: '/my-requests',  label: 'Actividad',  icon: MobileActivityIcon },
  { path: '/profile',      label: 'Cuenta',     icon: MobileAccountIcon },
];

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const clickedOutsideDesktop = !desktopRef.current || !desktopRef.current.contains(e.target as Node);
      const clickedOutsideMobile = !mobileRef.current || !mobileRef.current.contains(e.target as Node);
      
      if (clickedOutsideDesktop && clickedOutsideMobile) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const allNav = user?.role === 'ADMIN' ? adminNav : navItems;

  const isActive = (path: string) => {
    const [pathname, search] = path.split('?');
    if (search) {
      if (location.pathname === pathname) {
        const currentTab = new URLSearchParams(location.search).get('tab') || 'stats';
        const itemTab = new URLSearchParams(search).get('tab');
        return currentTab === itemTab;
      }
      return false;
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ═══ DESKTOP TOP NAVBAR (Uber style) ═══ */}
      <header className="uber-navbar hidden md:flex">
        {/* Left: Logo + Nav Tabs */}
        <div className="flex items-center h-full gap-1">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center mr-6 shrink-0"
            style={{ textDecoration: 'none' }}
          >
            <span className="text-xl font-bold text-black tracking-tight">
              U-Ride
            </span>
          </Link>

          {/* Nav tabs */}
          <nav className="flex items-center h-full">
            {allNav.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={active ? 'uber-nav-tab-active' : 'uber-nav-tab'}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Activity + Profile dropdown */}
        <div className="flex items-center gap-3">
          {/* Activity button (Only for STUDENT) */}
          {user?.role === 'STUDENT' && (
            <Link
              to="/my-rides"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-uber-gray-700 hover:bg-uber-gray-50 rounded-full transition-colors"
              style={{ textDecoration: 'none' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>Actividad</span>
            </Link>
          )}

          {/* Profile dropdown trigger */}
          <div className="relative" ref={desktopRef}>
            <button
              id="profile-dropdown-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-uber-gray-50 transition-colors"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {/* Avatar circle */}
              <div className="w-9 h-9 rounded-full bg-uber-gray-200 flex items-center justify-center overflow-hidden border border-zinc-200 shrink-0">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-uber-gray-700 select-none">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              {/* Chevron */}
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#545454" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* ═══ DROPDOWN MENU ═══ */}
            {dropdownOpen && (
              <div className="uber-dropdown" id="profile-dropdown-menu">
                {/* User header */}
                <div className="px-6 pb-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-uber-gray-200 flex items-center justify-center overflow-hidden border border-zinc-200 shrink-0">
                    {user?.photoUrl ? (
                      <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-semibold text-uber-gray-700 select-none">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-black truncate">{user?.name || 'Usuario'}</p>
                    <p className="text-sm text-uber-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>

                {/* Quick action buttons (Only for STUDENT) */}
                {user?.role === 'STUDENT' && (
                  <div className="px-6 pb-3 flex gap-3">
                    <DropdownQuickBtn icon={<IconHelp />} label="Ayuda" onClick={() => { setDropdownOpen(false); navigate('/rides'); }} />
                    <DropdownQuickBtn icon={<IconWallet />} label="Pagos" onClick={() => { setDropdownOpen(false); navigate('/payments'); }} />
                    <DropdownQuickBtn icon={<IconActivity />} label="Actividad" onClick={() => { setDropdownOpen(false); navigate('/my-rides'); }} />
                  </div>
                )}

                <div className="h-px bg-uber-gray-100 mx-4 my-1" />

                {/* ── All profile options ── */}

                {/* Gestionar cuenta → /profile (STUDENT) */}
                {user?.role === 'STUDENT' && (
                  <Link to="/profile" className="uber-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>Gestionar cuenta</span>
                  </Link>
                )}

                {/* Mis Viajes → /my-rides (STUDENT) */}
                {user?.role === 'STUDENT' && (
                  <Link to="/my-rides" className="uber-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/><circle cx="6.5" cy="15.5" r="1.5"/><circle cx="17.5" cy="15.5" r="1.5"/>
                    </svg>
                    <span>Mis Viajes</span>
                  </Link>
                )}

                {/* Solicitudes → /my-requests (STUDENT) */}
                {user?.role === 'STUDENT' && (
                  <Link to="/my-requests" className="uber-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                    </svg>
                    <span>Solicitudes</span>
                  </Link>
                )}

                {/* Pagos → /payments (STUDENT) */}
                {user?.role === 'STUDENT' && (
                  <Link to="/payments" className="uber-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                    <span>Pagos</span>
                  </Link>
                )}

                {/* Mis Reportes → /my-reports (STUDENT) */}
                {user?.role === 'STUDENT' && (
                  <Link to="/my-reports" className="uber-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <span>Mis Reportes</span>
                  </Link>
                )}

                {/* Buscar viajes → /rides (STUDENT) */}
                {user?.role === 'STUDENT' && (
                  <Link to="/rides" className="uber-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <span>Buscar viajes</span>
                  </Link>
                )}

                {/* Panel Admin (solo ADMIN) → /admin */}
                {user?.role === 'ADMIN' && (
                  <>
                    <div className="h-px bg-uber-gray-100 mx-4 my-1" />
                    <Link to="/admin" className="uber-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                      <span>Panel Admin</span>
                    </Link>
                  </>
                )}

                <div className="h-px bg-uber-gray-100 mx-4 my-1" />

                {/* Cerrar sesión */}
                <button
                  onClick={() => { setDropdownOpen(false); handleLogout(); }}
                  className="uber-dropdown-item w-full text-left"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#E11900' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E11900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ MOBILE TOP HEADER ═══ */}
      <header className="md:hidden sticky top-0 z-40 bg-white flex items-center justify-between px-4 h-14" style={{ borderBottom: '1px solid #E2E2E2' }}>
        {/* Logo */}
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <span className="text-lg font-bold text-black tracking-tight">U-Ride</span>
        </Link>

        {/* Right: Profile avatar */}
        <div className="relative" ref={mobileRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-zinc-200"
            style={{ background: '#E2E2E2', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-uber-gray-700 select-none">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </button>

          {/* Mobile dropdown */}
          {dropdownOpen && (
            <div className="uber-dropdown" style={{ right: 0, width: '300px' }}>
              <div className="px-6 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-uber-gray-200 flex items-center justify-center overflow-hidden border border-zinc-200 shrink-0">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base font-semibold text-uber-gray-700 select-none">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-black truncate">{user?.name || 'Usuario'}</p>
                  <p className="text-xs text-uber-gray-500 truncate">{user?.email}</p>
                </div>
              </div>

              <div className="h-px bg-uber-gray-100 mx-4 my-1" />

              {/* STUDENT mobile options */}
              {user?.role === 'STUDENT' && (
                <>
                  <Link to="/profile" className="uber-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>Mi perfil</span>
                  </Link>
                  <Link to="/my-rides" className="uber-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/><circle cx="6.5" cy="15.5" r="1.5"/><circle cx="17.5" cy="15.5" r="1.5"/></svg>
                    <span>Mis Viajes</span>
                  </Link>
                  <Link to="/my-requests" className="uber-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                    <span>Solicitudes</span>
                  </Link>
                  <Link to="/payments" className="uber-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    <span>Pagos</span>
                  </Link>
                  <Link to="/my-reports" className="uber-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <span>Mis Reportes</span>
                  </Link>
                  <Link to="/rides" className="uber-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <span>Buscar viajes</span>
                  </Link>
                </>
              )}

              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="uber-dropdown-item" onClick={() => setDropdownOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  <span>Panel Admin</span>
                </Link>
              )}

              <div className="h-px bg-uber-gray-100 mx-4 my-1" />

              <button
                onClick={() => { setDropdownOpen(false); handleLogout(); }}
                className="uber-dropdown-item w-full text-left"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#E11900' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E11900" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ═══ PAGE CONTENT ═══ */}
      <main className="flex-1 bg-white pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* ═══ MOBILE BOTTOM TAB BAR (Uber style) ═══ */}
      {user?.role === 'STUDENT' && (
        <nav className="uber-bottom-bar md:hidden">
          {mobileBottomTabs.map((tab) => {
            const active = isActive(tab.path);
            if (tab.path === '/profile') {
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={active ? 'uber-bottom-tab-active' : 'uber-bottom-tab'}
                >
                  {user?.photoUrl ? (
                    <div className={`w-[22px] h-[22px] rounded-full overflow-hidden border ${active ? 'border-black' : 'border-zinc-300'} flex items-center justify-center shrink-0`}>
                      <img src={user.photoUrl} alt="Account" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <MobileAccountIcon active={active} />
                  )}
                  <span>{tab.label}</span>
                </Link>
              );
            }
            
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={active ? 'uber-bottom-tab-active' : 'uber-bottom-tab'}
              >
                <Icon active={active} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
};

/* ── Dropdown Quick Button ── */
function DropdownQuickBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center flex-1 py-3 rounded-xl bg-uber-gray-50 hover:bg-uber-gray-100 transition-colors"
      style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: '#F6F6F6' }}
    >
      <div className="text-uber-gray-700 mb-1">{icon}</div>
      <span className="text-xs font-medium text-uber-gray-700">{label}</span>
    </button>
  );
}

/* ── Desktop Nav Icons ── */
function NavHomeIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function NavCarIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/><circle cx="6.5" cy="15.5" r="1.5"/><circle cx="17.5" cy="15.5" r="1.5"/></svg>;
}
function NavListIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
}
function NavInboxIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
}
function NavWalletIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
}
function NavSettingsIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function NavReportIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
}
function NavStatsIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
}
function NavUsersIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}

/* ── Mobile Bottom Tab Icons ── */
function MobileHomeIcon({ active }: { active?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#000' : 'none'} stroke={active ? '#000' : '#AFAFAF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function MobileCarIcon({ active }: { active?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#000' : 'none'} stroke={active ? '#000' : '#AFAFAF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/><circle cx="6.5" cy="15.5" r="1.5"/><circle cx="17.5" cy="15.5" r="1.5"/></svg>;
}
function MobileActivityIcon({ active }: { active?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#000' : '#AFAFAF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function MobileAccountIcon({ active }: { active?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#000' : '#AFAFAF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}

/* ── Dropdown Quick Button Icons ── */
function IconHelp() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function IconWallet() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
}
function IconActivity() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}