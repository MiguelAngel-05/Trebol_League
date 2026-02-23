export interface Jugador {
  id_futbolista: number;
  nombre: string;
  posicion: 'DL' | 'MC' | 'DF' | 'PT';
  precio: number;
  equipo: string;
  media: number;
  id_vendedor?: number; 
  vendedor_name?: string;
  pujado_por_mi?: boolean;
  mi_puja_actual?: number;
  // Campos opcionales extra para el diseño de la carta
  imagen?: string;
  stats?: {
    ataque: number;
    defensa: number;
    velocidad: number;
    pase: number;
  };
}