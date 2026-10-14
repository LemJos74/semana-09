import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiMenuItem } from '../../interfaces/ApiMenuItem';
import { SoundTheme } from '../../interfaces/SoundTheme';
import { SoundService } from '../../services/sound';

const APIS: (ApiMenuItem & { theme: SoundTheme; glyph: string; accent: string })[] = [
  {
    id: 'pokemon',
    title: 'Pokédex',
    description:
      'Busca y filtra los 1025 Pokémon por nombre, número y tipo. Detalle con stats, habilidades y arte oficial.',
    route: '/pokedex',
    tag: 'PokeAPI',
    theme: 'pokemon',
    glyph: '⚡',
    accent: 'card--pokemon',
  },
  {
    id: 'rickmorty',
    title: 'Rick and Morty',
    description:
      'Explora los 826 personajes con filtro por nombre, estado y especie. Modal con origen, ubicación y episodios.',
    route: '/rick-and-morty',
    tag: 'Rick and Morty API',
    theme: 'portal',
    glyph: '🌀',
    accent: 'card--portal',
  },
  {
    id: 'dragonball',
    title: 'Dragon Ball Z',
    description:
      'Los 58 guerreros con filtro por raza y búsqueda por nombre. Detalle con ki, planeta de origen y transformaciones.',
    route: '/dragon-ball',
    tag: 'Dragon Ball API',
    theme: 'ki',
    glyph: '💥',
    accent: 'card--ki',
  },
];

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly sound = inject(SoundService);

  readonly apis = APIS;

  onEnter(api: (typeof APIS)[number]): void {
    this.sound.enter(api.theme);
  }
}
