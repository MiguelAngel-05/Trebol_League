import { Component } from '@angular/core';
import {jwtDecode} from 'jwt-decode';

@Component({
  selector: 'app-menu',
  imports: [],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
   user: any = null;

  ngOnInit() {
    const token = localStorage.getItem('token');

    if (token) {
      this.user = jwtDecode(token);
      console.log("Usuario logueado:", this.user);
      // Resultado: { id: 1, username: "Trébol", iat: ..., exp: ... }
    }
}
}
