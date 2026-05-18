import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Login } from "./login/login";
import { HttpClientModule } from '@angular/common/http';
import { PwaInstall } from './pwa-install/pwa-install';
import { AppUpdateService } from './services/app-update';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HttpClientModule, PwaInstall],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Trebol_League');

  private appUpdateService = inject(AppUpdateService);

  constructor() {
    this.appUpdateService.init();
  }
}
