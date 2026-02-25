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
  en_venta?: boolean;
  precio_venta?: number;
  imagen?: string;
  ataque?: number;
  defensa?: number;
  parada?: number;
  pase?: number;
}