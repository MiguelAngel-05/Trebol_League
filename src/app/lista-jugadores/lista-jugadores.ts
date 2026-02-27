import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { Jugador } from '../models/Jugador';

@Component({
  selector: 'app-lista-jugadores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-jugadores.html',
  styleUrl: './lista-jugadores.css'
})
export class ListaJugadores implements OnInit {

  user: any = null;
  id_liga!: number;
  dinero: number = 0;

  misJugadores: Jugador[] = [];
  isLoading = true;

  valorPlantilla: number = 0;
  mediaPlantilla: number = 0;
  totalJugadores: number = 0;

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // API URL
  private apiBase = 'https://api-trebol-league.vercel.app';

  ngOnInit() {
    this.id_liga = Number(this.route.snapshot.paramMap.get('idLiga'));
    const token = localStorage.getItem('token');

    if (token) {
      try { this.user = jwtDecode(token); } catch {}
    }

    this.cargarDatosUsuario();
    this.cargarMisJugadores();
  }

  cargarDatosUsuario() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/datos-usuario`, { headers })
      .subscribe({
        next: (data) => this.dinero = Number(data.dinero),
        error: (err) => console.error(err)
      });
  }

  cargarMisJugadores() {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<Jugador[]>(`${this.apiBase}/api/ligas/${this.id_liga}/mis-jugadores`, { headers })
      .subscribe({
        next: (data) => {
          this.misJugadores = data.map(j => ({
            ...j,
            posicion: this.normalizarPosicion(j.posicion)
          }));
          
          this.calcularEstadisticas();
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      });
  }

  // --- NUEVA LÓGICA PARA VENDER JUGADORES ---
  venderJugador(jugador: Jugador) {
    const inputPrecio = prompt(`Vas a poner en venta a ${jugador.nombre}.\n\nValor Base: ${this.formatearDinero(jugador.precio)} Tc.\n\nIntroduce el precio de venta deseado:`, jugador.precio.toString());

    if (inputPrecio !== null) {
      // Limpiamos los puntos por si el usuario escribe "10.000.000"
      const precioFinal = Number(inputPrecio.replace(/[^0-9]/g, '')); 
      
      if (isNaN(precioFinal) || precioFinal <= 0) {
        alert('Precio no válido. Introduce solo números.');
        return;
      }

      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
      const body = { 
        id_futbolista: jugador.id_futbolista, 
        precio_venta: precioFinal 
      };

      this.http.post(`${this.apiBase}/api/ligas/${this.id_liga}/vender`, body, { headers })
        .subscribe({
          next: () => {
            alert(`¡${jugador.nombre} ha sido puesto en el mercado por ${this.formatearDinero(precioFinal)} Tc!`);
            this.cargarMisJugadores(); // Recargamos para que aparezca la etiqueta de "EN VENTA"
          },
          error: (err) => alert('Error al poner en venta el jugador.')
        });
    }
  }

  calcularEstadisticas() {
    this.totalJugadores = this.misJugadores.length;
    this.valorPlantilla = this.misJugadores.reduce((acc, j) => acc + Number(j.precio), 0);
    
    if (this.totalJugadores > 0) {
      const sumaMedia = this.misJugadores.reduce((acc, j) => acc + j.media, 0);
      this.mediaPlantilla = Math.round(sumaMedia / this.totalJugadores);
    }
  }

  // MAPEO EXACTO BASADO EN TUS IMÁGENES
  obtenerRutaEscudo(nombreEquipo: string): string {
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

  getMediaClass(media: number): string {
    if (media >= 90) return 'media-elite';
    if (media >= 80) return 'media-gold';
    if (media >= 75) return 'media-silver';
    return 'media-bronze';
  }

  normalizarPosicion(pos: string): 'DL' | 'MC' | 'DF' | 'PT' {
    const p = pos.toLowerCase();
    if (p.includes('del')) return 'DL';
    if (p.includes('med') || p.includes('cen')) return 'MC';
    if (p.includes('def')) return 'DF';
    if (p.includes('por') || p.includes('pt')) return 'PT';
    return 'MC';
  }

  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES').format(valor);
  }

  volverAtras() {
    this.router.navigate(['/ligas', this.id_liga, 'menu']);
  }
}