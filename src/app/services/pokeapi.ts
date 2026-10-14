import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { PokemonApiDetail } from '../interfaces/PokemonApiDetail';
import { PokemonDetail } from '../interfaces/PokemonDetail';
import { PokemonListItem } from '../interfaces/PokemonListItem';
import { PokemonListResponse } from '../interfaces/PokemonListResponse';
import { TypeDetailResponse } from '../interfaces/TypeDetailResponse';
import { TypeListResponse } from '../interfaces/TypeListResponse';

const API = 'https://pokeapi.co/api/v2';
const MAX_ID = 1025;
const EXCLUDED_TYPES = new Set(['unknown', 'shadow']);

@Injectable({ providedIn: 'root' })
export class PokeapiService {
  private readonly http = inject(HttpClient);
  private readonly listCache = new Map<string, Observable<PokemonListItem[]>>();
  private readonly typesCache = new Map<string, Observable<string[]>>();
  private readonly detailCache = new Map<number, Observable<PokemonDetail>>();
  private readonly typeMembersCache = new Map<string, Observable<Set<number>>>();

  getPokemonList(): Observable<PokemonListItem[]> {
    if (!this.listCache.has('all')) {
      this.listCache.set(
        'all',
        this.http.get<PokemonListResponse>(`${API}/pokemon?limit=${MAX_ID}`).pipe(
          map((res) =>
            res.results
              .map((r) => ({ id: idFromUrl(r.url), name: r.name }))
              .filter((p) => p.id >= 1 && p.id <= MAX_ID),
          ),
          shareReplay({ bufferSize: 1, refCount: false }),
        ),
      );
    }
    return this.listCache.get('all')!;
  }

  getTypes(): Observable<string[]> {
    if (!this.typesCache.has('all')) {
      this.typesCache.set(
        'all',
        this.http.get<TypeListResponse>(`${API}/type?limit=100`).pipe(
          map((res) => res.results.map((r) => r.name).filter((n) => !EXCLUDED_TYPES.has(n))),
          shareReplay({ bufferSize: 1, refCount: false }),
        ),
      );
    }
    return this.typesCache.get('all')!;
  }

  getDetail(id: number): Observable<PokemonDetail> {
    if (!this.detailCache.has(id)) {
      this.detailCache.set(
        id,
        this.http
          .get<PokemonApiDetail>(`${API}/pokemon/${id}`)
          .pipe(map(toDetail), shareReplay({ bufferSize: 1, refCount: false })),
      );
    }
    return this.detailCache.get(id)!;
  }

  getTypeMembers(type: string): Observable<Set<number>> {
    if (!this.typeMembersCache.has(type)) {
      this.typeMembersCache.set(
        type,
        this.http.get<TypeDetailResponse>(`${API}/type/${type}`).pipe(
          map(
            (res) =>
              new Set(
                res.pokemon
                  .map((p) => idFromUrl(p.pokemon.url))
                  .filter((id) => id >= 1 && id <= MAX_ID),
              ),
          ),
          shareReplay({ bufferSize: 1, refCount: false }),
        ),
      );
    }
    return this.typeMembersCache.get(type)!;
  }
}

function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
}

function toDetail(raw: PokemonApiDetail): PokemonDetail {
  return {
    id: raw.id,
    name: raw.name,
    height: raw.height,
    weight: raw.weight,
    baseExperience: raw.base_experience,
    sprite: raw.sprites.other?.['official-artwork']?.front_default ?? null,
    types: raw.types.map((t) => ({ slot: t.slot, name: t.type.name })),
    stats: raw.stats.map((s) => ({ name: s.stat.name, baseStat: s.base_stat })),
    abilities: raw.abilities.map((a) => ({ name: a.ability.name, isHidden: a.is_hidden })),
  };
}
