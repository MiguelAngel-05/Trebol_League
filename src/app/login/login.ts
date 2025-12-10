import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from "@angular/router"; 
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, RouterLinkActive, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {

  private fb = inject(FormBuilder);
  private http = inject(HttpClient); 
  private router = inject(Router);
  mostrarPassword = false;
  password: string = "";

  loginForm = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    usuario: ['', [Validators.required, Validators.minLength(5)]],
    contra: ['', [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')]]
  });

  get correo() {return this.loginForm.get('correo');}
  get usuario() {return this.loginForm.get('usuario');}
  get contra() {return this.loginForm.get('contra');}

  getErrorMessage(controlName: string): string {
    const control =  this.loginForm.get(controlName);
    if (controlName === 'correo'){
      const correoInput = document.getElementById('correoInput');
      correoInput?.classList.add('errorInput');
    } else if (controlName === 'correoCorrecto'){
      const correoInput = document.getElementById('correoInput');
      correoInput?.classList.remove('errorInput');
    }
    if (controlName === 'usuario'){
      const usuarioInput = document.getElementById('usuarioInput');
      usuarioInput?.classList.add('errorInput');
    } else if (controlName === 'usuarioCorrecto'){
      const usuarioInput = document.getElementById('usuarioInput');
      usuarioInput?.classList.remove('errorInput');
    }
    if (controlName === 'contra'){
      const contraInput = document.getElementById('contraInput');
      contraInput?.classList.add('errorInput');
    } else if (controlName === 'contraCorrecto'){
      const contraInput = document.getElementById('contraInput');
      contraInput?.classList.remove('errorInput');
    }

    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('minlength')) {
      return 'El campo debe tener al menos 5 caracteres';
    }
    if (control?.hasError('email')) {
      return 'El correo no es valido';
    }
    if (control?.hasError('pattern')) {
      return 'La contraseña no es valida';
    }

    return '';
  }

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

   onSubmit() {
    if (this.loginForm.invalid) return;

    const data = {
      username: this.usuario?.value,
      password: this.contra?.value
    };

    this.http.post('https://api-trebol-league.vercel.app/api/login', data).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        this.router.navigate(['/TrebolLeague/menu']);
      },
      error: (err) => console.error(err)
    });
   }  
}
