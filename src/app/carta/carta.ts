import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // <--- IMPORTANTE: Importar esto
import { Jugador } from '../models/Jugador';

@Component({
  selector: 'app-carta',
  standalone: true, // <--- Esto habilita el modo moderno
  imports: [CommonModule], // <--- Aquí "cargamos" el *ngIf y el | number
  templateUrl: './carta.html',
  styleUrls: ['./carta.css']
})
export class CartaComponent {
  @Input() jugador!: Jugador;
}