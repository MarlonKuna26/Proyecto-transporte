import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-zinc-400 mt-12 border-t border-zinc-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        {/* Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 pb-12 border-b border-zinc-800">
          {/* Company Column */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4 tracking-wider uppercase">Empresa</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Acerca de U-Ride</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Seguridad</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Términos de uso</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Users Column */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4 tracking-wider uppercase">Para Usuarios</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Buscar viajes</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Mis viajes</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Solicitudes</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Pagos</a></li>
            </ul>
          </div>

          {/* Drivers Column */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4 tracking-wider uppercase">Para Conductores</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Publicar viaje</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Mi vehículo</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Ganancias</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Soporte</a></li>
            </ul>
          </div>

          {/* Info Column */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4 tracking-wider uppercase">Información</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Privacidad</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Cookies</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Centro de ayuda</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>

          {/* Connect Column */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4 tracking-wider uppercase">Conecta</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Facebook</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">LinkedIn</a></li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="font-semibold text-white text-sm mb-4 tracking-wider uppercase">Soporte</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Tutoriales</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Reportar problema</a></li>
              <li><a href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Enviar feedback</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">© 2026 U-Ride · Transporte Estudiantil. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <button className="text-xs text-zinc-500 hover:text-white transition-colors">🌍 Español</button>
            <button className="text-xs text-zinc-500 hover:text-white transition-colors">🔒 Privacidad</button>
            <button className="text-xs text-zinc-500 hover:text-white transition-colors">⚙️ Configuración</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
