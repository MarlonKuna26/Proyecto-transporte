import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { path: '/dashboard',    label: 'Inicio',      icon: HomeIcon },
  { path: '/rides',        label: 'Viajes',       icon: CarIcon },
  { path: '/my-rides',     label: 'Mis Viajes',   icon: ListIcon },
  { path: '/my-requests',  label: 'Solicitudes',  icon: InboxIcon },
  { path: '/payments',     label: 'Pagos',        icon: WalletIcon },
  { path: '/profile',      label: 'Perfil',       icon: UserIcon },
];

const adminNav = [
  { path: '/admin', label: 'Panel Admin', icon: SettingsIcon },
];

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNav = user?.role === 'ADMIN' ? [...navItems, ...adminNav] : navItems;

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f3ef', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        .nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 14px; border-radius: 2px;
          font-size: 13px; font-weight: 400; color: #8a8fa8;
          text-decoration: none; transition: all 0.15s;
          letter-spacing: 0.02em;
        }
        .nav-link:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .nav-link-active {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 14px; border-radius: 2px;
          font-size: 13px; font-weight: 500; color: #1a1a2e;
          background: #c8a96e; text-decoration: none;
          letter-spacing: 0.02em;
        }
        .nav-link-active svg { opacity: 1; }
        .sidebar-scrollbar::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(26,26,46,0.55)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-64
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ background: '#1a1a2e', borderRight: '0.5px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="px-6 py-6" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
          <Link to="/dashboard" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <div
              className="w-9 h-9 flex items-center justify-center shrink-0"
              style={{ background: '#c8a96e', borderRadius: '2px' }}
            >
              <CarIconSmall />
            </div>
            <div>
              <h1 className="text-white text-lg" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, lineHeight: 1.1 }}>
                U-Ride
              </h1>
              <p className="text-[10px] text-[#8a8fa8] tracking-widest uppercase mt-0.5">Transporte estudiantil</p>
            </div>
          </Link>
        </div>

        {/* Gold accent line */}
        <div className="w-full h-px" style={{ background: 'linear-gradient(90deg, #c8a96e 0%, transparent 100%)', opacity: 0.5 }} />

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto sidebar-scrollbar">
          {allNav.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={active ? 'nav-link-active' : 'nav-link'}
              >
                <Icon active={active} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-4" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 flex items-center justify-center text-xs font-medium text-[#1a1a2e] shrink-0"
              style={{ background: '#c8a96e', borderRadius: '2px', fontFamily: "'Playfair Display', serif" }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate" style={{ lineHeight: 1.2 }}>{user?.name}</p>
              <p className="text-[11px] text-[#666] truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-[#666] text-xs font-medium tracking-wider uppercase transition-colors hover:text-[#c0392b]"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
          >
            <LogoutIcon />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Mobile header */}
        <header
          className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3"
          style={{ background: '#1a1a2e', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-8 h-8 text-[#8a8fa8] hover:text-white transition-colors"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <MenuIcon />
          </button>

          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 flex items-center justify-center"
              style={{ background: '#c8a96e', borderRadius: '2px' }}
            >
              <CarIconSmall small />
            </div>
            <span className="text-white text-base" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>
              U-Ride
            </span>
          </div>

          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-medium text-[#1a1a2e]"
            style={{ background: '#c8a96e', borderRadius: '2px', fontFamily: "'Playfair Display', serif" }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto" style={{ background: '#f5f3ef' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

/* ── SVG Icons ── */
type IconProps = { active?: boolean; small?: boolean };

function HomeIcon({ active }: IconProps) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#1a1a2e' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function CarIcon({ active }: IconProps) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#1a1a2e' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/><circle cx="6.5" cy="15.5" r="1.5"/><circle cx="17.5" cy="15.5" r="1.5"/></svg>;
}
function CarIconSmall({ small }: IconProps) {
  return <svg width={small ? 12 : 16} height={small ? 12 : 16} viewBox="0 0 24 24" fill="#1a1a2e"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>;
}
function ListIcon({ active }: IconProps) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#1a1a2e' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
}
function InboxIcon({ active }: IconProps) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#1a1a2e' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
}
function WalletIcon({ active }: IconProps) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#1a1a2e' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
}
function UserIcon({ active }: IconProps) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#1a1a2e' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function SettingsIcon({ active }: IconProps) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#1a1a2e' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function LogoutIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function MenuIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}