import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Menu } from './menu/menu';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'register', component: Register},
    { path: 'TrebolLeague/menu', component: Menu },
    { path: '**', redirectTo: 'register', pathMatch: 'full' }
];
