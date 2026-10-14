import { DragonballPlanet } from './DragonballPlanet';
import { DragonballTransformation } from './DragonballTransformation';

export interface DragonballDetail {
  id: number;
  name: string;
  ki: string;
  maxKi: string;
  race: string;
  gender: string;
  description: string;
  image: string;
  affiliation: string;
  originPlanet: DragonballPlanet | null;
  transformations: DragonballTransformation[];
}
