import { DragonballApiCharacter } from './DragonballApiCharacter';
import { DragonballApiMeta } from './DragonballApiMeta';

export interface DragonballListResponse {
  items: DragonballApiCharacter[];
  meta: DragonballApiMeta;
}
