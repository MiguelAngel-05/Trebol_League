import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { CartaComponent } from '../carta/carta';

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
  id_liga: number = 3; 

  private router = inject(Router);
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
      imagen: 'Utensilios/Sobres/SobreTL_normal.png' // <-- TU IMAGEN
    },
    {
      id: 'norm_2', nombre: 'Sobre Élite', precio: 25000000,
      descripcion: 'Para los mánagers más exigentes. Más posibilidades de conseguir a las estrellas de la liga.',
      contenidoInfo: '1 Jugador Aleatorio (Alta Probabilidad)', colorBorde: '#00d2ff',
      imagen: 'Utensilios/Sobres/SobreTL_normal.png' // Cámbialo cuando tengas el diseño élite
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
    this.cargarDatosMios();
    // Seleccionamos el primer sobre por defecto al entrar
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
    // Al cambiar de tab, seleccionamos el primer sobre de esa categoría
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
      alert('¡No tienes suficientes Tc!');
      return;
    }

    // Por ahora, solo activamos la animación para el "Sobre Normal"
    if (this.sobreSeleccionado.id === 'norm_1') {
      // Restamos el dinero visualmente (luego lo haremos en base de datos)
      this.dinero -= this.sobreSeleccionado.precio;
      this.iniciarAnimacionSobre();
    } else {
      alert('La animación de este sobre llegará en el futuro.');
    }
  }

  iniciarAnimacionSobre() {
    // 1. Aquí en el futuro llamaremos a la Base de Datos para que nos dé un jugador aleatorio.
    // Por ahora, nos inventamos uno top para probar la animación:
    this.jugadorObtenido = {
      id_futbolista: 99,
      nombre: "Lamine Yamal",
      posicion: "DL",
      equipo: "Real Pinar FC", 
      media: 87,
      imagen: "https://api.dicebear.com/9.x/micah/svg?seed=Lamine Yamal", // o tu placeholder de Dicebear
      ataque: 88, defensa: 30, pase: 82, parada: 10
    };

    // 2. Preparamos el escenario
    this.vistaActual = 'animacion';
    this.mostrarPosicion = false;
    this.mostrarEscudo = false;
    this.mostrarMedia = false;
    this.mostrarCarta = false;
    this.flashActivo = false;

    // 3. LA SECUENCIA DE TIEMPO (Tensión pura)
    // A los 2 segundos: cae la posición
    setTimeout(() => { this.mostrarPosicion = true; }, 2000);
    
    // A los 4.5 segundos: cae el escudo
    setTimeout(() => { this.mostrarEscudo = true; }, 4500);
    
    // A los 7 segundos: cae la media
    setTimeout(() => { this.mostrarMedia = true; }, 7000);
    
    // A los 9 segundos: ¡Fogonazo blanco y revelación de carta!
    setTimeout(() => {
      this.flashActivo = true; // Activa el pantallazo blanco
      this.mostrarPosicion = false;
      this.mostrarEscudo = false;
      this.mostrarMedia = false;
      
      // Medio segundo después del flash, mostramos la carta
      setTimeout(() => {
        this.flashActivo = false;
        this.mostrarCarta = true;
      }, 500);

    }, 9000);
  }

  // Helper para sacar la ruta del escudo en la animación
  getRutaEscudo(equipo: string): string {
    const mapeo: { [key: string]: string } = {
      'Real Pinar FC': 'real_pinar.png',
      'Athletic Hullera': 'athletic_hullera.png',
      'Real Trébol FC': 'real_trebol.png'
    };
    const archivo = mapeo[equipo];
    return archivo ? `Utensilios/Escudos/${archivo}` : 'Utensilios/Escudos/escudo_default.png';
  }

  volverATienda() {
    this.vistaActual = 'tienda';
    this.jugadorObtenido = null;
  }
}