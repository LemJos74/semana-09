import { PokemonAbility } from './PokemonAbility';
import { PokemonStat } from './PokemonStat';
import { PokemonTypeSlot } from './PokemonTypeSlot';

export interface PokemonDetail {
  id: number;
  name: string;
  types: PokemonTypeSlot[];
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  height: number;
  weight: number;
  baseExperience: number | null;
  sprite: string | null;
}
