import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Jugador } from '../models/Jugador';

@Component({
  selector: 'app-carta',
  standalone: true, 
  imports: [CommonModule], 
  templateUrl: './carta.html',
  styleUrls: ['./carta.css']
})
export class CartaComponent {
  @Input() jugador!: Jugador;

  // Mapa de escudos de tu liga
  obtenerRutaEscudo(nombreEquipo: string): string {
    if (!nombreEquipo) return 'Utensilios/Escudos/escudo_default.png';

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
    return archivo ? `Utensilios/Escudos/${archivo}` : 'Utensilios/Escudos/escudo_default.png';
  }

  // Si el jugador no trae imagen, le creamos un Dicebear en el momento usando su nombre
  obtenerImagenJugador(): string {
    if (this.jugador && this.jugador.imagen) {
      return this.jugador.imagen;
    }
    // Estilo "micah" o el que prefieras de Dicebear
    return `https://api.dicebear.com/9.x/micah/svg?seed=${this.jugador?.nombre || 'Default'}`;
  }
}