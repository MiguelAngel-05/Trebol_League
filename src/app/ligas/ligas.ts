import { Component, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from "@angular/forms";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Liga } from '../models/Liga';


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

  mostrarModal: boolean = false; // Crear liga
  mostrarModalUnirse: boolean = false; // Unirse a liga
  activeMenuIndex: number | null = null;

  ligas: Liga[] = [];

  nombreNuevaLiga: string = '';
  claveNuevaLiga: string = '';
  maxUsuariosNuevaLiga: number = 0;
  id_liga: number = 0;

  NombreLigaUnirse: string = '';
  claveLigaUnirse: string = '';

  notificationMsg = '';
  isSuccess = false;

  // URL de tu API en Vercel
  private apiBase = 'https://api-trebol-league.vercel.app';

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        this.user = jwtDecode(token);
        this.cargarMisLigas();
      } catch(e) {
        console.error('Error decodificando token', e);
      }
    }
  }

  // --- HTTP HELPERS ---
  private getAuthHeaders() {
    const token = localStorage.getItem('token') || '';
    return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
  }

  cargarMisLigas() {
    this.http.get<Liga[]>(`${this.apiBase}/api/mis-ligas`, this.getAuthHeaders())
      .subscribe({
        next: (data) => this.ligas = data,
        error: (err) => this.mostrarNotificacion('Error cargando ligas', false)
      });
  }

  // --- CREAR LIGA ---
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

    this.http.post<any>(`${this.apiBase}/api/ligas`, body, this.getAuthHeaders())
      .subscribe({
        next: () => {
          this.mostrarNotificacion(`Liga "${this.nombreNuevaLiga}" creada con éxito`, true);
          this.cargarMisLigas(); // recarga automática
          this.cerrarModal();
        },
        error: (err) => {
          console.error(err);
          this.mostrarNotificacion(err.error?.message || 'Error creando liga', false);
        }
      });
  }

  // --- UNIRSE A LIGA ---
  cerrarModalUnirse() {
    this.mostrarModalUnirse = false;
    this.NombreLigaUnirse = " ";
    this.claveLigaUnirse = '';
  }

  unirseLiga(nombre: string, clave: string) {
    if (!nombre || !nombre.trim() || !clave || !clave.trim()) {
      this.mostrarNotificacion('Nombre y clave son obligatorios', false);
      return;
    }

    this.http.post<any>(
      `${this.apiBase}/api/ligas/get-id-by-credentials`,
      { nombre, clave },
      this.getAuthHeaders()
    ).subscribe({
      next: (res) => {
        const idLigaEncontrada = res.id_liga;

        const bodyJoin = { clave };
        
        this.http.post<any>(
          `${this.apiBase}/api/ligas/${idLigaEncontrada}/join`, 
          bodyJoin, 
          this.getAuthHeaders()
        ).subscribe({
          next: () => {
            this.mostrarNotificacion('¡Te has unido a la liga correctamente!', true);
            this.cargarMisLigas();
            this.cerrarModalUnirse();
          },
          error: (errJoin) => {
            console.error(errJoin);
            this.mostrarNotificacion(errJoin.error?.message || 'Error al unirse', false);
          }
        });

      },
      error: (errFind) => {
        console.error(errFind);
        if (errFind.status === 404) {
           this.mostrarNotificacion('No existe ninguna liga con ese nombre y clave', false);
        } else {
           this.mostrarNotificacion('Error al buscar la liga', false);
        }
      }
    });
  }

  // --- NAVEGACION ---
  irALiga(id_liga: number, nombreLiga: string) {
    this.mostrarNotificacion(`Entrando a ${nombreLiga}...`, true);
    setTimeout(() => {
      this.router.navigate(['/ligas', id_liga, 'menu']);
      this.router.navigate(['/ligas', id_liga, 'menu']);
    }, 800);
  }

  volverAtras() {
    this.router.navigate(['/login']); 
  }

  // --- MENU Y ELIMINAR ---
  toggleMenu(index: number, event: Event) {
    event.stopPropagation();
    this.activeMenuIndex = this.activeMenuIndex === index ? null : index;
  }

  salirDeLiga(index: number, event: Event) {
    event.stopPropagation();
    const liga = this.ligas[index];

    this.http.delete(`${this.apiBase}/api/ligas/${liga.id_liga}`, this.getAuthHeaders())
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
