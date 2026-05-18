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
  esAndroid = false;
  esStandalone = false;
  esTablet = false;
  esMobile = false;
  puedeInstalarDirecto = false;

  ngOnInit() {
    const userAgent = window.navigator.userAgent.toLowerCase();

    this.esIOS =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    this.esAndroid = /android/.test(userAgent);

    this.esTablet =
      /ipad|tablet/.test(userAgent) ||
      (this.esAndroid && !/mobile/.test(userAgent)) ||
      (window.innerWidth >= 769 && window.innerWidth <= 1180 && navigator.maxTouchPoints > 0);

    this.esMobile =
      /android|iphone|ipad|ipod/.test(userAgent) ||
      window.innerWidth <= 768 ||
      this.esTablet;

    this.esStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (this.esStandalone) {
      this.mostrarBoton = false;
      return;
    }

    /*
      Mostramos el botón siempre que la app no esté instalada.
      Si el navegador permite instalación directa, usaremos beforeinstallprompt.
      Si no, mostramos instrucciones manuales.
    */
    this.mostrarBoton = true;
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event) {
    event.preventDefault();

    this.deferredPrompt = event;
    this.puedeInstalarDirecto = true;
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
    this.puedeInstalarDirecto = false;

    if (result.outcome === 'accepted') {
      this.mostrarBoton = false;
    }
  }
}