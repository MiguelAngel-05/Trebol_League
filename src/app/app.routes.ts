import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Ligas } from './ligas/ligas';
import { Menu } from './menu/menu'; 
import { Mercado } from './mercado/mercado';
import { ListaJugadores } from './lista-jugadores/lista-jugadores';
import { Tienda } from './tienda/tienda';
import { authGuard } from './guards/auth.guard'; 
import { Clasificacion } from './clasificacion/clasificacion';
import { PlantillaRival } from './plantilla-rival/plantilla-rival';
import { Perfil } from './perfil/perfil';
import { CentroMensajes } from './centro-mensajes/centro-mensajes';
import { Plantilla } from './plantilla/plantilla';
import { Calendario } from './calendario/calendario';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'register', component: Register},
    { path: 'ligas', component: Ligas, canActivate: [authGuard] }, 
    { path: 'ligas/:idLiga',
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'menu', pathMatch: 'full' }, 
            { path: 'menu', component: Menu },
            { path: 'mercado', component: Mercado },
            { path: 'jugadores', component: ListaJugadores },
            { path: 'tienda', component: Tienda},
            { path: 'clasificacion', component: Clasificacion },
            { path: 'plantilla-rival/:idUsuario', component: PlantillaRival },
            { path: 'mensajes', component: CentroMensajes },
            { path: 'plantilla', component: Plantilla },
            { path: 'calendario', component: Calendario}
        ]
    },
    { path: 'perfil', component: Perfil, canActivate: [authGuard] },
    { path: '**', redirectTo: 'login', pathMatch: 'full' }
];