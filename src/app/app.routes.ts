import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Ligas } from './ligas/ligas';
import { Menu } from './menu/menu'; 
import { Mercado } from './mercado/mercado';
import { ListaJugadores } from './lista-jugadores/lista-jugadores';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'register', component: Register},
    { path: 'ligas', component: Ligas },
    { path: 'ligas/:idLiga',
        children: [
            { path: '', redirectTo: 'menu', pathMatch: 'full' }, 
            { path: 'menu', component: Menu },
            { path: 'mercado', component: Mercado },
            { path: 'jugadores', component: ListaJugadores },
        ]
    },
    { path: '**', redirectTo: 'login', pathMatch: 'full' }
];