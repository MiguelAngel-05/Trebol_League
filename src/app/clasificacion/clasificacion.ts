import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-clasificacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clasificacion.html',
  styleUrl: './clasificacion.css',
})
export class Clasificacion implements OnInit {
  user: any = null;
  id_liga!: number;
  dinero: number = 0;
  
  clasificacion: any[] = [];
  isLoading = true;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  mostrarModalUsuario: boolean = false;
  usuarioSeleccionado: any = null;

  // API URL
  private apiBase = 'https://api-trebol-league.vercel.app';

  ngOnInit() {
    this.id_liga = Number(this.route.snapshot.paramMap.get('idLiga'));
    const token = localStorage.getItem('token');

    if (token) {
      try { this.user = jwtDecode(token); } catch {}
    }

    this.cargarDatosUsuario();
    this.cargarClasificacion();
  }

  cargarDatosUsuario() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any>(`${this.apiBase}/api/ligas/${this.id_liga}/datos-usuario`, { headers })
      .subscribe({
        next: (data) => this.dinero = Number(data.dinero),
        error: (err) => console.error(err)
      });
  }

  cargarClasificacion() {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>(`${this.apiBase}/api/ligas/${this.id_liga}/clasificacion`, { headers })
      .subscribe({
        next: (data) => {
          this.clasificacion = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      });
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

  abrirModalOpciones(jugador: any) {
    if (jugador.id === this.user?.id) {
      return;
    }
    this.usuarioSeleccionado = jugador;
    this.mostrarModalUsuario = true;
  }

  cerrarModal() {
    this.mostrarModalUsuario = false;
    this.usuarioSeleccionado = null;
  }

  mandarMensaje() {
    // PENDIENTE
    alert('Próximamente: Chat con ' + this.usuarioSeleccionado.username);
    this.cerrarModal();
  }

  verPlantillaRival() {
    this.router.navigate(['/ligas', this.id_liga, 'plantilla-rival', this.usuarioSeleccionado.id]);
    this.cerrarModal();
  }

}