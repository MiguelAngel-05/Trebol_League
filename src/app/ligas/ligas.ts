import { Component, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from "@angular/forms";
import { Liga } from '../models/Liga';

@Component({
  selector: 'app-ligas',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ligas.html',
  styleUrl: './ligas.css',
})
export class Ligas {
   user: any = null;
   private router = inject(Router);
   mostrarModal: boolean = false;
   activeMenuIndex: number | null = null;
   ligas: Liga[] = [
     { nombre: 'Treboliners', numero_jugadores: 4, clave: '1234abcd'},
   ]

   nombreNuevaLiga: string = '';
   claveNuevaLiga: string = '';
   maxUsuariosNuevaLiga: number = 0;

   // Toasts
   notificationMsg = '';
   isSuccess = false;

   

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            this.user = jwtDecode(token);
        } catch(e) { console.log(e); }
    }
  }

  volverAtras() {
    this.router.navigate(['/login']);
  }

  irALiga(nombreLiga: string) {
    this.mostrarNotificacion(`Entrando a ${nombreLiga}...`, true);
    setTimeout(() => {
        this.router.navigate(['/TrebolLeague/menu']);
    }, 800);
  }

  crearLiga() {
    this.mostrarModal = true;
  }
  cerrarModal() {
     this.mostrarModal = false;
     this.nombreNuevaLiga = '';
   }
   confirmarCreacion() {
    if (this.maxUsuariosNuevaLiga < 1 || this.maxUsuariosNuevaLiga > 10) {
      this.mostrarNotificacion('El número máximo de usuarios debe ser un número entre 1 y 10', false);
      return;
    }
     if (this.nombreNuevaLiga.trim().length > 0) {
       this.ligas.push({
         nombre: this.nombreNuevaLiga,
         numero_jugadores: this.maxUsuariosNuevaLiga,
         clave: this.claveNuevaLiga
       });
       
       this.mostrarNotificacion(`Liga "${this.nombreNuevaLiga}" creada con éxito`, true);
       this.cerrarModal();
     } else {
       this.mostrarNotificacion('El nombre no puede estar vacío', false);
     }
   }

  unirseLiga() {
    this.mostrarNotificacion('Función "Unirse a Liga" próximamente', false);
  }

  toggleMenu(index: number, event: Event) {
    event.stopPropagation();
    
    if (this.activeMenuIndex === index) {
      this.activeMenuIndex = null;
    } else {
      this.activeMenuIndex = index;
    }
  }

  salirDeLiga(index: number, event: Event) {
    event.stopPropagation();
    const ligaBorrada = this.ligas[index].nombre;
    this.ligas.splice(index, 1);
    this.activeMenuIndex = null;
    this.mostrarNotificacion(`Has salido de ${ligaBorrada}`, true);
  }

  @HostListener('document:click', ['$event'])
  clickFuera(event: Event) {
    this.activeMenuIndex = null;
  }

  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => {
      this.notificationMsg = '';
    }, 3000);
  }
}