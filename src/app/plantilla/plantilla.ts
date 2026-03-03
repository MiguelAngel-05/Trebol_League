import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CartaComponent } from '../carta/carta';

const MAPA_FORMACIONES: Record<string, string[][]> = {
  '4-3-3': [ ['DL', 'DL', 'DL'], ['MC', 'MC', 'MC'], ['DF', 'DF', 'DF', 'DF'], ['PT'] ],
  '4-4-2': [ ['DL', 'DL'], ['MC', 'MC', 'MC', 'MC'], ['DF', 'DF', 'DF', 'DF'], ['PT'] ],
  '3-5-2': [ ['DL', 'DL'], ['MC', 'MC', 'MC', 'MC', 'MC'], ['DF', 'DF', 'DF'], ['PT'] ],
  '3-4-3': [ ['DL', 'DL', 'DL'], ['MC', 'MC', 'MC', 'MC'], ['DF', 'DF', 'DF'], ['PT'] ],
  '5-4-1': [ ['DL'], ['MC', 'MC', 'MC', 'MC'], ['DF', 'DF', 'DF', 'DF', 'DF'], ['PT'] ],
  '5-3-2': [ ['DL', 'DL'], ['MC', 'MC', 'MC'], ['DF', 'DF', 'DF', 'DF', 'DF'], ['PT'] ]
};

@Component({
  selector: 'app-plantilla',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, CartaComponent],
  templateUrl: './plantilla.html',
  styleUrl: './plantilla.css'
})
export class Plantilla implements OnInit {
  user: any = null;
  id_liga!: number;
  
  formacionSeleccionada: string = '4-3-3';
  opcionesFormacion = Object.keys(MAPA_FORMACIONES);
  
  filasCampo: { posicion: string, idDrop: string, jugadores: any[] }[][] = [];
  banquillo: any[] = [];
  todosMisJugadores: any[] = [];

  valorTotal: number = 0;
  mediaGlobal: number = 0;
  
