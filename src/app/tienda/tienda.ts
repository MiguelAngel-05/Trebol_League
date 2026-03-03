import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { CartaComponent, obtenerRutaEscudoGlobal } from '../carta/carta';

interface Sobre {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  contenidoInfo: string;
  colorBorde: string;
  imagen: string;
  posicion?: string; 
}

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, CartaComponent],
  templateUrl: './tienda.html',
  styleUrl: './tienda.css',
})
export class Tienda implements OnInit {
  user: any = null;
  dinero: number = 0;
  id_liga!: number; 

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private apiBase = 'https://api-trebol-league.vercel.app';

  vistaActual: 'tienda' | 'animacion' = 'tienda';
  jugadorObtenido: any = null;
  
  mostrarPosicion = false;
  mostrarEscudo = false;
  mostrarMedia = false;
  mostrarCarta = false;
  flashActivo = false;

  // Control de pestañas de la tienda
  tabActiva: 'normales' | 'posiciones' = 'normales';
  
  // El sobre que el usuario tiene pinchado para ver la info a la derecha
  sobreSeleccionado: Sobre | null = null;

  // Catálogo de Sobres Normales
  sobresNormales: Sobre[] = [
    {
      id: 'norm_1', nombre: 'Sobre Normal', precio: 10000000,
      descripcion: 'El sobre clásico de la Trébol League. Contiene 1 jugador aleatorio de cualquier posición y media.',
      contenidoInfo: '1 Jugador Aleatorio', colorBorde: '#2ed573',
      imagen: 'Utensilios/Sobres/SobreTL_normal.png'
    },
    {
      id: 'norm_2', nombre: 'Sobre Especial', precio: 25000000,
      descripcion: 'Para los mánagers más exigentes. Más posibilidades de conseguir a las estrellas de la liga.',
      contenidoInfo: '1 Jugador Aleatorio (Alta Probabilidad)', colorBorde: '#ff9100',
      imagen: 'Utensilios/Sobres/SobreTL_especial.png'
    }
  ];

