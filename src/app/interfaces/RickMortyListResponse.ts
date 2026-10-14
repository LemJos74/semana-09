import { RickMortyApiCharacter } from './RickMortyApiCharacter';
import { RickMortyApiInfo } from './RickMortyApiInfo';

export interface RickMortyListResponse {
  info: RickMortyApiInfo;
  results: RickMortyApiCharacter[];
}
