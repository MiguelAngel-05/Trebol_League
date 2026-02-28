import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  user: any = null;
  
  nombreInput: string = '';
  avatarPrevisualizacion: string = '';
  
  estilosAvatar = [
    { nombre: 'Aventurero', url: 'https://api.dicebear.com/9.x/adventurer-neutral/svg' },
    { name: 'Robots', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg' },
    { name: 'Dylan', url: 'https://api.dicebear.com/9.x/dylan/svg' },
    { name: 'Iconos', url: 'https://api.dicebear.com/9.x/icons/svg' },
    { name: 'Pulgares', url: 'https://api.dicebear.com/9.x/thumbs/svg' },
    { name: 'Iniciales', url: 'https://api.dicebear.com/9.x/initials/svg' }
  ];

  estiloSeleccionado: string = '';
  
  isLoading = false;
  notificationMsg = '';
  isSuccess = false;

  private http = inject(HttpClient);
  private router = inject(Router);
  private location = inject(Location); 

  private apiBase = 'https://api-trebol-league.vercel.app';

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      try { 
        this.user = jwtDecode(token); 
        this.nombreInput = this.user.username;
        this.avatarPrevisualizacion = this.user.avatar;
      } catch {}
    }
  }

  seleccionarEstilo(urlEstilo: string) {
    this.estiloSeleccionado = urlEstilo;
    const seedAleatoria = Math.random().toString(36).substring(2, 12);
    this.avatarPrevisualizacion = `${urlEstilo}?seed=${seedAleatoria}`;
  }

  generarOtroRandom() {
    if (this.estiloSeleccionado) {
      this.seleccionarEstilo(this.estiloSeleccionado);
    } else {
      const baseUrl = this.avatarPrevisualizacion.split('?')[0];
      this.seleccionarEstilo(baseUrl);
    }
  }

  guardarPerfil() {
    if (!this.nombreInput || this.nombreInput.length < 3) {
      this.mostrarNotificacion('El nombre debe tener al menos 3 caracteres', false);
      return;
    }

    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const body = { username: this.nombreInput, avatar: this.avatarPrevisualizacion };

    this.http.put<any>(`${this.apiBase}/api/perfil`, body, { headers }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        this.mostrarNotificacion('¡Perfil actualizado!', true);
        this.isLoading = false;
        
        setTimeout(() => this.cancelar(), 1000);
      },
      error: (err) => {
        this.isLoading = false;
        this.mostrarNotificacion(err.error?.message || 'Error al guardar', false);
      }
    });
  }

  cancelar() {
    this.location.back(); 
  }

  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => this.notificationMsg = '', 3000);
  }
}