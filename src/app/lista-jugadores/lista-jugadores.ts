import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { FormsModule } from '@angular/forms'; 
import { Jugador } from '../models/Jugador';

@Component({
  selector: 'app-lista-jugadores',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  mostrarModalVenta: boolean = false;
  jugadorAVender: Jugador | null = null;
  precioVentaInput: number = 0;
  
  notificationMsg = '';
  isSuccess = false;

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

  abrirModalVender(jugador: Jugador) {
    this.jugadorAVender = jugador;
    this.precioVentaInput = jugador.precio;
    this.mostrarModalVenta = true;
  }

  cerrarModalVenta() {
    this.mostrarModalVenta = false;
    this.jugadorAVender = null;
    this.precioVentaInput = 0;
  }

  confirmarVenta() {
    if (!this.jugadorAVender) return;
    
    if (this.precioVentaInput === null || isNaN(this.precioVentaInput) || this.precioVentaInput <= 0) {
      this.mostrarNotificacion('Introduce un precio válido mayor a 0', false);
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const body = { 
      id_futbolista: this.jugadorAVender.id_futbolista, 
      precio_venta: this.precioVentaInput 
    };

    this.http.post(`${this.apiBase}/api/ligas/${this.id_liga}/vender`, body, { headers })
      .subscribe({
        next: () => {
          this.mostrarNotificacion(`¡${this.jugadorAVender!.nombre} puesto en venta!`, true);
          this.cerrarModalVenta();
          this.cargarMisJugadores(); 
        },
        error: (err) => {
          console.error(err);
          this.mostrarNotificacion('Error al poner en venta el jugador.', false);
        }
      });
  }

  cancelarVenta(jugador: Jugador) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const body = { id_futbolista: jugador.id_futbolista };

    this.http.post(`${this.apiBase}/api/ligas/${this.id_liga}/cancelar-venta`, body, { headers })
      .subscribe({
        next: () => {
          this.mostrarNotificacion(`Has cancelado la venta de ${jugador.nombre}`, true);
          this.cargarMisJugadores(); 
        },
        error: (err) => this.mostrarNotificacion('Error al cancelar la venta', false)
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

  irAPerfil() {
    this.router.navigate(['/perfil']);
  }

  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => this.notificationMsg = '', 3000);
  }
}