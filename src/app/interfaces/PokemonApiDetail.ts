export interface PokemonApiDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number | null;
  types: { slot: number; type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { is_hidden: boolean; ability: { name: string } }[];
  sprites: {
    other?: {
      ['official-artwork']?: { front_default: string | null };
    };
  };
}
