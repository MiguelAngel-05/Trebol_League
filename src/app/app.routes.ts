import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Ligas } from './ligas/ligas';
import { Menu } from './menu/menu';
import { Mercado } from './mercado/mercado';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'register', component: Register},
    { path: 'TrebolLeague/ligas', component: Ligas },
    { path: 'TrebolLeague/menu', component: Menu },
    { path: 'TrebolLeague/mercado', component: Mercado },
    { path: '**', redirectTo: 'register', pathMatch: 'full' }
];
