import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { FormsModule } from '@angular/forms'; // <--- OBLIGATORIO PARA ngModel

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css'
})
export class Calendario implements OnInit {

  user: any = null;
  id_liga!: number;
  dinero: number = 0;
  miRol: string = 'user';
  
  // --- VARIABLES PARA EL CALENDARIO ---
  partidos: any[] = [];
  participantes: any[] = []; // Para mostrar quién está si la liga no ha empezado
  fechaActual: Date = new Date();
  diasCalendario: any[] = [];
  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // --- VARIABLES PARA START/RESET LIGA ---
  mostrarModalGenerar = false;
  isGenerating = false;
  configInicial = {
    dinero: 100000000, 
    darPlantilla: true
  };

  mostrarModalReset = false;
  resetOpciones = {
    borrarPuntos: false,
    borrarJugadores: false,
    borrarJornadas: true,
    borrarDinero: false,
    borrarMensajes: true
  };

  // --- VARIABLES PARA EL PARTIDO EN VIVO ---
  mostrarModalPartido = false;
  partidoSeleccionado: any = null;
  eventosPartido: any[] = [];
  eventosVisibles: any[] = [];
  golesLocalEnVivo = 0;
  golesVisitanteEnVivo = 0;
  minutoActual = 0;
  intervaloEnVivo: any;
  
  tabPartido: 'cronica' | 'alineaciones' = 'cronica';
  alineacionesListas: any = { local: { titulares: [], banquillo: [] }, visitante: { titulares: [], banquillo: [] } };

