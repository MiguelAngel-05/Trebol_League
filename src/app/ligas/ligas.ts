import { Component, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from "@angular/forms";
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Modelo actualizado de Liga
export interface Liga {
  id_liga: number;
  nombre: string;
  numero_jugadores: number;
  clave: string;
  dinero?: number;
  puntos?: number;
  rol?: string;
}

@Component({
  selector: 'app-ligas',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ligas.html',
  styleUrls: ['./ligas.css'],
})
export class Ligas {
  user: any = null;
  private router = inject(Router);
  private http = inject(HttpClient);

  mostrarModal: boolean = false;
  activeMenuIndex: number | null = null;

  ligas: Liga[] = [];

  nombreNuevaLiga: string = '';
  claveNuevaLiga: string = '';
  maxUsuariosNuevaLiga: number = 0;

  // Toasts
  notificationMsg = '';
  isSuccess = false;

  // URL base de tu API
  private apiBase = 'https://vercel.com/miguelangels-projects-65daee7d/api-trebol-league'; // ⚡ cambia por tu URL real si es Vercel

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        this.user = jwtDecode(token);
        this.cargarMisLigas();
      } catch(e) { console.error('Error decodificando token', e); }
    }
  }

  // --- HTTP API METHODS ---
  private getAuthHeaders() {
    const token = localStorage.getItem('token') || '';
    return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
  }

  cargarMisLigas() {
    this.http.get<Liga[]>(`${this.apiBase}/mis-ligas`, this.getAuthHeaders())
      .subscribe({
        next: (data) => this.ligas = data,
        error: (err) => this.mostrarNotificacion('Error cargando ligas', false)
      });
  }

  crearLiga() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.nombreNuevaLiga = '';
    this.claveNuevaLiga = '';
    this.maxUsuariosNuevaLiga = 0;
  }

  confirmarCreacion() {
    if (this.maxUsuariosNuevaLiga < 1 || this.maxUsuariosNuevaLiga > 10) {
      this.mostrarNotificacion('El número máximo de usuarios debe estar entre 1 y 10', false);
      return;
    }
    if (!this.nombreNuevaLiga.trim() || !this.claveNuevaLiga.trim()) {
      this.mostrarNotificacion('Nombre y clave no pueden estar vacíos', false);
      return;
    }

    const body = {
      nombre: this.nombreNuevaLiga,
      clave: this.claveNuevaLiga,
      max_jugadores: this.maxUsuariosNuevaLiga
    };

    this.http.post<any>(`${this.apiBase}/ligas`, body, this.getAuthHeaders())
      .subscribe({
        next: (res) => {
          this.mostrarNotificacion(`Liga "${this.nombreNuevaLiga}" creada con éxito`, true);
          this.cargarMisLigas();
          this.cerrarModal();
        },
        error: (err) => {
          console.error(err);
          this.mostrarNotificacion(err.error?.message || 'Error creando liga', false);
        }
      });
  }

  unirseLiga(id_liga: number, clave: string) {
    const body = { clave };
    this.http.post<any>(`${this.apiBase}/ligas/${id_liga}/join`, body, this.getAuthHeaders())
      .subscribe({
        next: (res) => {
          this.mostrarNotificacion('Te has unido a la liga', true);
          this.cargarMisLigas();
        },
        error: (err) => {
          console.error(err);
          this.mostrarNotificacion(err.error?.message || 'Error al unirse a la liga', false);
        }
      });
  }

  irALiga(nombreLiga: string, id_liga: number) {
    this.mostrarNotificacion(`Entrando a ${nombreLiga}...`, true);
    setTimeout(() => {
      this.router.navigate(['/ligas', id_liga, 'menu']); // Ajusta a tu ruta real
    }, 800);
  }

  toggleMenu(index: number, event: Event) {
    event.stopPropagation();
    this.activeMenuIndex = this.activeMenuIndex === index ? null : index;
  }

  salirDeLiga(index: number, event: Event) {
    event.stopPropagation();
    const liga = this.ligas[index];

    this.http.delete(`${this.apiBase}/ligas/${liga.id_liga}`, this.getAuthHeaders())
      .subscribe({
        next: () => {
          this.ligas.splice(index, 1);
          this.activeMenuIndex = null;
          this.mostrarNotificacion(`Has salido de ${liga.nombre}`, true);
        },
        error: (err) => {
          console.error(err);
          this.mostrarNotificacion('Error al salir de la liga', false);
        }
      });
  }

  @HostListener('document:click', ['$event'])
  clickFuera(event: Event) {
    this.activeMenuIndex = null;
  }

  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => this.notificationMsg = '', 3000);
  }
}
