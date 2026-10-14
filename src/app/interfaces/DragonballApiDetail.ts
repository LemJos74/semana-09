import { DragonballApiCharacter } from './DragonballApiCharacter';
import { DragonballPlanet } from './DragonballPlanet';
import { DragonballTransformation } from './DragonballTransformation';

export interface DragonballApiDetail extends DragonballApiCharacter {
  originPlanet?: DragonballPlanet;
  transformations?: DragonballTransformation[];
}
