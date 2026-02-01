export interface Jugador {
  id_futbolista: number;
  nombre: string;
  posicion: 'DL' | 'MC' | 'DF' | 'PT';
  dorsal?: number;
  precio: number;
}
