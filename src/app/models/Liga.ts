export interface Liga {
  id_liga: number;
  nombre: string;
  numero_jugadores: number;
  max_jugadores: number;
  clave: string;
  // rol?: 'owner' | 'admin' | 'user'; // poner que se vea en un futuro
  dinero?: number;
  puntos?: number; 
}