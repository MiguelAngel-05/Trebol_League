import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decoded: any = jwtDecode(token);

    // Si el token tiene fecha de expiración, comprobamos si ha caducado
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      router.navigate(['/login']);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Token inválido o corrupto', error);
    localStorage.removeItem('token');
    router.navigate(['/login']);
    return false;
  }
};