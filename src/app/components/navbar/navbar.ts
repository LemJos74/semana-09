import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SoundService } from '../../services/sound';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected readonly sound = inject(SoundService);

  readonly links = [
    { path: '/', label: 'Inicio', exact: true },
    { path: '/pokedex', label: 'Pokémon', exact: false },
    { path: '/rick-and-morty', label: 'Rick and Morty', exact: false },
    { path: '/dragon-ball', label: 'Dragon Ball Z', exact: false },
  ];

  onToggleSound(): void {
    this.sound.toggle();
  }
}
