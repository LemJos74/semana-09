import { NamedApiResource } from './NamedApiResource';

export interface TypeDetailResponse {
  id: number;
  name: string;
  pokemon: { pokemon: NamedApiResource }[];
}
