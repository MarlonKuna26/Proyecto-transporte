export const ESTRUCTURA_UTA = {
  "Facultad de Ciencias de la Salud": [
    "Medicina", "Enfermería", "Laboratorio Clínico", "Psicología Clínica", "Nutrición y Dietética", "Fisioterapia"
  ],
  "Facultad de Jurisprudencia y Ciencias Sociales": [
    "Derecho", "Trabajo Social", "Comunicación"
  ],
  "Facultad de Ciencias Administrativas": [
    "Administración de Empresas", "Mercadotecnia"
  ],
  "Facultad de Contabilidad y Auditoría": [
    "Contabilidad y Auditoría", "Economía"
  ],
  "Facultad de Ingeniería en Sistemas, Electrónica e Industrial": [
    "Software", "Tecnologías de la Información", "Telecomunicaciones", "Ingeniería Industrial", "Electrónica y Automatización"
  ],
  "Facultad de Ingeniería Civil y Mecánica": [
    "Ingeniería Civil", "Ingeniería Mecánica"
  ],
  "Facultad de Diseño y Arquitectura": [
    "Arquitectura", "Diseño Industrial", "Diseño Gráfico", "Diseño Textil e Indumentaria"
  ],
  "Facultad de Ciencias Humanas y de la Educación": [
    "Educación Inicial", "Educación Básica", "Psicopedagogía", "Pedagogía de los Idiomas Nacionales y Extranjeros", "Pedagogía de la Actividad Física y Deporte", "Turismo"
  ],
  "Facultad de Ciencia e Ingeniería en Alimentos y Biotecnología": [
    "Ingeniería en Alimentos", "Biotecnología", "Bioquímica"
  ],
  "Facultad de Ciencias Agropecuarias": [
    "Agronomía", "Medicina Veterinaria"
  ]
};

export const ZONAS_AMBATO = [
  "Norte (Ficoa, Pinllo, Izamba, Ingahurco)",
  "Sur (Huachi Chico, Huachi Grande, Techo Propio)",
  "Centro (Av. Cevallos, 12 de Noviembre, Bolívar)",
  "Cevallos / Quero (Querochaca)",
  "Pelileo / Baños",
  "Píllaro",
  "Latacunga",
  "Oriente (Av. Bolivariana, Terremoto, Totoras)",
  "Oeste (Miraflores, Santa Rosa, San Bartolo)"
];

export const CAMPUS_UTA = [
  "Campus Huachi",
  "Campus Ingahurco",
  "Campus Querochaca"
];

export const VEHICULO_DATA = {
  marcas: ["Chevrolet", "Toyota", "Kia", "Hyundai", "Nissan", "Mazda", "Suzuki", "Ford", "Renault", "Volkswagen", "Great Wall", "Chery", "Jac", "Hino"],
  colores: ["Blanco", "Negro", "Gris", "Plateado", "Rojo", "Azul", "Blanco Perla", "Vino", "Verde", "Amarillo", "Naranja", "Café"],
};

export const ZONE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Campus UTA
  "Campus Huachi": { lat: -1.2721, lng: -78.6341 },
  "Campus Ingahurco": { lat: -1.2435, lng: -78.6186 },
  "Campus Querochaca": { lat: -1.3653, lng: -78.6015 },

  // Zonas Ambato
  "Norte (Ficoa, Pinllo, Izamba, Ingahurco)": { lat: -1.2267, lng: -78.6083 },
  "Sur (Huachi Chico, Huachi Grande, Techo Propio)": { lat: -1.2678, lng: -78.6254 },
  "Centro (Av. Cevallos, 12 de Noviembre, Bolívar)": { lat: -1.2491, lng: -78.6167 },
  "Cevallos / Quero (Querochaca)": { lat: -1.3621, lng: -78.6045 },
  "Pelileo / Baños": { lat: -1.3283, lng: -78.5135 },
  "Píllaro": { lat: -1.1718, lng: -78.5394 },
  "Latacunga": { lat: -0.9333, lng: -78.6167 },
  "Oriente (Av. Bolivariana, Terremoto, Totoras)": { lat: -1.2691, lng: -78.5956 },
  "Oeste (Miraflores, Santa Rosa, San Bartolo)": { lat: -1.2584, lng: -78.6397 }
};

