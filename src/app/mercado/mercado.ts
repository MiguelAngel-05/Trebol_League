import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 
import { Jugador } from '../models/Jugador';
import { obtenerInfoHabilidad } from '../models/Habilidades'; // <--- IMPORTANTE

@Component({
  selector: 'app-mercado',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './mercado.html',
  styleUrl: './mercado.css',
})
export class Mercado implements OnInit, OnDestroy {

  user: any = null;
  id_liga!: number;
  dinero: number = 0;
  saldoFuturo: number = 0;

  jugadores: Jugador[] = [];
  jugadoresMostrados: Jugador[] = [];
  historial: any[] = [];

  // variables para puja y modales
  mostrarModalPuja: boolean = false;
  mostrarModalCompraDirecta: boolean = false;
  mostrarModalHabilidad: boolean = false; // <--- NUEVO
  jugadorSeleccionado: Jugador | null = null;
  ofertaPuja: number = 0;

  filtroActivo: 'TODOS' | 'DL' | 'MC' | 'DF' | 'PT' = 'TODOS';
  
  isAnimatingFilter: boolean = false; 
  
  isLoading = false;

  tiempoRestante = '00:00:00';
  private timerInterval: any;

  notificationMsg = '';
  isSuccess = false;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  private apiBase = 'https://api-trebol-league.vercel.app';

  ngOnInit() {
    this.id_liga = Number(this.route.snapshot.paramMap.get('idLiga'));
    const token = localStorage.getItem('token');
    if (token) {
      try { this.user = jwtDecode(token); } catch {}
    }
    this.cargarDatosUsuarioLiga();
    this.cargarMercado();
    this.cargarHistorial();
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }

