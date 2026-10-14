import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Pokedex } from './components/pokedex/pokedex';
import { Rickmorty } from './components/rickmorty/rickmorty';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'pokedex', component: Pokedex },
  { path: 'rick-and-morty', component: Rickmorty },
  { path: '**', redirectTo: '' },
];
