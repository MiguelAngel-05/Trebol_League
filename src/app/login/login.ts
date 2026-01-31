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
  
  // Variables de UI
  mostrarPassword = false;
  password: string = "";
  
  // Variables para la animación de carga y notificaciones
  isLoading = false;
  notificationMsg = '';
  isSuccess = false;

  loginForm = this.fb.nonNullable.group({
    // Nota: Normalmente el login es usuario O correo, pero respeto tu estructura
    correo: ['', [Validators.required, Validators.email]],
    usuario: ['', [Validators.required, Validators.minLength(5)]],
    contra: ['', [Validators.required]] // Login usualmente no valida patrón regex, solo que no esté vacío, pero lo dejo si lo necesitas
  });

  get correo() { return this.loginForm.get('correo'); }
  get usuario() { return this.loginForm.get('usuario'); }
  get contra() { return this.loginForm.get('contra'); }

  // He limpiado esta función. Ya no manipula el DOM manualmente.
  // La clase 'errorInput' se debe controlar en el HTML (ver abajo).
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
      this.loginForm.markAllAsTouched(); // Marca todo rojo si intentan enviar vacío
      return;
    }

    // 1. Iniciar Carga
    this.isLoading = true;
    this.loginForm.disable(); // Evita que editen mientras carga

    const data = {
      username: this.usuario?.value,
      password: this.contra?.value,
      // email: this.correo?.value // ¿Tu API pide también el correo o solo username?
    };

    this.http.post('https://api-trebol-league.vercel.app/api/login', data).subscribe({
      next: (res: any) => {
        // 2. Éxito
        this.isLoading = false;
        // this.loginForm.enable(); // No hace falta reactivar si vamos a navegar
        
        this.mostrarNotificacion('¡Sesión iniciada correctamente!', true);

        localStorage.setItem('token', res.token);
        
        // Pequeño delay para que vean el mensaje de éxito antes de cambiar de página
        setTimeout(() => {
          this.router.navigate(['/TrebolLeague/ligas']);
        }, 1000);
      },
      error: (err) => {
        // 3. Error
        console.error(err);
        this.isLoading = false;
        this.loginForm.enable(); // Reactivamos para que corrijan
        
        // Mensaje personalizado según el error (puedes ajustar esto)
        const msgError = err.error?.message || 'Usuario o contraseña incorrectos';
        this.mostrarNotificacion(msgError, false);
      }
    });
   }
   
   // Función auxiliar para el Toast
   mostrarNotificacion(mensaje: string, exito: boolean) {
     this.notificationMsg = mensaje;
     this.isSuccess = exito;
     
     // Ocultar a los 3 segundos
     setTimeout(() => {
       this.notificationMsg = '';
     }, 3000);
   }
}