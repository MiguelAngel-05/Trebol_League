import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clasificacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clasificacion.html',
  styleUrl: './clasificacion.css',
})
export class Clasificacion implements OnInit {
  user: any = null;
  id_liga!: number;
  dinero: number = 0;
  miRol: string = 'user';
  
  clasificacion: any[] = [];
  isLoading = true;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  mostrarModalUsuario: boolean = false;
  usuarioSeleccionado: any = null;

  mostrarModalMensaje = false;
  destinatarioMensaje: any = null;
  asuntoInput: string = '';
  contenidoInput: string = '';
  notificationMsg = '';
  isSuccess = false;

  // API URL
  private apiBase = 'https://api-trebol-league.vercel.app';

  ngOnInit() {
    this.id_liga = Number(this.route.snapshot.paramMap.get('idLiga'));
    const token = localStorage.getItem('token');

    if (token) {
      try { this.user = jwtDecode(token); } catch {}
    }

    this.cargarDatosUsuario();
    this.cargarClasificacion();
  }

  cargarDatosUsuario() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/datos-usuario`, { headers })
      .subscribe({
        next: (data) => {
          this.dinero = Number(data.dinero);
          this.miRol = data.rol;
        },
        error: (err) => console.error(err)
      });
  }

  cargarClasificacion() {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/clasificacion`, { headers })
      .subscribe({
        next: (data) => {
          this.clasificacion = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      });
  }

  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES').format(valor);
  }

  volverAtras() {
    this.router.navigate(['/ligas', this.id_liga, 'menu']);
  }

  irAPerfil() {
    this.router.navigate(['/perfil']);
  }

  abrirModalOpciones(jugador: any) {
    if (jugador.id === this.user?.id) {
      return;
    }
    this.usuarioSeleccionado = jugador;
    this.mostrarModalUsuario = true;
  }

  cerrarModal() {
    this.mostrarModalUsuario = false;
    this.usuarioSeleccionado = null;
  }

  mandarMensaje() {
    // 1. Guardamos el usuario seleccionado como destinatario del mensaje
    this.destinatarioMensaje = this.usuarioSeleccionado;
    // 2. Cerramos el primer modal (el de opciones)
    this.cerrarModal();
    // 3. Abrimos el segundo modal (el del correo)
    this.mostrarModalMensaje = true;
  }

  verPlantillaRival() {
    this.router.navigate(['/ligas', this.id_liga, 'plantilla-rival', this.usuarioSeleccionado.id]);
    this.cerrarModal();
  }

  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => this.notificationMsg = '', 3000);
  }

  abrirModalMensaje(manager: any) {
    if (manager.id_usuario === this.user.id) {
      this.mostrarNotificacion('No puedes enviarte un mensaje a ti mismo.', false);
      return;
    }
    this.destinatarioMensaje = manager;
    this.mostrarModalMensaje = true;
  }

  cerrarModalMensaje() {
    this.mostrarModalMensaje = false;
    this.destinatarioMensaje = null;
    this.asuntoInput = '';
    this.contenidoInput = '';
  }

  enviarMensajePrivado() {
    if (!this.asuntoInput || !this.contenidoInput) {
      this.mostrarNotificacion('El asunto y el contenido son obligatorios.', false);
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    
    // CAMBIO: usamos this.destinatarioMensaje.id 
    const body = {
      id_destinatario: this.destinatarioMensaje.id, 
      asunto: this.asuntoInput,
      contenido: this.contenidoInput
    };

    this.http.post(`${this.apiBase}/api/ligas/${this.id_liga}/mensajes-texto`, body, { headers })
      .subscribe({
        next: () => {
          // CAMBIO: usamos this.destinatarioMensaje.username
          this.mostrarNotificacion(`Mensaje enviado a ${this.destinatarioMensaje.username}`, true);
          this.cerrarModalMensaje();
        },
        error: (err) => this.mostrarNotificacion('Error al enviar el mensaje.', false)
      });
  }

  toggleAdmin() {
    if (!this.usuarioSeleccionado) return;
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.put(`${this.apiBase}/api/ligas/${this.id_liga}/toggle-admin/${this.usuarioSeleccionado.id}`, {}, { headers })
      .subscribe({
        next: (res: any) => {
          this.mostrarNotificacion(res.message, true);
          this.cerrarModal();
          this.cargarClasificacion(); // Recargar la tabla para ver la insignia de admin
        },
        error: (err) => this.mostrarNotificacion(err.error?.message || 'Error al cambiar rol', false)
      });
  }

}