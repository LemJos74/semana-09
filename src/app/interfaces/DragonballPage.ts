import { DragonballCharacter } from './DragonballCharacter';

export interface DragonballPage {
  items: DragonballCharacter[];
  totalPages: number;
  total: number;
}
