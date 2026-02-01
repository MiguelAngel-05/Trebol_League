import { Component, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Jugador } from '../models/Jugador';

@Component({
  selector: 'app-mercado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mercado.html',
  styleUrl: './mercado.css',
})
export class Mercado implements OnDestroy {

  user: any = null;
  id_liga!: number;

  jugadores: Jugador[] = [];
  jugadoresMostrados: Jugador[] = [];

  filtroActivo: 'TODOS' | 'DL' | 'MC' | 'DF' | 'PT' = 'TODOS';
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

    this.cargarMercado();
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }

  // cargo el mercado
  cargarMercado() {
    this.isLoading = true;

    this.http.get<any>(
      `${this.apiBase}/api/mercado/${this.id_liga}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }
    ).subscribe({
      next: (response) => {

        this.jugadores = response.jugadores.map((j: any) => ({
          ...j,
          posicion: this.normalizarPosicion(j.posicion)
        }));

        this.jugadoresMostrados = [...this.jugadores];
        this.iniciarTemporizador(response.fecha_generacion);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.mostrarNotificacion('Error al cargar el mercado', false);
      }
    });
  }

  // temporizador del mercado
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

      this.tiempoRestante =
        `${this.pad(h)}:${this.pad(m)}:${this.pad(s)}`;
    }, 1000);
  }

  pad(n: number) {
    return n.toString().padStart(2, '0');
  }

  // posiciones
  normalizarPosicion(pos: string): 'DL' | 'MC' | 'DF' | 'PT' {
    const p = pos.toLowerCase();
    if (p.includes('del')) return 'DL';
    if (p.includes('med') || p.includes('cen')) return 'MC';
    if (p.includes('def')) return 'DF';
    if (p.includes('por') || p.includes('pt')) return 'PT';
    return 'MC';
  }

  // los filtrosd
  filtrarPor(posicion: 'TODOS' | 'DL' | 'MC' | 'DF' | 'PT') {
    this.filtroActivo = posicion;
    this.jugadoresMostrados =
      posicion === 'TODOS'
        ? [...this.jugadores]
        : this.jugadores.filter(j => j.posicion === posicion);
  }

  // acciones varias
  comprarJugador(jugador: Jugador) {
    this.mostrarNotificacion(`Has pujado por ${jugador.nombre}`, true);
  }

  volverAtras() {
    this.router.navigate(['/ligas', this.id_liga, 'menu']);
  }

  irATienda() {
    this.mostrarNotificacion('La tienda está cerrada por hoy', false);
  }

  verInfo() {
    this.mostrarNotificacion('Versión Beta 1.0 - Trebol League', true);
  }

  // utilidades
  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES').format(valor);
  }

  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => this.notificationMsg = '', 3000);
  }
}