  cambiosSinGuardar: boolean = false;
  mostrarModalSalir: boolean = false;
  rutaDestinoPendiente: string = '';

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
    this.cargarDatosUsuarioYPlantilla();
  }

  cargarDatosUsuarioYPlantilla() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/datos-usuario`, { headers })
      .subscribe(userData => {
        // Leemos la formación que viene de la base de datos
        if (userData.formacion && this.opcionesFormacion.includes(userData.formacion)) {
          this.formacionSeleccionada = userData.formacion;
        }

        this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/mis-jugadores`, { headers })
          .subscribe(jugadores => {
            this.todosMisJugadores = jugadores.map(j => ({...j, posicion: this.normalizarPosicion(j.posicion)}));
            this.generarCampo();
            this.calcularEstadisticas();
            this.cambiosSinGuardar = false;
          });
      });
  }

  generarCampo() {
    const molde = MAPA_FORMACIONES[this.formacionSeleccionada];
    this.filasCampo = [];
    this.banquillo = [];

    let jugadoresDisponibles = [...this.todosMisJugadores];
    let contadorHueco = 0;

    for (const fila of molde) {
      let filaGenerada = [];
      for (const pos of fila) {
        contadorHueco++;
        const idDropActual = `hueco-${contadorHueco}`;
        
        // 🛑 AHORA BUSCAMOS EL HUECO EXACTO GUARDADO EN BASE DE DATOS 🛑
        const indexTitular = jugadoresDisponibles.findIndex(j => j.es_titular && j.hueco_plantilla === idDropActual);
        
        let ocupante = [];
        if (indexTitular !== -1) {
          ocupante.push(jugadoresDisponibles[indexTitular]);
          jugadoresDisponibles.splice(indexTitular, 1);
        }

        filaGenerada.push({
          posicion: pos,
          idDrop: idDropActual, 
          jugadores: ocupante 
        });
      }
      this.filasCampo.push(filaGenerada);
    }

    this.banquillo = jugadoresDisponibles;
  }

  cambiarFormacion(nuevaFormacion: string) {
    this.formacionSeleccionada = nuevaFormacion;
    this.todosMisJugadores.forEach(j => { j.es_titular = false; j.hueco_plantilla = null; });
    this.generarCampo();
    this.cambiosSinGuardar = true;
  }

  drop(event: CdkDragDrop<any[]>, posicionHueco?: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const jugadorArrastrado = event.item.data;

      if (posicionHueco) {
        if (jugadorArrastrado.posicion !== posicionHueco) {
          this.mostrarNotificacion(`¡Ese jugador es ${jugadorArrastrado.posicion}, no puede jugar de ${posicionHueco}!`, false);
          return;
        }
        
        if (event.container.data.length >= 1) {
          const jugadorDesplazado = event.container.data[0];
          event.previousContainer.data.splice(event.previousIndex, 1);
          event.container.data.splice(0, 1, jugadorArrastrado);
          event.previousContainer.data.splice(event.previousIndex, 0, jugadorDesplazado);
          
          this.cambiosSinGuardar = true;
          this.calcularEstadisticas();
          return; 
        }
      }

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      this.cambiosSinGuardar = true;
      this.calcularEstadisticas();
    }
  }

  mandarAlBanquillo(jugador: any, hueco: any, event: Event) {
    event.preventDefault(); 
    const index = hueco.jugadores.indexOf(jugador);
    if (index > -1) {
      hueco.jugadores.splice(index, 1); 
      this.banquillo.unshift(jugador);  
      this.cambiosSinGuardar = true;
      this.calcularEstadisticas();
      this.mostrarNotificacion(`${jugador.nombre} enviado a reservas`, true);
    }
  }

  obtenerIdsConectados(): string[] {
    let ids = ['banquilloList'];
    for (const fila of this.filasCampo) {
      for (const hueco of fila) {
        ids.push(hueco.idDrop);
      }
    }
    return ids;
  }

  guardarPlantilla() {
    // 🛑 AHORA RECOGEMOS EL ID DEL JUGADOR Y EN QUÉ HUECO EXACTO ESTÁ 🛑
    const titularesData: any[] = [];
    for (const fila of this.filasCampo) {
      for (const hueco of fila) {
        if (hueco.jugadores.length > 0) {
          titularesData.push({
            id: hueco.jugadores[0].id_futbolista,
            hueco: hueco.idDrop // Guardamos "hueco-1", "hueco-5", etc.
          });
        }
      }
    }

    if (titularesData.length < 11 && this.banquillo.length > 0) {
      this.mostrarNotificacion('Aviso: Tienes huecos libres en el campo', false);
    }

    const body = {
      formacion: this.formacionSeleccionada,
      titulares: titularesData
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.put(`${this.apiBase}/api/ligas/${this.id_liga}/plantilla`, body, { headers })
      .subscribe({
        next: () => {
          this.mostrarNotificacion('¡Alineación guardada!', true);
          this.cambiosSinGuardar = false;
          if (this.rutaDestinoPendiente) {
            this.router.navigate([this.rutaDestinoPendiente]);
          }
        },
        error: () => this.mostrarNotificacion('Error al guardar', false)
      });
  }

  volverAtras() {
    const destino = `/ligas/${this.id_liga}/menu`;
    if (this.cambiosSinGuardar) {
      this.rutaDestinoPendiente = destino;
      this.mostrarModalSalir = true;
    } else {
      this.router.navigate([destino]);
    }
  }

  salirSinGuardar() {
    this.mostrarModalSalir = false;
    this.router.navigate([this.rutaDestinoPendiente]);
  }

  guardarYSalir() {
    this.mostrarModalSalir = false;
    this.guardarPlantilla(); 
  }

  cerrarModalSalir() {
    this.mostrarModalSalir = false;
    this.rutaDestinoPendiente = '';
  }

  calcularEstadisticas() {
    let sumaMedias = 0;
    let sumaPrecio = 0;
    let totalTitulares = 0;

    for (const fila of this.filasCampo) {
      for (const hueco of fila) {
        if (hueco.jugadores.length > 0) {
          sumaMedias += hueco.jugadores[0].media;
          sumaPrecio += Number(hueco.jugadores[0].precio);
          totalTitulares++;
        }
      }
    }
    this.valorTotal = sumaPrecio;
    this.mediaGlobal = totalTitulares > 0 ? Math.round(sumaMedias / totalTitulares) : 0;
  }

  normalizarPosicion(pos: string): string {
    const p = pos.toUpperCase();
    if (p.includes('DL') || p.includes('DEL')) return 'DL';
    if (p.includes('DF') || p.includes('DEF')) return 'DF';
    if (p.includes('PT') || p.includes('POR')) return 'PT';
    return 'MC';
  }

  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-ES').format(valor);
  }

  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => this.notificationMsg = '', 3000);
  }
}