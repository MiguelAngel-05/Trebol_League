import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Importa HttpClient

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {

  user: any = null;
  id_liga!: number;
  dinero: number = 0;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  notificationMsg = '';
  isSuccess = false;
  
  // Url api
  private apiBase = 'https://api-trebol-league.vercel.app';

  ngOnInit() {
    this.id_liga = Number(this.route.snapshot.paramMap.get('idLiga'));

    const token = localStorage.getItem('token');
    if (token) {
      try {
        this.user = jwtDecode(token);
        this.cargarDatosUsuarioLiga();
      } catch (error) {
        console.error('Error decodificando token', error);
      }
    }
  }

  cargarDatosUsuarioLiga() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/datos-usuario`, { headers })
      .subscribe({
        next: (data) => {
          this.dinero = Number(data.dinero);
        },
        error: (err) => console.error('Error cargando dinero', err)
      });
  }

  // Navegación
  volverAtras() {
    this.router.navigate(['/ligas']);
  }

  irAMercado() {
    this.mostrarNotificacion('Entrando al Mercado...', true);
    setTimeout(() => {
        this.router.navigate(['/ligas', this.id_liga, 'mercado']);
    }, 500);
  }

  irAListaJugadores() {
    this.mostrarNotificacion('Cargando base de datos...', true);
    setTimeout(() => {
      this.router.navigate(['/ligas', this.id_liga, 'jugadores']);
    }, 500);
  }

  // Funciones para botones "Work in Progress"
  irACalendario() {
    this.mostrarNotificacion('Calendario: Próximamente', false);
  }

  irAClasificacion() {
    this.mostrarNotificacion('Clasificación no disponible aún', false);
  }

  irATienda() {
    this.mostrarNotificacion('La tienda está cerrada por hoy', false);
  }

  verInfo() {
    this.mostrarNotificacion('Versión Beta 1.0 - Trebol League', true);
  }

  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => {
      this.notificationMsg = '';
    }, 3000);
  }
}