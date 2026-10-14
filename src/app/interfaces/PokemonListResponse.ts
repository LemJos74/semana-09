import { NamedApiResource } from './NamedApiResource';

export interface PokemonListResponse {
  count: number;
  results: NamedApiResource[];
}
