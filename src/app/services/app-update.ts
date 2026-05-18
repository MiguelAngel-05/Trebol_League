import { Injectable, inject, ApplicationRef } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, interval, concat } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppUpdateService {
  private swUpdate = inject(SwUpdate);
  private appRef = inject(ApplicationRef);

  init() {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY')
      )
      .subscribe(() => {
        const aceptar = confirm('Hay una nueva versión de Trebol League. ¿Quieres actualizar ahora?');

        if (aceptar) {
          window.location.reload();
        }
      });

    const appIsStable$ = this.appRef.isStable.pipe(
      filter((isStable) => isStable === true)
    );

    const cada30Min$ = interval(30 * 60 * 1000);

    concat(appIsStable$, cada30Min$).subscribe(() => {
      this.swUpdate.checkForUpdate().catch((err) => {
        console.error('Error comprobando actualizaciones', err);
      });
    });
  }
}