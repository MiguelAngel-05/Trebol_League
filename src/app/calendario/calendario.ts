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

  // para los partidos

  mostrarModalPartido = false;
  partidoSeleccionado: any = null;
  eventosPartido: any[] = [];
  eventosVisibles: any[] = [];
  golesLocalEnVivo = 0;
  golesVisitanteEnVivo = 0;
  minutoActual = 0;
  intervaloEnVivo: any;

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

  // --- esto es para los partidos su logica ---
  
  // Devuelve 'pendiente', 'en_curso' o 'finalizado' calculando el tiempo real
  getEstadoVisual(p: any): string {
    if (!p || !p.fecha_partido) return 'pendiente';
    const ahora = new Date().getTime();
    const inicio = new Date(p.fecha_partido).getTime();
    const fin = inicio + (60 * 60 * 1000); // El partido dura 60 minutos (1h)

    if (ahora < inicio) return 'pendiente';
    if (ahora >= inicio && ahora <= fin) return 'en_curso';
    return 'finalizado';
  }

  abrirPartido(p: any) {
    this.partidoSeleccionado = p;
    this.mostrarModalPartido = true;
    
    const estado = this.getEstadoVisual(p);

    // Si aún no empieza, no cargamos eventos
    if (estado === 'pendiente') {
       this.eventosVisibles = [];
       this.golesLocalEnVivo = 0;
       this.golesVisitanteEnVivo = 0;
       return;
    }

    // Pedimos los datos y la línea de tiempo al backend
    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/partido/${p.id_partido}`, this.getHeaders())
      .subscribe(res => {
         this.eventosPartido = res.eventos;
         this.actualizarMarcadorEnVivo();
         
         // Si se está jugando AHORA, activamos un reloj que refresca el minuto cada 10 segundos
         if (estado === 'en_curso') {
            this.intervaloEnVivo = setInterval(() => this.actualizarMarcadorEnVivo(), 10000);
         }
      });
  }

  actualizarMarcadorEnVivo() {
     if (!this.partidoSeleccionado) return;
     const estado = this.getEstadoVisual(this.partidoSeleccionado);
     
     if (estado === 'finalizado') {
        this.minutoActual = 60;
        this.eventosVisibles = this.eventosPartido;
        this.golesLocalEnVivo = this.partidoSeleccionado.goles_local;
        this.golesVisitanteEnVivo = this.partidoSeleccionado.goles_visitante;
        if (this.intervaloEnVivo) clearInterval(this.intervaloEnVivo);
        return;
     }

     if (estado === 'en_curso') {
        const ahora = new Date().getTime();
        const inicio = new Date(this.partidoSeleccionado.fecha_partido).getTime();
        
        // Calculamos en qué minuto estamos (1 minuto en la vida real = 1 minuto de juego)
        this.minutoActual = Math.floor((ahora - inicio) / 60000);
        if (this.minutoActual < 1) this.minutoActual = 1;

        // Revelamos solo los eventos que ya han pasado hasta este minuto
        this.eventosVisibles = this.eventosPartido.filter(e => e.minuto <= this.minutoActual);
        
        // Sumamos los goles dinámicamente viendo quién los ha marcado
        this.golesLocalEnVivo = this.eventosVisibles.filter(e => e.tipo_evento === 'gol' && e.equipo_jugador === this.partidoSeleccionado.equipo_local).length;
        this.golesVisitanteEnVivo = this.eventosVisibles.filter(e => e.tipo_evento === 'gol' && e.equipo_jugador === this.partidoSeleccionado.equipo_visitante).length;
     }
  }

  cerrarModalPartido() {
    this.mostrarModalPartido = false;
    this.partidoSeleccionado = null;
    if (this.intervaloEnVivo) clearInterval(this.intervaloEnVivo);
  }


}