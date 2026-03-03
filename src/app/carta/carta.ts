import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Jugador } from '../models/Jugador';

export function obtenerRutaEscudoGlobal(nombreEquipo: string): string {
  if (!nombreEquipo) return 'Utensilios/Escudos/real_trebol.png';

  const mapeo: { [key: string]: string } = {
    'Real Pinar FC': 'real_pinar.png',
    'Athletic Hullera': 'athletic_hullera.png',
    'Club Náutico Brisamar': 'club_nautico_brisamar.png',
    'Racing Vaguadas': 'racing_vaguadas.png',
    'Motor Club Chacón': 'motor_club_chacon.png',
    'Unión Fortaleza': 'union_fortaleza.png',
    'CD Frontera': 'cd_frontera.png',
    'Sporting Lechuza': 'sporting_lechuza.png',
    'CF Átomo': 'cf_atomo.png',
    'Deportivo Relámpago': 'deportivo_relampago.png',
    'CD Refugio': 'cd_refugio.png',
    'Dragones de Oriente': 'dragones_de_oriente.png',
    'UD Recreo': 'ud_recreo.png',
    'Alianza Metropolitana': 'alianza_metropolitana.png',
    'Neón City FC': 'neon_city_fc.png',
    'Pixel United': 'pixel_united.png',
    'Gourmet FC': 'gourmet_fc.png',
    'Titanes CF': 'titanes_cf.png',
    'Pangea FC': 'pangea_fc.png',
    'Cosmos United': 'cosmos_united.png',
    'Real Trébol FC': 'real_trebol.png'
  };
  
  const archivo = mapeo[nombreEquipo];
  return archivo ? `Utensilios/Escudos/${archivo}` : 'Utensilios/Escudos/real_trebol.png';
}

export function obtenerImagenJugadorGlobal(nombreJugador: string): string {
  const nombre = nombreJugador || 'Jugador';
  
  const nombreSeguro = encodeURIComponent(nombre);
  
  return `https://api.dicebear.com/9.x/micah/svg?seed=${nombreSeguro}&backgroundColor=transparent`;
}

// 3. EL COMPONENTE CARTA
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
}