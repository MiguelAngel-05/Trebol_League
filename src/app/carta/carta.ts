import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Jugador } from '../models/Jugador';

export function obtenerRutaEscudoGlobal(nombreEquipo: string): string {
  if (!nombreEquipo) return 'Utensilios/Escudos/real_trebol.webp';

  const mapeo: { [key: string]: string } = {
    'Real Pinar FC': 'real_pinar.webp',
    'Athletic Hullera': 'athletic_hullera.webp',
    'Club Náutico Brisamar': 'club_nautico_brisamar.webp',
    'Racing Vaguadas': 'racing_vaguadas.webp',
    'Motor Club Chacón': 'motor_club_chacon.webp',
    'Unión Fortaleza': 'union_fortaleza.webp',
    'CD Frontera': 'cd_frontera.webp',
    'Sporting Lechuza': 'sporting_lechuza.webp',
    'CF Átomo': 'cf_atomo.webp',
    'Deportivo Relámpago': 'deportivo_relampago.webp',
    'CD Refugio': 'cd_refugio.webp',
    'Dragones de Oriente': 'dragones_de_oriente.webp',
    'UD Recreo': 'ud_recreo.webp',
    'Alianza Metropolitana': 'alianza_metropolitana.webp',
    'Neón City FC': 'neon_city_fc.webp',
    'Pixel United': 'pixel_united.webp',
    'Gourmet FC': 'gourmet_fc.webp',
    'Titanes CF': 'titanes_cf.webp',
    'Pangea FC': 'pangea_fc.webp',
    'Cosmos United': 'cosmos_united.webp',
    'Real Trébol FC': 'real_trebol_fc.webp'
  };
  
  const archivo = mapeo[nombreEquipo];
  return archivo ? `Utensilios/Escudos/${archivo}` : 'Utensilios/Escudos/real_trebol.webp';
}

export function obtenerImagenJugadorGlobal(nombreJugador: string): string {
  const nombre = nombreJugador || 'Jugador';
  const nombreSeguro = encodeURIComponent(nombre);
  return `https://api.dicebear.com/9.x/micah/svg?seed=${nombreSeguro}&backgroundColor=transparent`;
}

@Component({
  selector: 'app-carta',
  standalone: true, 
  imports: [CommonModule], 
  templateUrl: './carta.html',
  styleUrls: ['./carta.css']
})
export class CartaComponent {
  @Input() jugador!: any; 

  get rutaEscudo() { 
    return obtenerRutaEscudoGlobal(this.jugador?.equipo); 
  }
  
  get fotoJugador() { 
    return obtenerImagenJugadorGlobal(this.jugador?.nombre); 
  }

  // AQUÍ AÑADIMOS EL FONDO ULTRA
  get fondoCarta() {
    if (this.jugador?.tipo_carta === 'ultra') {
      return "url('/Utensilios/Cartas/CartaTL_ultra.webp')"; 
    }
    if (this.jugador?.tipo_carta === 'especial') {
      return "url('/Utensilios/Cartas/CartaTL_especial.webp')";
    }
    return "url('/Utensilios/Cartas/CartaTL_normal.webp')";
  }
}