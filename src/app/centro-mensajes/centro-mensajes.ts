import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-centro-mensajes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './centro-mensajes.html',
  styleUrl: './centro-mensajes.css'
})
export class CentroMensajes implements OnInit {

  user: any = null;
  id_liga!: number;
  dinero: number = 0;
  userRol: string = 'user';

  mostrarModalBorrarBuzon = false;
  mostrarModalBorrarChat = false;

  nuevoMensaje: string = '';
  chatGeneral: any[] = [];
  mensajesPrivados: any[] = [];
  sinLeerCount: number = 0;

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private apiBase = 'https://api-trebol-league.vercel.app';

  ngOnInit() {
    this.id_liga = Number(this.route.snapshot.paramMap.get('idLiga'));
    const token = localStorage.getItem('token');
    if (token) {
      try { this.user = jwtDecode(token); } catch {}
    }
    
    // cargamos todo
    this.cargarDatosUsuario();
    this.cargarChatGeneral();
    this.cargarBuzonPrivado();
  }

  // metodo helper para no repetir los headers
  private getHeaders() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
  }

  cargarDatosUsuario() {
    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/datos-usuario`, this.getHeaders())
      .subscribe({
        next: (data) => {
          this.dinero = Number(data.dinero);
          this.userRol = data.rol;
        },
        error: (err) => console.error(err)
      });
  }

  // logica
  cargarChatGeneral() {
    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/chat`, this.getHeaders())
      .subscribe({
        next: (data) => {
          // mapeamos los datos para que el HTML los entienda como antes
          this.chatGeneral = data.map(msg => ({
            remitente: msg.remitente,
            texto: msg.texto,
            mio: msg.id_remitente === this.user.id,
            hora: new Date(msg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          this.hacerScrollAbajo();
        },
        error: (err) => console.error('Error al cargar el chat:', err)
      });
  }

  enviarMensajeGeneral() {
    if (!this.nuevoMensaje.trim()) return;
    
    const body = { texto: this.nuevoMensaje };
    
    this.http.post(`${this.apiBase}/api/ligas/${this.id_liga}/chat`, body, this.getHeaders())
      .subscribe({
        next: () => {
          this.nuevoMensaje = '';
          this.cargarChatGeneral();
        },
        error: (err) => console.error('Error al enviar mensaje:', err)
      });
  }

  // logica chat privado - tengo q terminar
  cargarBuzonPrivado() {
    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/privados`, this.getHeaders())
      .subscribe({
        next: (data) => {
          this.mensajesPrivados = data.map(msg => ({
            ...msg,
            fecha: new Date(msg.fecha).toLocaleDateString()
          }));
          this.sinLeerCount = this.mensajesPrivados.filter(m => !m.leido).length;
        },
        error: (err) => console.error('Error al cargar los mensajes privados:', err)
      });
  }

  hacerScrollAbajo() {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES').format(valor);
  }

  volverAtras() {
    this.router.navigate(['/ligas', this.id_liga, 'menu']);
  }

  // leer mensajes
  mensajeSeleccionado: any = null;
  mostrarModalLeer = false;
  
  mostrarModalRespuesta = false;
  respuestaInput: string = '';

  notificationMsg = '';
  isSuccess = false;

  // abrir un mensaje del buzon
  abrirMensaje(msg: any) {
    this.mensajeSeleccionado = msg;
    this.mostrarModalLeer = true;

    // si no esta leido avisamos a la base de datos
    if (!msg.leido) {
      msg.leido = true;
      this.sinLeerCount = Math.max(0, this.sinLeerCount - 1);
      this.http.put(`${this.apiBase}/api/ligas/${this.id_liga}/mensajes/${msg.id_privado}/leer`, {}, this.getHeaders())
        .subscribe();
    }
  }

  cerrarMensajes() {
    this.mostrarModalLeer = false;
    this.mostrarModalRespuesta = false;
    this.mensajeSeleccionado = null;
    this.respuestaInput = '';
  }

  // aceptar oferta
  aceptarOferta() {
    if (!this.mensajeSeleccionado || !this.mensajeSeleccionado.id_oferta) return;

    const body = { 
      id_oferta: this.mensajeSeleccionado.id_oferta, 
      id_mensaje: this.mensajeSeleccionado.id_privado 
    };

    this.http.post(`${this.apiBase}/api/ligas/${this.id_liga}/ofertas/aceptar`, body, this.getHeaders())
      .subscribe({
        next: (res: any) => {
          this.mostrarNotificacion(res.message, true);
          this.cerrarMensajes();
          this.cargarDatosUsuario();
          this.cargarBuzonPrivado();
        },
        error: (err) => this.mostrarNotificacion(err.error?.message || 'Error al aceptar', false)
      });
  }

  abrirContraoferta() {
    this.mostrarModalLeer = false;
    this.mostrarModalRespuesta = true;
  }

  enviarRechazoOContraoferta() {
    const body = { 
      id_oferta: this.mensajeSeleccionado.id_oferta, 
      id_mensaje: this.mensajeSeleccionado.id_privado,
      motivo: this.respuestaInput // si escribe algo, es una contraoferta. Si no, es un rechazo normal.
    };

    this.http.post(`${this.apiBase}/api/ligas/${this.id_liga}/ofertas/rechazar`, body, this.getHeaders())
      .subscribe({
        next: () => {
          this.mostrarNotificacion('Has rechazado la oferta y respondido al mánager.', true);
          this.cerrarMensajes();
          this.cargarBuzonPrivado();
        },
        error: () => this.mostrarNotificacion('Error al procesar', false)
      });
  }

  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => this.notificationMsg = '', 3500);
  }

  abrirModalBorrarBuzon() { this.mostrarModalBorrarBuzon = true; }
  cerrarModalBorrarBuzon() { this.mostrarModalBorrarBuzon = false; }

  confirmarBorrarBuzon() {
    this.http.delete(`${this.apiBase}/api/ligas/${this.id_liga}/privados`, this.getHeaders())
      .subscribe({
        next: () => {
          this.mensajesPrivados = [];
          this.sinLeerCount = 0;
          this.mostrarNotificacion('Buzón vaciado correctamente', true);
          this.cerrarModalBorrarBuzon();
        },
        error: () => {
          this.mostrarNotificacion('Error al vaciar buzón', false);
          this.cerrarModalBorrarBuzon();
        }
      });
  }

  abrirModalBorrarChat() { this.mostrarModalBorrarChat = true; }
  cerrarModalBorrarChat() { this.mostrarModalBorrarChat = false; }

  confirmarBorrarChat() {
    this.http.delete(`${this.apiBase}/api/ligas/${this.id_liga}/chat`, this.getHeaders())
      .subscribe({
        next: () => {
          this.chatGeneral = [];
          this.mostrarNotificacion('Chat general eliminado', true);
          this.cerrarModalBorrarChat();
        },
        error: () => {
          this.mostrarNotificacion('Error al vaciar chat', false);
          this.cerrarModalBorrarChat();
        }
      });
  }

}