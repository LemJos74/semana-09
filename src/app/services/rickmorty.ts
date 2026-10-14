import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, throwError } from 'rxjs';
import { CharacterQuery } from '../interfaces/CharacterQuery';
import { RickMortyCharacter } from '../interfaces/RickMortyCharacter';
import { RickMortyEpisode } from '../interfaces/RickMortyEpisode';
import { RickMortyListResponse } from '../interfaces/RickMortyListResponse';

const API = 'https://rickandmortyapi.com/api';

@Injectable({ providedIn: 'root' })
export class RickmortyService {
  private readonly http = inject(HttpClient);
  private readonly charactersCache = new Map<string, Observable<CharacterResult>>();
  private readonly episodeCache = new Map<number, Observable<RickMortyEpisode>>();

  getCharacters(query: CharacterQuery): Observable<CharacterResult> {
    const key = JSON.stringify(query);
    if (!this.charactersCache.has(key)) {
      let params = new HttpParams();
      if (query.name.trim()) {
        params = params.set('name', query.name.trim());
      }
      if (query.status) {
        params = params.set('status', query.status);
      }
      if (query.species.trim()) {
        params = params.set('species', query.species.trim());
      }
      if (query.page > 1) {
        params = params.set('page', String(query.page));
      }

      let failed = false;
      const req = this.http.get<RickMortyListResponse>(`${API}/character`, { params }).pipe(
        map((res) => ({
          info: res.info,
          results: res.results.map(toCharacter),
        })),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return of(EMPTY_RESULT);
          }
          failed = true;
          return throwError(() => err);
        }),
        finalize(() => {
          if (failed) {
            this.charactersCache.delete(key);
          }
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.charactersCache.set(key, req);
    }
    return this.charactersCache.get(key)!;
  }

  getEpisode(id: number): Observable<RickMortyEpisode> {
    if (!this.episodeCache.has(id)) {
      this.episodeCache.set(
        id,
        this.http.get<RickMortyEpisode>(`${API}/episode/${id}`).pipe(
          catchError(() => of(UNKNOWN_EPISODE)),
          shareReplay({ bufferSize: 1, refCount: false }),
        ),
      );
    }
    return this.episodeCache.get(id)!;
  }
}

export interface CharacterResult {
  info: { count: number; pages: number; next: string | null; prev: string | null };
  results: RickMortyCharacter[];
}

const EMPTY_RESULT: CharacterResult = {
  info: { count: 0, pages: 0, next: null, prev: null },
  results: [],
};

const UNKNOWN_EPISODE: RickMortyEpisode = {
  id: 0,
  name: 'Episodio desconocido',
  episode: '—',
  air_date: '',
};

function toCharacter(raw: RickMortyListResponse['results'][number]): RickMortyCharacter {
  const episodeCount = raw.episode.length;
  return {
    id: raw.id,
    name: raw.name,
    status: normalizeStatus(raw.status),
    species: raw.species,
    type: raw.type,
    gender: normalizeGender(raw.gender),
    origin: raw.origin.name,
    location: raw.location.name,
    image: raw.image,
    episodeCount,
    firstEpisodeUrl: raw.episode[0] ?? null,
    lastEpisodeUrl: raw.episode[episodeCount - 1] ?? null,
  };
}

function normalizeStatus(value: string): RickMortyCharacter['status'] {
  if (value === 'Alive' || value === 'Dead') {
    return value;
  }
  return 'unknown';
}

function normalizeGender(value: string): RickMortyCharacter['gender'] {
  if (value === 'Female' || value === 'Male' || value === 'Genderless') {
    return value;
  }
  return 'unknown';
}

export function episodeIdFromUrl(url: string | null): number | null {
  if (!url) {
    return null;
  }
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}
