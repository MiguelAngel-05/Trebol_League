import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pwa-install.html',
  styleUrls: ['./pwa-install.css']
})
export class PwaInstall {
  private deferredPrompt: any = null;

  mostrarBoton = false;
  mostrarModal = false;
  esIOS = false;
  esStandalone = false;

  ngOnInit() {
    const userAgent = window.navigator.userAgent.toLowerCase();

    this.esIOS = /iphone|ipad|ipod/.test(userAgent);

    this.esStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    // Si ya está instalada, no mostramos nada
    if (this.esStandalone) {
      this.mostrarBoton = false;
      return;
    }

    // En iOS no existe beforeinstallprompt, así que mostramos ayuda manual
    if (this.esIOS) {
      this.mostrarBoton = true;
    }
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event) {
    event.preventDefault();
    this.deferredPrompt = event;
    this.mostrarBoton = true;
  }

  abrirAyuda() {
    if (this.deferredPrompt && !this.esIOS) {
      this.instalarApp();
      return;
    }

    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  async instalarApp() {
    if (!this.deferredPrompt) {
      this.mostrarModal = true;
      return;
    }

    this.deferredPrompt.prompt();

    const result = await this.deferredPrompt.userChoice;

    this.deferredPrompt = null;

    if (result.outcome === 'accepted') {
      this.mostrarBoton = false;
    }
  }
}