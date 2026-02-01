import { Component, inject } from '@angular/core';
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
export class Mercado {
  user: any = null;
  id_liga!: number;
  jugadores: Jugador[] = [];
  jugadoresMostrados: Jugador[] = [];


  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  // URL de tu API en Vercel
  private apiBase = 'https://api-trebol-league.vercel.app';

  // Variables UI
  filtroActivo: string = 'TODOS';
  isLoading = false;
  
  // Variables Toast
  notificationMsg = '';
  isSuccess = false;

  ngOnInit() {
    this.id_liga = Number(this.route.snapshot.paramMap.get('idLiga'));

    const token = localStorage.getItem('token');
    if (token) {
      try {
        this.user = jwtDecode(token);
      } catch (e) {}
    }

    this.cargarMercado();
  }


  // Filtrado
  filtrarPor(posicion: string) {
    this.filtroActivo = posicion;

    if (posicion === 'TODOS') {
      this.jugadoresMostrados = [...this.jugadores];
    } else {
      this.jugadoresMostrados = this.jugadores.filter(
        j => j.posicion === posicion
      );
    }
  }


  cargarMercado() {
    this.isLoading = true;

    this.http.get<Jugador[]>(`${this.apiBase}/api/mercado/${this.id_liga}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    ).subscribe({
      next: (response: Jugador[]) => {
        this.jugadores = response;
        this.jugadoresMostrados = [...this.jugadores];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  // Acciones
  comprarJugador(jugador: Jugador) {
    this.mostrarNotificacion(`Has pujado por ${jugador.nombre}`, true);
  }

  volverAtras() {
    this.router.navigate(['/ligas', this.id_liga, 'menu']); 
  }
  
  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES').format(valor);
  }

  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => {
      this.notificationMsg = '';
    }, 3000);
  }

// Funciones para botones "Work in Progress"
  irATienda() {
    this.mostrarNotificacion('La tienda está cerrada por hoy', false);
  }

  verInfo() {
    this.mostrarNotificacion('Versión Beta 1.0 - Trebol League', true);
  }

}