  // --- HABILIDADES ---
  abrirHabilidad() { this.mostrarModalHabilidad = true; }
  cerrarHabilidad() { this.mostrarModalHabilidad = false; }
  getInfoHabilidad(codigo: string | undefined) {
    if (!codigo) return null;
    return obtenerInfoHabilidad(codigo);
  }
  cargarDatosUsuarioLiga() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    
    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/datos-usuario`, { headers })
      .subscribe({
        next: (data) => {
          this.dinero = Number(data.dinero);
          const pujado = Number(data.total_pujado);
          const ventas = Number(data.total_ventas_esperadas);
          this.saldoFuturo = this.dinero - pujado + ventas;
        },
        error: (err) => console.error('Error cargando dinero', err)
      });
  }

  cargarMercado() {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any>(`${this.apiBase}/api/mercado/${this.id_liga}`, { headers })
      .subscribe({
        next: (response) => {
          this.jugadores = response.jugadores.map((j: any) => ({
            ...j,
            posicion: this.normalizarPosicion(j.posicion)
          }));
          this.jugadoresMostrados = [...this.jugadores];
          if (response.fecha_generacion) {
             this.iniciarTemporizador(response.fecha_generacion);
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.mostrarNotificacion('Error al cargar el mercado', false);
        }
      });
  }

  cargarHistorial() {
    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/historial`, this.getAuthHeaders())
      .subscribe({
        next: (data) => { this.historial = data; },
        error: (err) => { console.error('Error al cargar el historial', err); }
      });
  }

  filtrarPor(posicion: 'TODOS' | 'DL' | 'MC' | 'DF' | 'PT') {
    if (this.filtroActivo === posicion) return; 
    this.isAnimatingFilter = true;
    this.filtroActivo = posicion; 

    setTimeout(() => {
      this.jugadoresMostrados = posicion === 'TODOS' 
        ? [...this.jugadores] 
        : this.jugadores.filter(j => j.posicion === posicion);
      
      setTimeout(() => { this.isAnimatingFilter = false; }, 50);
    }, 300);
  }

  gestionarClicJugador(jugador: Jugador) {
    if (jugador.id_vendedor === this.user.id) {
      this.mostrarNotificacion('Este jugador es tuyo. Ve a tu plantilla si quieres cancelar su venta.', false);
      return;
    }

    this.jugadorSeleccionado = jugador;
    
    if (jugador.id_vendedor) {
      this.mostrarModalCompraDirecta = true;
    } else {
      this.ofertaPuja = jugador.pujado_por_mi && jugador.mi_puja_actual 
        ? jugador.mi_puja_actual 
        : jugador.precio;
      this.mostrarModalPuja = true;
    }
  }

  cerrarModales() {
    this.mostrarModalPuja = false;
    this.mostrarModalCompraDirecta = false;
    this.mostrarModalHabilidad = false; // <--- Cierra también el de habilidad
    this.jugadorSeleccionado = null;
    this.ofertaPuja = 0;
  }

  confirmarPuja() {
    if (!this.jugadorSeleccionado) return;
    if (this.ofertaPuja < this.jugadorSeleccionado.precio) {
      this.mostrarNotificacion(`La puja mínima es ${this.formatearDinero(this.jugadorSeleccionado.precio)}`, false);
      return;
    }
    if (this.ofertaPuja > this.dinero) {
      this.mostrarNotificacion('No tienes suficiente dinero', false);
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const body = { id_liga: this.id_liga, id_futbolista: this.jugadorSeleccionado.id_futbolista, monto: this.ofertaPuja };

    this.http.post<any>(`${this.apiBase}/api/mercado/pujar`, body, { headers })
      .subscribe({
        next: (res) => {
          this.mostrarNotificacion(res.message, true);
          this.cerrarModales();
          this.cargarMercado();
          this.cargarDatosUsuarioLiga();
        },
        error: (err) => {
          console.error(err);
          this.mostrarNotificacion(err.error?.message || 'Error al pujar', false);
        }
      });
  }

  borrarPuja() {
    if (!this.jugadorSeleccionado) return;
    const options = {
      headers: new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('token')}` }),
      body: { id_liga: this.id_liga, id_futbolista: this.jugadorSeleccionado.id_futbolista }
    };

    this.http.delete(`${this.apiBase}/api/mercado/pujar`, options)
      .subscribe({
        next: (res: any) => {
          this.mostrarNotificacion('Puja retirada', true);
          this.cerrarModales();
          this.cargarMercado(); 
          this.cargarDatosUsuarioLiga(); 
        },
        error: (err) => this.mostrarNotificacion('Error al borrar puja', false)
      });
  }

  confirmarCompraDirecta() {
    if (!this.jugadorSeleccionado) return;
    const body = {
      id_liga: this.id_liga,
      id_futbolista: this.jugadorSeleccionado.id_futbolista,
      id_vendedor: this.jugadorSeleccionado.id_vendedor,
      precio: this.jugadorSeleccionado.precio
    };

    this.http.post(`${this.apiBase}/api/mercado/compra-directa`, body, this.getAuthHeaders())
      .subscribe({
        next: () => {
          this.mostrarNotificacion('¡Fichado!', true);
          this.cargarMercado();
          this.cargarHistorial();
          this.cargarDatosUsuarioLiga();
          this.cerrarModales();
        },
        error: () => this.mostrarNotificacion('Error en la compra', false)
      });
  }

  iniciarTemporizador(fechaGeneracion: string) {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const ahora = new Date();
      const limite = new Date();
      limite.setHours(23, 59, 59, 999);
      const diff = limite.getTime() - ahora.getTime();

      if (diff <= 0) {
        this.tiempoRestante = 'Actualizando...';
        clearInterval(this.timerInterval);
        setTimeout(() => { this.cargarMercado(); this.cargarHistorial(); }, 10000);
        return;
      }
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      this.tiempoRestante = `${this.pad(h)}:${this.pad(m)}:${this.pad(s)}`;
    }, 1000);
  }

  pad(n: number) { return n.toString().padStart(2, '0'); }

  normalizarPosicion(pos: string): 'DL' | 'MC' | 'DF' | 'PT' {
    if (!pos) return 'MC';
    const p = pos.trim().toUpperCase();
    if (p === 'DL' || p.includes('DEL')) return 'DL';
    if (p === 'DF' || p.includes('DEF')) return 'DF';
    if (p === 'PT' || p.includes('POR')) return 'PT';
    return 'MC'; 
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

  getMediaClass(media: number): string {
    if (media >= 95) return 'media-galaxy';
    if (media >= 90) return 'media-diamond';
    if (media >= 80) return 'media-gold';
    if (media >= 70) return 'media-silver';
    return 'media-bronze';
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
  }

  formatearDinero(valor: number): string { return new Intl.NumberFormat('es-ES').format(valor); }
  volverAtras() { this.router.navigate(['/ligas', this.id_liga, 'menu']); }
  irAPerfil() { this.router.navigate(['/perfil']); }
  
  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => this.notificationMsg = '', 3000);
  }
}