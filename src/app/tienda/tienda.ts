import { Component } from '@angular/core';
import { Jugador } from '../models/Jugador';
import { CartaComponent } from "../carta/carta";

@Component({
  selector: 'app-tienda',
  imports: [CartaComponent],
  templateUrl: './tienda.html',
  styleUrl: './tienda.css',
})
export class Tienda {

  jugadorPrueba: Jugador = {
    id_futbolista: 10,
    nombre: "Lamine Yamal",
    posicion: "DL",
    precio: 45000000,
    equipo: "FC Barcelona",
    media: 86,
    id_vendedor: 101,
    vendedor_name: "UsuarioMisterioso",
    pujado_por_mi: false,
    imagen: "https://api.dicebear.com/9.x/micah/svg?seed=Christopher",
    stats: {
      ataque: 88,
      defensa: 42,
      velocidad: 91,
      pase: 82
    }
  };

}
