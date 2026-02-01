import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from "@angular/router"; 
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, ReactiveFormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  // Variables UI
  mostrarPassword = false;
  
  // Variables Estado (Carga y Toast)
  isLoading = false;
  notificationMsg = '';
  isSuccess = false;

  passwordRules = [
    { label: 'Minúscula', pattern: /[a-z]/ },
    { label: 'Mayúscula', pattern: /[A-Z]/ },
    { label: 'Número', pattern: /\d/ },
    { label: 'Símbolo (@$!%*?&)', pattern: /[@$!%*?&]/ },
    { label: 'Mín. 8 caracteres', pattern: /.{8,}/ }
  ];

  registerForm = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    usuario: ['', [Validators.required, Validators.minLength(5)]],
    contra: ['', [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')]],
    correoRep: ['', [Validators.required, Validators.email]],
    contraRep: ['', [Validators.required]]
  },
  { validators: [passwordMatchValidator, emailMatchValidator] }
  );

  // Getters para usar en el HTML
  get correo() { return this.registerForm.get('correo'); }
  get usuario() { return this.registerForm.get('usuario'); }
  get contra() { return this.registerForm.get('contra'); }
  get correoRep() { return this.registerForm.get('correoRep'); }
  get contraRep() { return this.registerForm.get('contraRep'); }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);

    if (control?.hasError('required')) return 'Campo obligatorio';
    if (control?.hasError('minlength')) return 'Mínimo 5 caracteres';
    if (control?.hasError('email')) return 'Correo no válido';
    if (control?.hasError('pattern')) return 'Contraseña no segura';
    
    return '';
  }

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
        this.registerForm.markAllAsTouched();
        return;
    }

    // 1. Activar carga
    this.isLoading = true;
    this.registerForm.disable();

    const user = {
      username: this.usuario?.value,
      email: this.correo?.value,
      password: this.contra?.value
    };

    this.http.post('https://api-trebol-league.vercel.app/api/register', user).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.mostrarNotificacion('¡Registro completado! Redirigiendo...', true);
        
        setTimeout(() => {
            this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.registerForm.enable();
        
        const msg = err.error?.message || 'Error al registrar usuario';
        this.mostrarNotificacion(msg, false);
      }
    });
  }

  mostrarNotificacion(mensaje: string, exito: boolean) {
    this.notificationMsg = mensaje;
    this.isSuccess = exito;
    setTimeout(() => {
      this.notificationMsg = '';
    }, 4000);
  }
}

// Validadores personalizados
export function passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
  const pass = form.get('contra')?.value;
  const rep = form.get('contraRep')?.value;
  return (pass && rep && pass !== rep) ? { noCoincide: true } : null;
}

export function emailMatchValidator(form: AbstractControl): ValidationErrors | null {
  const email = form.get('correo')?.value;
  const rep = form.get('correoRep')?.value;
  return (email && rep && email !== rep) ? { correoNoCoincide: true } : null;
}