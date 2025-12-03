import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from "@angular/router"; 

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  mostrarPassword = false;
  password: string = "";
  Reppassword: string = "";

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }
}
