import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 
import { Jugador } from '../models/Jugador';

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

  // Variables para el Modal de Puja
  mostrarModalPuja: boolean = false;
  mostrarModalCompraDirecta: boolean = false;
  jugadorSeleccionado: Jugador | null = null;
  ofertaPuja: number = 0;

  filtroActivo: 'TODOS' | 'DL' | 'MC' | 'DF' | 'PT' = 'TODOS';
  
  // === AQUÍ ESTABA EL ERROR: FALTABA ESTA VARIABLE ===
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
        next: (data) => {
          this.historial = data;
        },
        error: (err) => {
          console.error('Error al cargar el historial', err);
        }
      });
  }

  // --- LÓGICA DE FILTRADO CON ANIMACIÓN ---
  filtrarPor(posicion: 'TODOS' | 'DL' | 'MC' | 'DF' | 'PT') {
    if (this.filtroActivo === posicion) return; 

    // 1. Activar animación de salida
    this.isAnimatingFilter = true;
    this.filtroActivo = posicion; 

    // 2. Esperar 300ms (tiempo de la transición CSS)
    setTimeout(() => {
      // 3. Cambiar los datos
      this.jugadoresMostrados = posicion === 'TODOS' 
        ? [...this.jugadores] 
        : this.jugadores.filter(j => j.posicion === posicion);
      
      // 4. Desactivar animación para que entren los nuevos
      setTimeout(() => {
        this.isAnimatingFilter = false;
      }, 50);
    }, 300);
  }

  // --- LÓGICA DEL MODAL DE PUJA ---
  gestionarClicJugador(jugador: Jugador) {
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
    const body = {
      id_liga: this.id_liga,
      id_futbolista: this.jugadorSeleccionado.id_futbolista,
      monto: this.ofertaPuja
    };

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
      body: {
        id_liga: this.id_liga,
        id_futbolista: this.jugadorSeleccionado.id_futbolista
      }
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

  // --- RESTO DE FUNCIONES ---

  iniciarTemporizador(fechaGeneracion: string) {
    clearInterval(this.timerInterval);
    const fechaBase = new Date(fechaGeneracion).getTime();
    this.timerInterval = setInterval(() => {
      const ahora = Date.now();
      const limite = fechaBase + 24 * 60 * 60 * 1000;
      const diff = limite - ahora;
      if (diff <= 0) {
        this.tiempoRestante = '00:00:00';
        clearInterval(this.timerInterval);
        this.cargarMercado();
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
    const p = pos.toLowerCase();
    if (p.includes('del')) return 'DL';
    if (p.includes('med') || p.includes('cen')) return 'MC';
    if (p.includes('def')) return 'DF';
    if (p.includes('por') || p.includes('pt')) return 'PT';
    return 'MC';
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

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES').format(valor);
  }

  volverAtras() { this.router.navigate(['/ligas', this.id_liga, 'menu']); }
  irATienda() { this.mostrarNotificacion('La tienda está cerrada por hoy', false); }
  verInfo() { this.mostrarNotificacion('Versión Beta 1.0 - Trebol League', true); }

  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => this.notificationMsg = '', 3000);
  }
}