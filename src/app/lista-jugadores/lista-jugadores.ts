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

  // Cargar Dinero (Para el Header)
  cargarDatosUsuario() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/datos-usuario`, { headers })
      .subscribe({
        next: (data) => this.dinero = Number(data.dinero),
        error: (err) => console.error(err)
      });
  }

  // Cargar Jugadores de la Plantilla
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

  calcularEstadisticas() {
    this.totalJugadores = this.misJugadores.length;
    
    this.valorPlantilla = this.misJugadores.reduce((acc, j) => acc + Number(j.precio), 0);
    
    if (this.totalJugadores > 0) {
      const sumaMedia = this.misJugadores.reduce((acc, j) => acc + j.media, 0);
      this.mediaPlantilla = Math.round(sumaMedia / this.totalJugadores);
    }
  }

  obtenerRutaEscudo(nombreEquipo: string): string {
    const mapeo: { [key: string]: string } = {
      'Real Trébol FC': 'real_trebol.jpg',
      'Atlético Capitalino': 'atletico_capitalino.jpg',
      'Deportivo La Corona': 'deportivo_la_corona.jpg',
      'Racing de Norte': 'racing_de_norte.jpg',
      'Unión de Hierro': 'union_de_hierro.jpg',
      'Ferroviarios del Sur': 'ferroviarios_del_sur.jpg',
      'Mineros de Carbón FC': 'mineros_de_carbon.jpg',
      'Dinamo de la Fábrica': 'dinamo_de_la_fabrica.jpg',
      'Puerto Nuevo Sporting': 'puerto_nuevo_sporting.jpg',
      'Club Náutico Brisamar': 'club_nautico_brisamar.jpg',
      'Marinos de San Telmo': 'marinos_de_san_telmo.jpg',
      'Estuario FC': 'estuario.jpg',
      'Bosque Profundo': 'bosque_profundo.jpg',
      'Juventud Esmeralda': 'juventud_esmeralda.png',
      'Defensores del Valle': 'defensores_del_valle.jpg',
      'Robles de la Sierra': 'robles_de_la_sierra.jpg',
      'Académica de Letras': 'academia_de_letras.jpg',
      'Gimnasia y Esgrima del Solar': 'gimnasia_y_esgrima.jpg',
      'Sociedad Deportiva El Bastión': 'el_bastion.jpg',
      'Fénix Renaciente': 'fenix_renaciente.png'
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
  
  irATienda() { alert('Tienda cerrada'); }
  verInfo() { alert('Beta 1.0'); }
}