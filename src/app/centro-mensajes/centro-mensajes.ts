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

  // Variables reales vacías
  nuevoMensaje: string = '';
  chatGeneral: any[] = [];
  mensajesPrivados: any[] = [];
  sinLeerCount: number = 0;

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // IMPORTANTE: Asegúrate de que esta URL sea la de tu API real en Vercel
  private apiBase = 'https://api-trebol-league.vercel.app';

  ngOnInit() {
    this.id_liga = Number(this.route.snapshot.paramMap.get('idLiga'));
    const token = localStorage.getItem('token');
    if (token) {
      try { this.user = jwtDecode(token); } catch {}
    }
    
    // Al entrar, cargamos todo de la base de datos
    this.cargarDatosUsuario();
    this.cargarChatGeneral();
    this.cargarBuzonPrivado();
  }

  // Método helper para no repetir los headers
  private getHeaders() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
  }

  cargarDatosUsuario() {
    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/datos-usuario`, this.getHeaders())
      .subscribe({
        next: (data) => this.dinero = Number(data.dinero),
        error: (err) => console.error(err)
      });
  }

  // --- LÓGICA DEL CHAT GENERAL (WhatsApp) ---
  cargarChatGeneral() {
    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/chat`, this.getHeaders())
      .subscribe({
        next: (data) => {
          // Mapeamos los datos para que el HTML los entienda como antes
          this.chatGeneral = data.map(msg => ({
            remitente: msg.remitente,
            texto: msg.texto,
            mio: msg.id_remitente === this.user.id, // Si el ID coincide, es mío
            hora: new Date(msg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          this.hacerScrollAbajo(); // Bajamos el scroll automático
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
          this.nuevoMensaje = ''; // Limpiamos el input
          this.cargarChatGeneral(); // Volvemos a pedir los mensajes para ver el nuestro
        },
        error: (err) => console.error('Error al enviar mensaje:', err)
      });
  }

  // --- LÓGICA DEL BUZÓN PRIVADO (Gmail) ---
  cargarBuzonPrivado() {
    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/privados`, this.getHeaders())
      .subscribe({
        next: (data) => {
          this.mensajesPrivados = data.map(msg => ({
            ...msg,
            // Formateamos la fecha para que quede bonita (ej: 01/03/2026)
            fecha: new Date(msg.fecha).toLocaleDateString()
          }));
          // Contamos cuántos están sin leer
          this.sinLeerCount = this.mensajesPrivados.filter(m => !m.leido).length;
        },
        error: (err) => console.error('Error al cargar los mensajes privados:', err)
      });
  }

  // Un detalle pro: al cargar el chat, bajamos la barra de scroll abajo del todo
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

  // --- VARIABLES PARA LEER MENSAJES Y OFERTAS ---
  mensajeSeleccionado: any = null;
  mostrarModalLeer = false;
  
  mostrarModalRespuesta = false;
  respuestaInput: string = '';

  notificationMsg = '';
  isSuccess = false;

  // 1. Abrir un mensaje del buzón
  abrirMensaje(msg: any) {
    this.mensajeSeleccionado = msg;
    this.mostrarModalLeer = true;

    // Si no está leído, avisamos a la base de datos
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

  // 2. ACEPTAR OFERTA (¡La magia de los billetes!)
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
          this.cargarDatosUsuario(); // Recargamos para ver nuestro nuevo dinerito
          this.cargarBuzonPrivado(); // Recargamos para que el mensaje salga como "Aceptado"
        },
        error: (err) => this.mostrarNotificacion(err.error?.message || 'Error al aceptar', false)
      });
  }

  // 3. RECHAZAR O CONTRAOFERTAR
  abrirContraoferta() {
    this.mostrarModalLeer = false;
    this.mostrarModalRespuesta = true;
  }

  enviarRechazoOContraoferta() {
    const body = { 
      id_oferta: this.mensajeSeleccionado.id_oferta, 
      id_mensaje: this.mensajeSeleccionado.id_privado,
      motivo: this.respuestaInput // Si escribe algo, es una contraoferta. Si no, es un rechazo normal.
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

}