  // Catálogo de Sobres por Posición
  sobresPosiciones: Sobre[] = [
    {
      id: 'pos_dl', nombre: 'Sobre Delantero', precio: 15000000,
      descripcion: '¿Te falta gol? Este sobre garantiza un jugador atacante (DL) para perforar la red rival.',
      contenidoInfo: '1 Jugador (Posición: DL)', colorBorde: '#ff4757', posicion: 'DL',
      imagen: 'Utensilios/Sobres/SobreTL_normal.png' 
    },
    {
      id: 'pos_mc', nombre: 'Sobre Medio', precio: 15000000,
      descripcion: 'Controla el ritmo del partido. Garantiza un mediocentro (MC) creador o destructor.',
      contenidoInfo: '1 Jugador (Posición: MC)', colorBorde: '#2ed573', posicion: 'MC',
      imagen: 'Utensilios/Sobres/SobreTL_normal.png'
    },
    {
      id: 'pos_df', nombre: 'Sobre Defensa', precio: 15000000,
      descripcion: 'Construye un muro infranqueable. Garantiza un defensa (DF) puro y duro.',
      contenidoInfo: '1 Jugador (Posición: DF)', colorBorde: '#1e90ff', posicion: 'DF',
      imagen: 'Utensilios/Sobres/SobreTL_normal.png'
    },
    {
      id: 'pos_pt', nombre: 'Sobre Portero', precio: 15000000,
      descripcion: 'Asegura tu portería a cero. Garantiza un guardameta (PT) bajo palos.',
      contenidoInfo: '1 Jugador (Posición: PT)', colorBorde: '#ffa502', posicion: 'PT',
      imagen: 'Utensilios/Sobres/SobreTL_normal.png'
    }
  ];

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      try { this.user = jwtDecode(token); } catch {}
    }

    this.route.paramMap.subscribe(params => {
      // 1. Intentamos la forma tradicional
      let id = params.get('id_liga') || params.get('id');

      if (!id && this.route.parent) {
        id = this.route.parent.snapshot.paramMap.get('id_liga') || this.route.parent.snapshot.paramMap.get('id');
      }

      // 2. Leemos la URL "a lo bruto"
      if (!id) {
        const urlPura = this.router.url.split('/');
        const idEncontrado = urlPura.find(fragmento => fragmento !== '' && !isNaN(Number(fragmento)));
        if (idEncontrado) {
          id = idEncontrado;
        }
      }

      // 3. Asignamos y pedimos el dinero
      if (id) {
        this.id_liga = Number(id);
        this.cargarDatosMios(); 
      } else {
        console.error("No pudimos sacar el ID de esta URL:", this.router.url);
      }
    });

    this.seleccionarSobre(this.sobresNormales[0]);
  }

  cargarDatosMios() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/datos-usuario`, { headers })
      .subscribe({
        next: (data) => this.dinero = Number(data.dinero),
        error: (err) => console.error(err)
      });
  }

  cambiarTab(tab: 'normales' | 'posiciones') {
    this.tabActiva = tab;
    if (tab === 'normales') this.seleccionarSobre(this.sobresNormales[0]);
    else this.seleccionarSobre(this.sobresPosiciones[0]);
  }

  seleccionarSobre(sobre: Sobre) {
    this.sobreSeleccionado = sobre;
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

  comprarSobre() {
    if (!this.sobreSeleccionado) return;
    if (this.dinero < this.sobreSeleccionado.precio) {
      alert('¡No tienes suficientes Tc para comprar este sobre!');
      return;
    }

    // 1. Deshabilitamos la tienda y preparamos la arena de animación
    this.vistaActual = 'animacion'; 
    this.mostrarPosicion = false;
    this.mostrarEscudo = false;
    this.mostrarMedia = false;
    this.mostrarCarta = false;
    this.flashActivo = false;
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    // 2. Configuramos la ruta y el body dependiendo del sobre
    let urlEndpoint = '';
    let bodyData = {};

    if (this.sobreSeleccionado.id === 'norm_1') {
      // Es un sobre normal (10 Millones)
      urlEndpoint = `${this.apiBase}/api/ligas/${this.id_liga}/tienda/abrir-normal`;
      
    } else if (this.sobreSeleccionado.posicion) {
      // Es un sobre posicional (15 Millones), mandamos la posición ('DL', 'MC'...) al backend
      urlEndpoint = `${this.apiBase}/api/ligas/${this.id_liga}/tienda/abrir-posicion`;
      bodyData = { posicion: this.sobreSeleccionado.posicion };
      
    } else {
      // El sobre élite u otros
      alert('La animación de este sobre llegará en el futuro.');
      this.vistaActual = 'tienda';
      return;
    }

    // 3. Ejecutamos la llamada HTTP a la ruta correspondiente
    this.http.post<any>(urlEndpoint, bodyData, { headers })
      .subscribe({
        next: (res) => {
          this.dinero -= this.sobreSeleccionado!.precio; 
          this.iniciarAnimacionSobre(res.jugador); 
        },
        error: (err) => {
          alert(err.error?.message || 'Error al abrir el sobre');
          this.vistaActual = 'tienda'; 
        }
      });
  }

  // Arranca la secuencia pasándole el jugador de la base de datos
  iniciarAnimacionSobre(jugadorReal: any) {
    this.jugadorObtenido = jugadorReal;

    setTimeout(() => { this.mostrarPosicion = true; }, 2000);
    setTimeout(() => { this.mostrarEscudo = true; }, 4500);
    setTimeout(() => { this.mostrarMedia = true; }, 7000);
    
    setTimeout(() => {
      this.flashActivo = true; 
      this.mostrarPosicion = false;
      this.mostrarEscudo = false;
      this.mostrarMedia = false;
      
      setTimeout(() => {
        this.flashActivo = false;
        this.mostrarCarta = true;
      }, 500);
    }, 9000);
  }

  // La Tienda ya no calcula el escudo, se lo pide a la lógica central de la Carta
  getRutaEscudo(equipo: string): string {
    return obtenerRutaEscudoGlobal(equipo);
  }

  volverATienda() {
    this.vistaActual = 'tienda';
    this.jugadorObtenido = null;
  }
}