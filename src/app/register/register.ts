import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from "@angular/router"; 
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, RouterLinkActive, ReactiveFormsModule, AuthService],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  mostrarPassword = false;
  password: string = "";
  Reppassword: string = "";

  constructor(private auth: AuthService, private router: Router) {}

  passwordRules = [
  { label: 'Minúscula', pattern: /[a-z]/ },
  { label: 'Mayúscula', pattern: /[A-Z]/ },
  { label: 'Número', pattern: /\d/ },
  { label: 'Carácter especial (@$!%*?&)', pattern: /[@$!%*?&]/ },
  { label: 'Mínimo 8 caracteres', pattern: /.{8,}/ }
];

  registerForm = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    usuario: ['', [Validators.required, Validators.minLength(5)]],
    contra: ['', [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')]],
    correoRep: ['', [Validators.required, Validators.email]],
    contraRep: ['', [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')]]
  },
  { validators: [passwordMatchValidator, emailMatchValidator] }
  );

  get correo() {return this.registerForm.get('correo');}
  get usuario() {return this.registerForm.get('usuario');}
  get contra() {return this.registerForm.get('contra');}
  get correoRep() {return this.registerForm.get('correoRep');}
  get contraRep() {return this.registerForm.get('contraRep');}

  getErrorMessage(controlName: string): string {
    const control =  this.registerForm.get(controlName);
    if (controlName === 'correo'){
      const correoInput = document.getElementById('correoInput');
      correoInput?.classList.add('errorInput');
    } else if (controlName === 'correoCorrecto'){
      const correoInput = document.getElementById('correoInput');
      correoInput?.classList.remove('errorInput');
    }
    if (controlName === 'correoRep'){
      const correoRepInput = document.getElementById('correoRepInput');
      correoRepInput?.classList.add('errorInput');
    } else if (controlName === 'correoRepCorrecto'){
      const correoRepInput = document.getElementById('correoRepInput');
      correoRepInput?.classList.remove('errorInput');
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
    if (controlName === 'contraRep'){
      const contraRepInput = document.getElementById('contraRepInput');
      contraRepInput?.classList.add('errorInput');
    } else if (controlName === 'contraRepCorrecto'){
      const contraRepInput = document.getElementById('contraRepInput');
      contraRepInput?.classList.remove('errorInput');
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
    if (control?.hasError('emailNoCoincide')) {
      return 'Los correos no coinciden';
    }
    if (control?.hasError('contraNoCoincide')) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  onSubmit() {
    
    if (this.registerForm.invalid) return;

    const user = {
      username: this.usuario?.value,
      email: this.correo?.value,
      password: this.contra?.value
    };

    this.auth.register(user).subscribe({
      next: (res) => {
        console.log('Registrado:', res);
        this.router.navigate(['/login']);
      },
      error: (err) => console.error(err)
    });
  }
}

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