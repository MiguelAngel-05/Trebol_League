import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from "@angular/router"; 
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // Importante para clases dinámicas y @if

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {

  private fb = inject(FormBuilder);
  private http = inject(HttpClient); 
  private router = inject(Router);
  
  mostrarPassword = false;
  password: string = "";
  
  isLoading = false;
  notificationMsg = '';
  isSuccess = false;

  loginForm = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    usuario: ['', [Validators.required, Validators.minLength(5)]],
    contra: ['', [Validators.required]]
  });

  get correo() { return this.loginForm.get('correo'); }
  get usuario() { return this.loginForm.get('usuario'); }
  get contra() { return this.loginForm.get('contra'); }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);

    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('minlength')) {
      return 'El campo debe tener al menos 5 caracteres';
    }
    if (control?.hasError('email')) {
      return 'El correo no es válido';
    }
    if (control?.hasError('pattern')) {
      return 'La contraseña no cumple los requisitos';
    }

    return '';
  }

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // 1. Iniciar Carga
    this.isLoading = true;
    this.loginForm.disable();

    const data = {
      username: this.usuario?.value,
      password: this.contra?.value,
      email: this.correo?.value
    };

    this.http.post('https://api-trebol-league.vercel.app/api/login', data).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        this.mostrarNotificacion('¡Sesión iniciada correctamente!', true);
        localStorage.setItem('token', res.token);
        
        setTimeout(() => {
          this.router.navigate(['/TrebolLeague/ligas']);
        }, 1000);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.loginForm.enable();
        
        const msgError = err.error?.message || 'Usuario o contraseña incorrectos';
        this.mostrarNotificacion(msgError, false);
      }
    });
   }
   
   mostrarNotificacion(mensaje: string, exito: boolean) {
     this.notificationMsg = mensaje;
     this.isSuccess = exito;
     
     setTimeout(() => {
       this.notificationMsg = '';
     }, 3000);
   }
}