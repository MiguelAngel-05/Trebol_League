import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Login } from "./login/login";
import { HttpClientModule } from '@angular/common/http';



@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Login, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Trebol_League');
}
