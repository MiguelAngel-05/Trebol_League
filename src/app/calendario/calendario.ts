import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css'
})
export class Calendario implements OnInit {

  user: any = null;
  id_liga!: number;
  dinero: number = 0;
  miRol: string = 'user';
  mostrarModalGenerar = false;
  isGenerating = false;

  partidos: any[] = [];
  
  fechaActual: Date = new Date();
  diasCalendario: any[] = [];
  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  notificationMsg = '';
  isSuccess = false;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private apiBase = 'https://api-trebol-league.vercel.app';

  ngOnInit() {
    this.id_liga = Number(this.route.snapshot.paramMap.get('idLiga'));
    const token = localStorage.getItem('token');
    if (token) {
      try { this.user = jwtDecode(token); } catch {}
    }

    this.cargarDatosUsuario();
    this.cargarPartidos();
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
  }

  cargarDatosUsuario() {
    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/datos-usuario`, this.getHeaders())
      .subscribe({
        next: (data) => {
          this.dinero = Number(data.dinero);
          this.miRol = data.rol;
        }
      });
  }

  cargarPartidos() {
    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/calendario`, this.getHeaders())
      .subscribe({
        next: (data) => {
          this.partidos = data;
          this.generarMes(); 
        },
        error: (err) => console.error(err)
      });
  }

  // --- GENERADOR DEL MES (Lógica del Calendario) ---
  generarMes() {
    const year = this.fechaActual.getFullYear();
    const month = this.fechaActual.getMonth();
    
    const primerDiaMes = new Date(year, month, 1);
    const ultimoDiaMes = new Date(year, month + 1, 0);
    
    // Ajuste para que empiece en Lunes (0 = Lunes, 6 = Domingo)
    let diaSemanaInicio = primerDiaMes.getDay() - 1;
    if (diaSemanaInicio === -1) diaSemanaInicio = 6; 

    this.diasCalendario = [];

    // Días del mes anterior (para rellenar huecos grises)
    for (let i = diaSemanaInicio; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      this.diasCalendario.push({ fecha: d, esOtroMes: true });
    }

    // Días del mes actual
    for (let i = 1; i <= ultimoDiaMes.getDate(); i++) {
      const d = new Date(year, month, i);
      this.diasCalendario.push({ fecha: d, esOtroMes: false });
    }

    // Días del mes siguiente (para completar la última fila)
    const diasRestantes = 42 - this.diasCalendario.length; 
    for (let i = 1; i <= diasRestantes; i++) {
      const d = new Date(year, month + 1, i);
      this.diasCalendario.push({ fecha: d, esOtroMes: true });
    }
  }

  // Filtrar partidos de un día específico
  getPartidosDelDia(fecha: Date) {
    return this.partidos.filter(p => {
      const fPartido = new Date(p.fecha_partido);
      return fPartido.getDate() === fecha.getDate() &&
             fPartido.getMonth() === fecha.getMonth() &&
             fPartido.getFullYear() === fecha.getFullYear();
    });
  }

  // --- NAVEGACIÓN ---
  mesAnterior() {
    this.fechaActual = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth() - 1, 1);
    this.generarMes();
  }

  mesSiguiente() {
    this.fechaActual = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth() + 1, 1);
    this.generarMes();
  }

  irAHoy() {
    this.fechaActual = new Date();
    this.generarMes();
  }

  get mesActualTexto(): string {
    return this.fechaActual.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() && fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
  }

  // --- CREAR CALENDARIO ---
  abrirModalGenerar() {
    this.mostrarModalGenerar = true;
  }

  cerrarModalGenerar() {
    this.mostrarModalGenerar = false;
  }

  confirmarGenerarCalendario() {
    this.isGenerating = true;

    this.http.post(`${this.apiBase}/api/ligas/${this.id_liga}/generar-calendario`, {}, this.getHeaders())
      .subscribe({
        next: (res: any) => {
          this.isGenerating = false;
          this.mostrarNotificacion(res.message, true);
          this.cargarPartidos(); 
          this.cerrarModalGenerar();
        },
        error: (err) => {
          this.isGenerating = false;
          this.mostrarNotificacion(err.error?.message || 'Error al generar', false);
          this.cerrarModalGenerar();
        }
      });
  }

  volverAtras() { this.router.navigate(['/ligas', this.id_liga, 'menu']); }
  irAPerfil() { this.router.navigate(['/perfil']); }

  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => this.notificationMsg = '', 3500);
  }
}