export const DICCIONARIO_HABILIDADES: { [key: string]: { nombre: string, descripcion: string } } = {
  // ============================
  // 🔥 HABILIDADES ESPECIALES
  // ============================

  // Ofensivas
  'HabEspecial_Francotirador': { nombre: 'Francotirador', descripcion: 'Cada gol que marque este jugador le otorga el doble de puntos de lo normal. Pura pólvora.' },
  'HabEspecial_Egoista': { nombre: 'Egoísta', descripcion: 'Si es el único que marca goles para su equipo en ese partido, se lleva un bonus bestial de +10 puntos.' },
  'HabEspecial_EfectoBolaNieve': { nombre: 'Efecto Bola de Nieve', descripcion: 'Gana +1 punto extra por cada gol que marque su equipo, independientemente de si los ha marcado él o no.' },
  'HabEspecial_HeroeAgonico': { nombre: 'Héroe Agónico', descripcion: 'Si su equipo marca un gol en los últimos 10 minutos del partido y ganan, recibe +8 puntos.' },
  'HabEspecial_AsistenciaFantasma': { nombre: 'Asistencia Fantasma', descripcion: 'Cada vez que un delantero de su equipo marca, él se lleva +2 puntos por creación de jugada invisible.' },
  
  // Defensivas
  'HabEspecial_CerrojoAbsoluto': { nombre: 'Cerrojo Absoluto', descripcion: 'Si el equipo termina con la portería a cero, sus puntos totales de esa jornada se multiplican x1.5.' },
  'HabEspecial_SalvadorAlambre': { nombre: 'Salvador en el Alambre', descripcion: 'Si su equipo gana el partido por exactamente 1 gol de diferencia, recibe +7 puntos.' },
  'HabEspecial_OrgulloCaido': { nombre: 'Orgullo Caído', descripcion: 'Si el equipo recibe una paliza (pierde por 3 o más), evita restar puntos y se queda en un mínimo de +2.' },
  'HabEspecial_JuegoCaballeros': { nombre: 'Juego de Caballeros', descripcion: 'Inmunidad total a las tarjetas. No sufre penalización de puntos por amarillas o rojas.' },
  'HabEspecial_MuroRebotador': { nombre: 'Muro Rebotador', descripcion: 'Por cada tiro a puerta fallado por el equipo rival, este jugador suma +0.5 puntos extra.' },
  
  // Suerte y Apuestas
  'HabEspecial_TodoONada': { nombre: 'Todo o Nada', descripcion: 'Si su equipo gana, sus puntos se multiplican x2. Si su equipo pierde, sus puntos bajan a 0.' },
  'HabEspecial_DadoDelCaos': { nombre: 'Dado del Caos', descripcion: 'Al final del partido tira un dado virtual: puede sumarle +10 puntos de golpe... o restarle -5.' },
  'HabEspecial_Espejismo': { nombre: 'Espejismo', descripcion: 'Tiene un 10% de probabilidad matemática de duplicar todos los puntos de su equipo entero.' },
  'HabEspecial_RemontadaEpica': { nombre: 'Remontada Épica', descripcion: 'Si el rival marca el primer gol, pero el equipo de este jugador termina ganando, se lleva un +12.' },
  'HabEspecial_ImanFaltas': { nombre: 'Imán de Faltas', descripcion: 'El simulador le otorga entre +1 y +5 puntos extra en cada partido simulando faltas provocadas.' },
  
  // Sinergia
  'HabEspecial_LiderEspiritual': { nombre: 'Líder Espiritual', descripcion: 'Por estar en la alineación titular, le regala +1 punto extra a TODOS los compañeros de su equipo.' },
  'HabEspecial_Trotamundos': { nombre: 'Trotamundos', descripcion: 'Si su equipo juega como Visitante en la simulación, empieza el partido con +3 puntos de base.' },
  'HabEspecial_AnclaLocal': { nombre: 'Ancla Local', descripcion: 'Si juega en su estadio (Local), sus estadísticas de defensa en el simulador suben un 15%.' },
  'HabEspecial_Matagigantes': { nombre: 'Matagigantes', descripcion: 'Si el equipo rival tiene más media, recibe +5 puntos extra si logran empatar o ganar.' },
  'HabEspecial_EfectoSombra': { nombre: 'Efecto Sombra', descripcion: 'Si el mejor jugador del equipo contrario no marca gol, este jugador suma +4 puntos.' },
  
  // Habilidades Únicas (Ejemplo Chacón)
  'HabEspecial_MotoChacon': { nombre: 'Moto Chacón', descripcion: 'Si llegan al descanso empatando o perdiendo, su ataque sube x1.5. El gol de la remontada le da +10 puntos.' },


  // ============================
  // 👑 HABILIDADES ULTRA (El Jugador 12 / Bufos Globales)
  // ============================

  'HabUltra_Trebolin': { 
    nombre: 'Muro de la Cumbre', 
    descripcion: 'El Guardián bendice tu área. Aumenta las estadísticas de tus DF y PT en un 20%. Tu equipo es inmune a la resta de puntos por goles encajados.' 
  },
  'HabUltra_Wade': { 
    nombre: 'Aura del Capitán', 
    descripcion: 'Yeremy impone su ley desde el banquillo. Otorga un +10% a TODAS las estadísticas. Además, anula la primera tarjeta roja que reciba tu equipo.' 
  },
  'HabUltra_Cuestarriba': { 
    nombre: 'Pulmones de Piedra', 
    descripcion: 'En los últimos 30 minutos de partido, tu equipo recibe un +25% extra en Defensa y Medio, evitando esos temidos goles en contra al final.' 
  },
  'HabUltra_Evil': { 
    nombre: 'Furia Desatada', 
    descripcion: 'El Caos. Reduce las estadísticas del equipo contrario en un 10%. Si vas perdiendo al descanso, tus Delanteros reciben un modo "Berserker" (+30% Ataque).' 
  },
  'HabUltra_Forti': { 
    nombre: 'Táctica Omnisciente', 
    descripcion: 'La Mente Maestra dirige. Los pases de tus MC no fallan. Si juegas contra Carlos Chacón, el salseo multiplica tus stats globales un +15%.' 
  },
  'HabUltra_Modric': { 
    nombre: 'Pausa Zen', 
    descripcion: 'Reduce la posesión del equipo contrario a la mitad, limitando sus ocasiones. Tus centrocampistas (MC) ganan un +20% en Pase y Ataque.' 
  },
  'HabUltra_Chemin': { 
    nombre: 'Alquimia Pura', 
    descripcion: 'Convierte el 50% de los tiros fallados por tus Delanteros en "Segundas Oportunidades" letales. +15% a todas las stats ofensivas.' 
  },
  'HabUltra_BlueBird': { 
    nombre: 'Viento del Norte', 
    descripcion: 'Invalida el fuera de juego rival. Tus Medios y Delanteros son inalcanzables al contraataque, asegurando al menos 2 goles por partido.' 
  },
  'HabUltra_Falcao': { 
    nombre: 'Instinto Depredador', 
    descripcion: 'Dominio absoluto de los cielos. Ganas el 100% de los duelos aéreos. Cada córner a tu favor tiene un 80% de probabilidades de ser gol.' 
  },
  'HabUltra_Esnaiper': { 
    nombre: 'Puntería Divina', 
    descripcion: 'Aumenta el Ataque de tus Delanteros en un 35%. Si un delantero tuyo tira a puerta, es gol automático sin importar el portero rival.' 
  },
  'HabUltra_Churumbel': { 
    nombre: 'Magia Callejera', 
    descripcion: 'La Defensa del equipo contrario se reduce un 25% por humillación de regates. Otorga un bonus de +5 Puntos Fantasy por "Espectáculo".' 
  }
};

export function obtenerInfoHabilidad(codigo: string) {
  if (!codigo) return null;
  return DICCIONARIO_HABILIDADES[codigo] || { nombre: 'Habilidad Desconocida', descripcion: 'Efecto encriptado.' };
}