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
  
  // Control de Pestañas
  tabActiva: 'general' | 'jornada_ranking' | 'mis_puntos' | 'clubes' = 'general';
  isLoading = true;

  // Datos de las pestañas
  clasificacionGeneral: any[] = [];
  clasificacionJornada: any[] = [];
  clasificacionClubes: any[] = [];
  
  // Filtros "Mis Puntos" y "Jornada"
  managers: any[] = [];
  jornadasDisponibles: number[] = Array.from({length: 38}, (_, i) => i + 1); 
  managerSeleccionado: number = 0;
  jornadaSeleccionada: number = 1;
  jugadoresJornada: any[] = [];
  totalPuntosJornada: number = 0;

  // Modales Mánagers y Mensajes
  mostrarModalUsuario: boolean = false;
  usuarioSeleccionado: any = null;
  mostrarModalMensaje = false;
  destinatarioMensaje: any = null;
  asuntoInput: string = '';
  contenidoInput: string = '';

  // Modal Club IA
  mostrarModalClub = false;
  clubSeleccionado: any = null;
  
  // Estadísticas Club IA
  pichichi: any = null;
  maxAsistente: any = null;
  masTarjetas: any = null;

  notificationMsg = '';
  isSuccess = false;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private apiBase = 'https://api-trebol-league.vercel.app';

  tabClubActiva: 'plantilla' | 'noticias' | 'partido' = 'plantilla';
  clubNoticias: any[] = [];
  clubUltimoPartido: any = null;

  ngOnInit() {
    this.id_liga = Number(this.route.snapshot.paramMap.get('idLiga'));
    const token = localStorage.getItem('token');
    if (token) {
      try { this.user = jwtDecode(token); } catch {}
    }
    this.cargarDatosUsuario();
    this.cargarManagers();
    this.cargarTodo();
  }

  private getHeaders() {
    return { headers: new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('token')}` }) };
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

  cargarManagers() {
    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/managers`, this.getHeaders())
      .subscribe(res => {
        this.managers = res;
        if (this.managers.length > 0) this.managerSeleccionado = this.user?.id || this.managers[0].id;
      });
  }

  cargarTodo() {
    this.isLoading = true;
    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/clasificacion`, this.getHeaders())
      .subscribe(res => { this.clasificacionGeneral = res; this.isLoading = false; });
    
    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/clasificacion-clubes`, this.getHeaders())
      .subscribe(res => { this.clasificacionClubes = res; });
      
    this.buscarPuntosJornada();
    this.buscarRankingJornada();
  }

  cambiarTab(tab: 'general' | 'jornada_ranking' | 'mis_puntos' | 'clubes') {
    this.tabActiva = tab;
  }

  buscarPuntosJornada() {
    if (!this.managerSeleccionado || !this.jornadaSeleccionada) return;
    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/puntos-jornada?id_manager=${this.managerSeleccionado}&jornada=${this.jornadaSeleccionada}`, this.getHeaders())
      .subscribe(res => {
        this.jugadoresJornada = res;
        this.totalPuntosJornada = this.jugadoresJornada.reduce((sum, j) => sum + Number(j.puntos || 0), 0);
      });
  }

  buscarRankingJornada() {
    if (!this.jornadaSeleccionada) return;
    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/ranking-jornada/${this.jornadaSeleccionada}`, this.getHeaders())
      .subscribe(res => { this.clasificacionJornada = res; });
  }

  alCambiarJornada() {
    this.buscarPuntosJornada();
    this.buscarRankingJornada();
  }

  // Calcula el premio individual replicando la lógica exacta de tu Backend
  calcularPremioJornada(posicion: number, puntos: number): number {
    let premio = (Number(puntos) || 0) * 100000; // 100.000 Tc por cada punto

    // Bonus por subir al podio
    if (posicion === 0) premio += 5000000;      // 1º: +5 Millones
    else if (posicion === 1) premio += 3000000; // 2º: +3 Millones
    else if (posicion === 2) premio += 1500000; // 3º: +1.5 Millón

    return premio;
  }

  // Calcula la suma total de dinero que se va a repartir (o se ha repartido) en toda la jornada
  get totalPremiosJornada(): number {
    if (!this.clasificacionJornada || this.clasificacionJornada.length === 0) return 0;
    
    return this.clasificacionJornada.reduce((suma, jugador, index) => {
      return suma + this.calcularPremioJornada(index, jugador.puntos_jornada);
    }, 0);
  }

  // Comprueba si la jornada no ha empezado (nadie ha puntuado todavía)
  get jornadaNoEmpezada(): boolean {
    if (!this.clasificacionJornada || this.clasificacionJornada.length === 0) return true;
    
    // Sumamos los puntos de todos. Si el total es 0, es que no ha empezado.
    const sumaTotalPuntos = this.clasificacionJornada.reduce((suma, j) => suma + Number(j.puntos_jornada || 0), 0);
    return sumaTotalPuntos === 0;
  }

  // --- MODAL CLUBES DE LA IA ---
  abrirModalClub(club: any) {
    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/club/${club.equipo}`, this.getHeaders())
      .subscribe(res => {
        this.clubSeleccionado = { ...res, lore: res.lore };
        this.calcularEstadisticas(res.plantilla);
        
        this.tabClubActiva = 'plantilla';
        this.clubNoticias = res.noticias || [];
        this.clubUltimoPartido = null;

        if (res.ultimo_partido) {
            const isLocal = res.ultimo_partido.equipo_local === club.equipo;
            const alineacionObj = isLocal ? res.ultimo_partido.alineaciones?.local : res.ultimo_partido.alineaciones?.visitante;
            
            // TITULARES: Todos juegan, les ponemos su nota.
            const titulares = (alineacionObj?.titulares || []).map((id: number) => {
               const j = res.plantilla.find((x:any) => x.id_futbolista === id);
               return j ? { ...j, nota_partido: j.forma_actual } : null;
            }).filter((x:any)=>x);

            // BANQUILLO: Miramos si entraron al campo buscando un evento 'cambio' con su ID.
            const banquillo = (alineacionObj?.banquillo || []).map((id: number) => {
               const j = res.plantilla.find((x:any) => x.id_futbolista === id);
               if (!j) return null;
               
               // ¿Entró en el partido?
               const jugo = res.ultimo_partido.eventos.some((e:any) => e.tipo_evento === 'cambio' && e.id_futbolista === id);
               return { ...j, nota_partido: jugo ? j.forma_actual : '-' }; // Si jugó, nota. Si no, "-"
            }).filter((x:any)=>x);

            this.clubUltimoPartido = {
                ...res.ultimo_partido,
                titulares: titulares,
                banquillo: banquillo
            };
        }

        this.mostrarModalClub = true;
      });
  }

  calcularEstadisticas(plantilla: any[]) {
    if (!plantilla || plantilla.length === 0) {
        this.pichichi = null; this.maxAsistente = null; this.masTarjetas = null;
        return;
    }
    const p = [...plantilla];
    
    const topGoleador = [...p].sort((a, b) => Number(b.goles) - Number(a.goles))[0];
    this.pichichi = topGoleador.goles > 0 ? topGoleador : null;

    const topAsis = [...p].sort((a, b) => Number(b.asistencias) - Number(a.asistencias))[0];
    this.maxAsistente = topAsis.asistencias > 0 ? topAsis : null;

    const topTarjetas = [...p].sort((a, b) => ((Number(b.rojas) * 3) + Number(b.amarillas)) - ((Number(a.rojas) * 3) + Number(a.amarillas)))[0];
    this.masTarjetas = (topTarjetas.amarillas > 0 || topTarjetas.rojas > 0) ? topTarjetas : null;
  }

  cerrarModalClub() { this.mostrarModalClub = false; this.clubSeleccionado = null; }

  // --- MODAL MÁNAGERS ---
  abrirModalOpciones(jugador: any) {
    if (jugador.id === this.user?.id) return;
    this.usuarioSeleccionado = jugador;
    this.mostrarModalUsuario = true;
  }

  cerrarModal() { this.mostrarModalUsuario = false; this.usuarioSeleccionado = null; }

  mandarMensaje() {
    this.destinatarioMensaje = this.usuarioSeleccionado;
    this.cerrarModal();
    this.mostrarModalMensaje = true;
  }

  cerrarModalMensaje() {
    this.mostrarModalMensaje = false;
    this.destinatarioMensaje = null;
    this.asuntoInput = ''; this.contenidoInput = '';
  }

  enviarMensajePrivado() {
    if (!this.asuntoInput || !this.contenidoInput) return this.mostrarNotificacion('Faltan datos.', false);
    const body = { id_destinatario: this.destinatarioMensaje.id, asunto: this.asuntoInput, contenido: this.contenidoInput };
    this.http.post(`${this.apiBase}/api/ligas/${this.id_liga}/mensajes-texto`, body, this.getHeaders())
      .subscribe({
        next: () => { this.mostrarNotificacion('Mensaje enviado', true); this.cerrarModalMensaje(); },
        error: () => this.mostrarNotificacion('Error enviando mensaje', false)
      });
  }

  toggleAdmin() {
    if (!this.usuarioSeleccionado) return;
    this.http.put(`${this.apiBase}/api/ligas/${this.id_liga}/toggle-admin/${this.usuarioSeleccionado.id}`, {}, this.getHeaders())
      .subscribe({
        next: (res: any) => { this.mostrarNotificacion(res.message, true); this.cerrarModal(); this.cargarTodo(); },
        error: (err) => this.mostrarNotificacion(err.error?.message || 'Error', false)
      });
  }

  verPlantillaRival() {
    this.router.navigate(['/ligas', this.id_liga, 'plantilla-rival', this.usuarioSeleccionado.id]);
  }

  // --- UTILIDADES ---
  getEscudoUrl(nombreEquipo: string): string {
    const mapeo: { [key: string]: string } = {
      'Real Pinar FC': 'real_pinar.webp', 'Athletic Hullera': 'athletic_hullera.webp', 'Club Náutico Brisamar': 'club_nautico_brisamar.webp',
      'Racing Vaguadas': 'racing_vaguadas.webp', 'Motor Club Chacón': 'motor_club_chacon.webp', 'Unión Fortaleza': 'union_fortaleza.webp',
      'CD Frontera': 'cd_frontera.webp', 'Sporting Lechuza': 'sporting_lechuza.webp', 'CF Átomo': 'cf_atomo.webp',
      'Deportivo Relámpago': 'deportivo_relampago.webp', 'CD Refugio': 'cd_refugio.webp', 'Dragones de Oriente': 'dragones_de_oriente.webp',
      'UD Recreo': 'ud_recreo.webp', 'Alianza Metropolitana': 'alianza_metropolitana.webp', 'Neón City FC': 'neon_city_fc.webp',
      'Pixel United': 'pixel_united.webp', 'Gourmet FC': 'gourmet_fc.webp', 'Titanes CF': 'titanes_cf.webp',
      'Pangea FC': 'pangea_fc.webp', 'Cosmos United': 'cosmos_united.webp', 'Real Trébol FC': 'real_trebol.webp'
    };
    return mapeo[nombreEquipo] ? `/Utensilios/Escudos/${mapeo[nombreEquipo]}` : '/Utensilios/Escudos/escudo_default.webp';
  }

  get bajasActuales(): any[] {
    if (!this.clubSeleccionado || !this.clubSeleccionado.plantilla) return [];
    // Filtramos los que tengan más de 0 partidos de sanción o lesión
    return this.clubSeleccionado.plantilla.filter((j: any) => j.partidos_lesion > 0 || j.partidos_sancion > 0);
  }

  formatearDinero(valor: number): string { return new Intl.NumberFormat('es-ES').format(valor); }
  volverAtras() { this.router.navigate(['/ligas', this.id_liga, 'menu']); }
  irAPerfil() { this.router.navigate(['/perfil']); }
  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje; this.isSuccess = exito;
    setTimeout(() => this.notificationMsg = '', 3000);
  }
}