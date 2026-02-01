import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';

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

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  notificationMsg = '';
  isSuccess = false;

  ngOnInit() {
    this.id_liga = Number(this.route.snapshot.paramMap.get('id'));

    const token = localStorage.getItem('token');
    if (token) {
      try {
        this.user = jwtDecode(token);
      } catch (error) {
        console.error('Error decodificando token', error);
      }
    }
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

  // Lógica del Toast
  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => {
      this.notificationMsg = '';
    }, 3000);
  }
}