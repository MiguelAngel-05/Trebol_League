import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { Jugador } from '../models/Jugador';
import { FormsModule } from '@angular/forms';
import { CartaComponent } from '../carta/carta';
import { obtenerInfoHabilidad } from '../models/Habilidades';

@Component({
  selector: 'app-plantilla-rival',
  standalone: true,
  imports: [CommonModule, FormsModule, CartaComponent],
  templateUrl: './plantilla-rival.html',
  styleUrl: './plantilla-rival.css'
})
export class PlantillaRival implements OnInit {

  user: any = null;
  id_liga!: number;
  id_rival!: number;
  dinero: number = 0;

  jugadoresRival: Jugador[] = [];
  isLoading = true;

  valorPlantilla: number = 0;
  mediaPlantilla: number = 0;
  totalJugadores: number = 0;

  notificationMsg = '';
  isSuccess = false;

  nombreRival: string = 'Cargando...';
  avatarRival: string = '';

  mostrarModalOferta = false;
  mostrarModalDetalle: boolean = false;
  mostrarModalHabilidad: boolean = false;
  jugadorSeleccionado: any = null;
  jugadorOfertado: Jugador | null = null;
  montoOfertaInput: number = 0;

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // api url
  private apiBase = 'https://api-trebol-league.vercel.app';

  ngOnInit() {
    this.id_liga = Number(this.route.snapshot.paramMap.get('idLiga'));
    // ID del rival
    this.id_rival = Number(this.route.snapshot.paramMap.get('idUsuario'));
    const token = localStorage.getItem('token');

    if (token) {
      try { this.user = jwtDecode(token); } catch {}
    }
    // para mostrar tu dinero en el header
    this.cargarDatosMios();
    this.cargarJugadoresRival();
  }

  cargarDatosMios() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/datos-usuario`, { headers })
      .subscribe({
        next: (data) => this.dinero = Number(data.dinero),
        error: (err) => console.error(err)
      });
  }

  cargarJugadoresRival() {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/jugadores-rival/${this.id_rival}`, { headers })
      .subscribe({
        next: (data) => {
          this.nombreRival = data.rival?.username || 'Mánager Desconocido';
          this.avatarRival = data.rival?.avatar || '';

          this.jugadoresRival = data.jugadores.map((j: any) => ({
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

  hacerOferta(jugador: Jugador) {
    this.mostrarNotificacion(`Próximamente: Sistema de ofertas por ${jugador.nombre}`, false);
  }

  calcularEstadisticas() {
    this.totalJugadores = this.jugadoresRival.length;
    this.valorPlantilla = this.jugadoresRival.reduce((acc, j) => acc + Number(j.precio), 0);
    
    if (this.totalJugadores > 0) {
      const sumaMedia = this.jugadoresRival.reduce((acc, j) => acc + j.media, 0);
      this.mediaPlantilla = Math.round(sumaMedia / this.totalJugadores);
    }
  }

  obtenerRutaEscudo(nombreEquipo: string): string {
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
    return archivo ? `Utensilios/Escudos/${archivo}` : 'Utensilios/Escudos/escudo_default.webp';
  }

  abrirDetalle(jugador: Jugador, event: Event) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('btn-oferta')) return;

    this.jugadorSeleccionado = jugador;
    this.mostrarModalDetalle = true;
  }

  cerrarModales() {
    this.mostrarModalDetalle = false;
    this.mostrarModalHabilidad = false;
    this.jugadorSeleccionado = null;
  }

  abrirHabilidad() {
    this.mostrarModalHabilidad = true;
  }

  cerrarHabilidad() {
    this.mostrarModalHabilidad = false;
  }

  getInfoHabilidad(codigo: string) {
    return obtenerInfoHabilidad(codigo);
  }

  getMediaClass(media: number): string {
    if (media >= 95) return 'media-galaxy';
    if (media >= 90) return 'media-diamond';
    if (media >= 80) return 'media-gold';
    if (media >= 70) return 'media-silver';
    return 'media-bronze';
  }

  normalizarPosicion(pos: string): 'DL' | 'MC' | 'DF' | 'PT' {
    if (!pos) return 'MC';
    const p = pos.trim().toUpperCase();
    if (p === 'DL' || p.includes('DEL')) return 'DL';
    if (p === 'DF' || p.includes('DEF')) return 'DF';
    if (p === 'PT' || p.includes('POR')) return 'PT';
    return 'MC'; 
  }

  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES').format(valor);
  }

  volverAtras() {
    this.router.navigate(['/ligas', this.id_liga, 'clasificacion']);
  }

  irAPerfil() {
    this.router.navigate(['/perfil']);
  }

  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => this.notificationMsg = '', 3000);
  }


  abrirModalOferta(jugador: Jugador) {
    this.jugadorOfertado = jugador;
    this.montoOfertaInput = Number(jugador.precio);
    this.mostrarModalOferta = true;
  }

  cerrarModalOferta() {
    this.mostrarModalOferta = false;
    this.jugadorOfertado = null;
    this.montoOfertaInput = 0;
  }

  enviarOfertaFormal() {
    if (this.montoOfertaInput <= 0) return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const body = {
      id_destinatario: this.id_rival,
      id_futbolista: this.jugadorOfertado!.id_futbolista,
      monto: this.montoOfertaInput
    };

    this.http.post(`${this.apiBase}/api/ligas/${this.id_liga}/ofertas`, body, { headers })
      .subscribe({
        next: () => {
          this.mostrarNotificacion(`¡Oferta de ${this.formatearDinero(this.montoOfertaInput)} Tc enviada por ${this.jugadorOfertado!.nombre}!`, true);
          this.cerrarModalOferta();
        },
        error: (err) => this.mostrarNotificacion('Error al enviar la oferta.', false)
      });
  }

}