  // Notificaciones
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
          if (this.partidos.length === 0) {
            this.cargarParticipantes();
          }
        },
        error: (err) => console.error(err)
      });
  }

  cargarParticipantes() {
    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/managers`, this.getHeaders())
      .subscribe(res => {
        this.participantes = res;
      });
  }

  // --- GENERADOR DEL MES ---
  generarMes() {
    const year = this.fechaActual.getFullYear();
    const month = this.fechaActual.getMonth();
    
    const primerDiaMes = new Date(year, month, 1);
    const ultimoDiaMes = new Date(year, month + 1, 0);
    
    let diaSemanaInicio = primerDiaMes.getDay() - 1;
    if (diaSemanaInicio === -1) diaSemanaInicio = 6; 

    this.diasCalendario = [];

    for (let i = diaSemanaInicio; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      this.diasCalendario.push({ fecha: d, esOtroMes: true });
    }

    for (let i = 1; i <= ultimoDiaMes.getDate(); i++) {
      const d = new Date(year, month, i);
      this.diasCalendario.push({ fecha: d, esOtroMes: false });
    }

    const diasRestantes = 42 - this.diasCalendario.length; 
    for (let i = 1; i <= diasRestantes; i++) {
      const d = new Date(year, month + 1, i);
      this.diasCalendario.push({ fecha: d, esOtroMes: true });
    }
  }

  getPartidosDelDia(fecha: Date) {
    return this.partidos.filter(p => {
      const fPartido = new Date(p.fecha_partido);
      return fPartido.getDate() === fecha.getDate() &&
             fPartido.getMonth() === fecha.getMonth() &&
             fPartido.getFullYear() === fecha.getFullYear();
    });
  }

  // --- NAVEGACIÓN CALENDARIO ---
  mesAnterior() { this.fechaActual = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth() - 1, 1); this.generarMes(); }
  mesSiguiente() { this.fechaActual = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth() + 1, 1); this.generarMes(); }
  irAHoy() { this.fechaActual = new Date(); this.generarMes(); }

  get mesActualTexto(): string { return this.fechaActual.toLocaleString('es-ES', { month: 'long', year: 'numeric' }); }
  esHoy(fecha: Date): boolean { const hoy = new Date(); return fecha.getDate() === hoy.getDate() && fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear(); }

  // --- START / RESET LIGA ---
  abrirModalGenerar() { this.mostrarModalGenerar = true; }
  
  confirmarGenerarCalendario() {
    this.isGenerating = true;
    const body = {
      dineroInicial: this.configInicial.dinero,
      darPlantilla: this.configInicial.darPlantilla
    };

    this.http.post(`${this.apiBase}/api/ligas/${this.id_liga}/generar-calendario`, body, this.getHeaders())
      .subscribe({
        next: (res: any) => {
          this.isGenerating = false;
          this.mostrarNotificacion(res.message, true);
          this.cargarPartidos(); 
          this.cargarDatosUsuario(); // Actualizamos el dinero en pantalla
          this.mostrarModalGenerar = false;
        },
        error: (err) => {
          this.isGenerating = false;
          this.mostrarNotificacion(err.error?.message || 'Error al generar', false);
        }
      });
  }

  confirmarResetLiga() {
    this.http.post(`${this.apiBase}/api/ligas/${this.id_liga}/reset`, this.resetOpciones, this.getHeaders())
      .subscribe({
        next: (res: any) => {
          this.mostrarNotificacion(res.message, true);
          this.mostrarModalReset = false;
          this.cargarPartidos(); // Volverá a 0
          this.cargarDatosUsuario(); // Refresca el dinero si se borró
        },
        error: () => this.mostrarNotificacion('Error al reiniciar', false)
      });
  }

  // --- LÓGICA DE PARTIDOS EN VIVO Y DETALLES ---
  getEstadoVisual(p: any): string {
    if (!p || !p.fecha_partido) return 'pendiente';
    const ahora = new Date().getTime();
    const inicio = new Date(p.fecha_partido).getTime();
    const fin = inicio + (70 * 60 * 1000); // 70 MINUTOS (60 juego + 10 descanso)

    if (ahora < inicio) return 'pendiente';
    if (ahora >= inicio && ahora <= fin) return 'en_curso';
    return 'finalizado';
  }

  abrirPartido(p: any) {
    this.partidoSeleccionado = p;
    this.mostrarModalPartido = true;
    this.tabPartido = 'cronica'; 
    const estado = this.getEstadoVisual(p);

    if (estado === 'pendiente') {
       this.eventosVisibles = [];
       this.golesLocalEnVivo = 0;
       this.golesVisitanteEnVivo = 0;
       this.alineacionesListas = { local: { titulares: [], banquillo: [] }, visitante: { titulares: [], banquillo: [] } };
       return;
    }

    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/partido/${p.id_partido}`, this.getHeaders())
      .subscribe(res => {
         this.eventosPartido = res.eventos;
         this.procesarAlineaciones(res.partido.alineaciones, res.jugadores);
         this.actualizarMarcadorEnVivo();
         
         if (estado === 'en_curso') {
            this.intervaloEnVivo = setInterval(() => this.actualizarMarcadorEnVivo(), 10000);
         }
      });
  }

  procesarAlineaciones(alineacionesJson: any, infoJugadores: any[]) {
    if (!alineacionesJson || !infoJugadores) return;
    const mapearJugadores = (ids: number[]) => ids.map(id => infoJugadores.find(j => j.id_futbolista === id)).filter(j => !!j);
    this.alineacionesListas = {
      local: { titulares: mapearJugadores(alineacionesJson.local.titulares), banquillo: mapearJugadores(alineacionesJson.local.banquillo) },
      visitante: { titulares: mapearJugadores(alineacionesJson.visitante.titulares), banquillo: mapearJugadores(alineacionesJson.visitante.banquillo) }
    };
  }

  cambiarTabPartido(tab: 'cronica' | 'alineaciones') { this.tabPartido = tab; }

  actualizarMarcadorEnVivo() {
     if (!this.partidoSeleccionado) return;
     const estado = this.getEstadoVisual(this.partidoSeleccionado);
     
     if (estado === 'finalizado') {
        this.minutoActual = 70; 
        this.eventosVisibles = this.eventosPartido;
        this.golesLocalEnVivo = this.partidoSeleccionado.goles_local;
        this.golesVisitanteEnVivo = this.partidoSeleccionado.goles_visitante;
        if (this.intervaloEnVivo) clearInterval(this.intervaloEnVivo);
        return;
     }

     if (estado === 'en_curso') {
        const ahora = new Date().getTime();
        const inicio = new Date(this.partidoSeleccionado.fecha_partido).getTime();
        
        this.minutoActual = Math.floor((ahora - inicio) / 60000);
        if (this.minutoActual < 1) this.minutoActual = 1;

        this.eventosVisibles = this.eventosPartido.filter(e => {
            if (e.minuto === 'HT') return this.minutoActual >= 30;
            return e.minuto <= this.minutoActual;
        });
        
        this.golesLocalEnVivo = this.eventosVisibles.filter(e => e.tipo_evento === 'gol' && e.equipo_jugador === this.partidoSeleccionado.equipo_local).length;
        this.golesVisitanteEnVivo = this.eventosVisibles.filter(e => e.tipo_evento === 'gol' && e.equipo_jugador === this.partidoSeleccionado.equipo_visitante).length;
     }
  }

  cerrarModalPartido() {
    this.mostrarModalPartido = false;
    this.partidoSeleccionado = null;
    if (this.intervaloEnVivo) clearInterval(this.intervaloEnVivo);
  }

  // --- UTILIDADES ---
  volverAtras() { this.router.navigate(['/ligas', this.id_liga, 'menu']); }
  irAPerfil() { this.router.navigate(['/perfil']); }
  formatearDinero(valor: number): string { return new Intl.NumberFormat('es-ES').format(valor); }
  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje; this.isSuccess = exito;
    setTimeout(() => this.notificationMsg = '', 3500);
  }
}