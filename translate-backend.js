const fs = require('fs');
const path = require('path');

const translations = {
  'Missing authorization token': 'Token de autorización ausente',
  'Invalid or expired access token': 'Token de acceso inválido o expirado',
  'Invalid or expired refresh token': 'Token de actualización inválido o expirado',
  'rideRequestId and amount are required': 'El ID de solicitud de viaje y el monto son obligatorios',
  'Accepted ride request not found': 'No se encontró una solicitud de viaje aceptada',
  'Ride request not found for capture': 'No se encontró la solicitud de viaje para capturar el pago',
  'Report not found': 'Reporte no encontrado',
  'Email and verification code are required': 'El correo y el código de verificación son obligatorios',
  'Email and password are required': 'El correo y la contraseña son obligatorios',
  'Email is required': 'El correo es obligatorio',
  'Refresh token is required': 'El token de actualización es obligatorio',
  'Vehicle not found': 'Vehículo no encontrado',
  'Ride not found': 'Viaje no encontrado',
  'You cannot join your own ride': 'No puedes unirte a tu propio viaje',
  'Ride is not available': 'El viaje no está disponible',
  'You already have a pending or accepted request for this ride': 'Ya tienes una solicitud pendiente o aceptada para este viaje',
  'You cannot rate yourself': 'No puedes calificarte a ti mismo',
  'Can only rate completed or cancelled rides': 'Solo se pueden calificar viajes completados o cancelados',
  'You already rated this user for this ride': 'Ya calificaste a este usuario para este viaje',
  'Request not found': 'Solicitud no encontrada',
  'Request is not pending': 'La solicitud no está pendiente',
  'Only the driver can reject requests': 'Solo el conductor puede rechazar solicitudes',
  'Vehicle ID is required': 'El ID del vehículo es obligatorio',
  'You are not authorized to view these requests': 'No tienes autorización para ver estas solicitudes',
  'Ride ID is required': 'El ID del viaje es obligatorio',
  'Rated user ID is required': 'El ID del usuario calificado es obligatorio',
  'You can only cancel your own requests': 'Solo puedes cancelar tus propias solicitudes',
  'Request is already cancelled': 'La solicitud ya ha sido cancelada',
  'Only the driver can accept requests': 'Solo el conductor puede aceptar solicitudes',
  'Not enough seats available': 'No hay suficientes asientos disponibles',
  'Origin zone is required': 'La zona de origen es obligatoria',
  'Destination zone is required': 'La zona de destino es obligatoria',
  'Departure date is required': 'La fecha de salida es obligatoria',
  'Departure time is required': 'La hora de salida es obligatoria',
  'Price per seat cannot be negative': 'El precio por asiento no puede ser negativo',
  'Reported user ID is required': 'El ID del usuario reportado es obligatorio',
  'Reason is required': 'La razón es obligatoria',
  'Status is required': 'El estado es obligatorio',
  'Admin notes are required': 'Las notas administrativas son obligatorias',
  'You cannot report yourself': 'No puedes reportarte a ti mismo',
  'latitude and longitude are required': 'La latitud y longitud son obligatorias',
  'Only the driver of an active ride can update tracking': 'Solo el conductor de un viaje activo puede actualizar el seguimiento',
  'Ride not found or not eligible to start': 'Viaje no encontrado o no apto para iniciar',
  'Ride not found or not in progress': 'Viaje no encontrado o no está en curso',
  'Invalid email or password': 'Correo o contraseña inválidos',
  'A user with this email already exists': 'Ya existe un usuario con este correo',
  'Only the driver can cancel the ride': 'Solo el conductor puede cancelar el viaje',
  'Ride is already completed or cancelled': 'El viaje ya está completado o cancelado',
  'No pending registration found for this email': 'No se encontró un registro pendiente para este correo',
  'You are not the owner of this vehicle': 'No eres el dueño de este vehículo',
  'User not found': 'Usuario no encontrado',
  'You can only delete your own vehicles': 'Solo puedes eliminar tus propios vehículos',
  'Only the driver can update the ride': 'Solo el conductor puede actualizar el viaje',
  'Cannot update a completed or cancelled ride': 'No se puede actualizar un viaje completado o cancelado',
  'No puedes editar el viaje si ya tiene pasajeros solicitando unirse o aceptados': 'No puedes editar el viaje si ya tiene pasajeros solicitando unirse o aceptados', // Already in Spanish or similar
  'Información de conductor no disponible': 'Información de conductor no disponible',
  'Invalid or expired verification code': 'Código de verificación inválido o expirado',
  'Invalid verification code': 'Código de verificación inválido'
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const backendSrc = path.join(__dirname, 'packages', 'backend', 'src');

walkDir(backendSrc, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    for (const [eng, esp] of Object.entries(translations)) {
      // Usar regex para reemplazar las cadenas exactas dentro de las excepciones de Error
      const regex = new RegExp(`(['"])${eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`, 'g');
      content = content.replace(regex, `$1${esp}$2`);
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
});
