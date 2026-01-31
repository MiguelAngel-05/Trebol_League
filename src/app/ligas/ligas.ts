import { Component, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from "@angular/forms";

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
   nombreNuevaLiga: string = '';
   activeMenuIndex: number | null = null;

   // Toasts
   notificationMsg = '';
   isSuccess = false;

   ligas = [
     { nombre: 'Treboliners', miembros: '8/10', pts: 80, valor: 100000000, img: 'Utensilios/Emojis/escudo-ejemplo.svg' },
     { nombre: 'La Liga Pro', miembros: '4/10', pts: 62, valor: 10000000, img: 'Utensilios/Emojis/escudo-ejemplo.svg' },
     { nombre: 'Amigos FC', miembros: '9/10', pts: 45, valor: 5000000, img: 'Utensilios/Emojis/escudo-ejemplo.svg' },
     { nombre: 'Torneo Verano', miembros: '2/10', pts: 10, valor: 1200000, img: 'Utensilios/Emojis/escudo-ejemplo.svg' },
     { nombre: 'Champions T.', miembros: '10/10', pts: 120, valor: 300000000, img: 'Utensilios/Emojis/escudo-ejemplo.svg' },
     { nombre: 'Novatos', miembros: '1/10', pts: 0, valor: 1000000, img: 'Utensilios/Emojis/escudo-ejemplo.svg' }
   ];

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
     if (this.nombreNuevaLiga.trim().length > 0) {
       this.ligas.push({
         nombre: this.nombreNuevaLiga,
         miembros: '1/10',
         pts: 0,
         valor: 0,
         img: 'Utensilios/Emojis/escudo-ejemplo.svg'
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