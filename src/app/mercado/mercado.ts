import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';

interface Jugador {
  nombre: string;
  posicion: 'DL' | 'MC' | 'DF' | 'PT';
  puntos: number;
  valor: number;
  equipo?: string;
}

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

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Variables UI
  filtroActivo: string = 'TODOS';
  isLoading = false;
  
  // Variables Toast
  notificationMsg = '';
  isSuccess = false;

  // Datos de prueba
  allJugadores: Jugador[] = [
    { nombre: 'Vinicius Jr', posicion: 'DL', puntos: 32, valor: 26000400 },
    { nombre: 'Haaland', posicion: 'DL', puntos: 32, valor: 26000400 },
    { nombre: 'Bellingham', posicion: 'MC', puntos: 32, valor: 26000400 },
    { nombre: 'Rodri', posicion: 'MC', puntos: 28, valor: 18000000 },
    { nombre: 'Van Dijk', posicion: 'DF', puntos: 32, valor: 26000400 },
    { nombre: 'Rüdiger', posicion: 'DF', puntos: 15, valor: 12000000 },
    { nombre: 'Courtois', posicion: 'PT', puntos: 32, valor: 26000400 },
    { nombre: 'Mbappe', posicion: 'DL', puntos: 32, valor: 26000400 },
  ];

  // Jugadores que se muestran (filtrados)
  jugadoresMostrados: Jugador[] = [];

  ngOnInit() {
    this.id_liga = Number(this.route.snapshot.paramMap.get('id'));
    const token = localStorage.getItem('token');
    if (token) {
        try {
            this.user = jwtDecode(token);
        } catch (e) { console.error(e); }
    }
    this.jugadoresMostrados = [...this.allJugadores];
  }

  // Filtrado
  filtrarPor(posicion: string) {
    this.filtroActivo = posicion;
    
    this.jugadoresMostrados = []; 
    setTimeout(() => {
        if (posicion === 'TODOS') {
            this.jugadoresMostrados = [...this.allJugadores];
        } else {
            this.jugadoresMostrados = this.allJugadores.filter(j => j.posicion === posicion);
        }
    }, 50);
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