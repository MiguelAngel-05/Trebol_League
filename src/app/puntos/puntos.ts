import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-puntos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './puntos.html',
  styleUrls: ['./puntos.css']
})
export class PuntosComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  tabActiva: 'jornadas' | 'general' = 'jornadas';
  
  idLiga!: number; 
  apiBase: string = 'https://api-trebol-league.vercel.app'; 

  user: any = null; 
  dinero: number = 0;

  // variables pra los puntos por jornada - hay q mirar esto samu
  managers: any[] = [];
  jornadasDisponibles: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  managerSeleccionado: number = 0;
  jornadaSeleccionada: number = 1;
  jugadoresJornada: any[] = [];
  totalPuntosJornada: number = 0;

  // Variables para Pestaña 2 (Clasificación de Clubes)
  clasificacionClubes: any[] = [];

  ngOnInit() {
    // Obtenemos el ID de la liga directamente de la URL (ruta dinámica)
    this.idLiga = Number(this.route.snapshot.paramMap.get('idLiga'));
    
    const token = localStorage.getItem('token');
    if (token) {
      try { this.user = jwtDecode(token); } catch {}
    }

    this.cargarDatosUsuarioLiga(); // Cargamos datos reales de la liga para el header
    this.cargarManagers();
    this.cargarClasificacionClubes();
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
  }

  // --- FUNCIONES DEL HEADER ---
  cargarDatosUsuarioLiga() {
    this.http.get<any>(`${this.apiBase}/api/ligas/${this.idLiga}/datos-usuario`, this.getHeaders())
      .subscribe({
        next: (data) => {
          if (data) {
            // El nombre y el avatar ya los decodifica el JWT en el ngOnInit.
            // Aquí solo atrapamos tu dinero real para esta liga específica.
            this.dinero = Number(data.dinero);
          }
        },
        error: (err) => console.error("Error al cargar los datos del usuario", err)
      });
  }

  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES').format(valor);
  }

  volverAtras() {
    this.router.navigate(['/ligas', this.idLiga, 'menu']);
  }

  irAChat() { this.router.navigate(['/ligas', this.idLiga, 'mensajes']); }
  irATienda() { this.router.navigate(['/ligas', this.idLiga, 'tienda']); }
  irAPerfil() { this.router.navigate(['/perfil']); }
  // -----------------------------------------------

  cambiarTab(tab: 'jornadas' | 'general') {
    this.tabActiva = tab;
  }

  cargarManagers() {
    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.idLiga}/managers`, this.getHeaders())
      .subscribe(res => {
        this.managers = res;
        if (this.managers.length > 0) {
          this.managerSeleccionado = this.managers[0].id;
          this.buscarPuntosJornada();
        }
      });
  }

  buscarPuntosJornada() {
  if (!this.managerSeleccionado || !this.jornadaSeleccionada) return;

  console.log("Consultando Puntos -> Liga:", this.idLiga, "Manager:", this.managerSeleccionado, "Jornada:", this.jornadaSeleccionada);

  this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.idLiga}/puntos-jornada?id_manager=${this.managerSeleccionado}&jornada=${this.jornadaSeleccionada}`, this.getHeaders())
    .subscribe({
      next: (res) => {
        console.log("Jugadores recibidos:", res); 
        this.jugadoresJornada = res;
        this.totalPuntosJornada = this.jugadoresJornada.reduce((sum, j) => sum + Number(j.puntos || 0), 0);
      },
      error: (err) => console.error("Error API:", err)
    });
}


  cargarClasificacionClubes() {
    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.idLiga}/clasificacion-clubes`, this.getHeaders())
      .subscribe(res => {
        this.clasificacionClubes = res;
      });
  }

  // Transforma "Motor Club Chacón" en "motor_club_chacon" para buscar la imagen
  // Utilizamos el mapeo exacto de tu base de datos a los archivos PNG
  getEscudoUrl(nombreEquipo: string): string {
    const mapeo: { [key: string]: string } = {
      'Real Pinar FC': 'real_pinar.png',
      'Athletic Hullera': 'athletic_hullera.png',
      'Club Náutico Brisamar': 'club_nautico_brisamar.png',
      'Racing Vaguadas': 'racing_vaguadas.png',
      'Motor Club Chacón': 'motor_club_chacon.png',
      'Unión Fortaleza': 'union_fortaleza.png',
      'CD Frontera': 'cd_frontera.png',
      'Sporting Lechuza': 'sporting_lechuza.png',
      'CF Átomo': 'cf_atomo.png',
      'Deportivo Relámpago': 'deportivo_relampago.png',
      'CD Refugio': 'cd_refugio.png',
      'Dragones de Oriente': 'dragones_de_oriente.png',
      'UD Recreo': 'ud_recreo.png',
      'Alianza Metropolitana': 'alianza_metropolitana.png',
      'Neón City FC': 'neon_city_fc.png',
      'Pixel United': 'pixel_united.png',
      'Gourmet FC': 'gourmet_fc.png',
      'Titanes CF': 'titanes_cf.png',
      'Pangea FC': 'pangea_fc.png',
      'Cosmos United': 'cosmos_united.png',
      'Real Trébol FC': 'real_trebol.png'
    };
    
    const archivo = mapeo[nombreEquipo];
    // Hemos añadido la barra inicial "/" para que busque desde la raíz
    return archivo ? `/Utensilios/Escudos/${archivo}` : '/Utensilios/Escudos/escudo_default.png';
  }
}