import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, throwError } from 'rxjs';
import { DragonballApiCharacter } from '../interfaces/DragonballApiCharacter';
import { DragonballApiDetail } from '../interfaces/DragonballApiDetail';
import { DragonballCharacter } from '../interfaces/DragonballCharacter';
import { DragonballDetail } from '../interfaces/DragonballDetail';
import { DragonballListResponse } from '../interfaces/DragonballListResponse';
import { DragonballPage } from '../interfaces/DragonballPage';
import { DragonballQuery } from '../interfaces/DragonballQuery';

const API = 'https://dragonball-api.com/api';
const PAGE_SIZE = 24;

@Injectable({ providedIn: 'root' })
export class DragonballService {
  private readonly http = inject(HttpClient);
  private readonly listCache = new Map<string, Observable<DragonballPage>>();
  private readonly detailCache = new Map<number, Observable<DragonballDetail>>();

  getCharacters(query: DragonballQuery): Observable<DragonballPage> {
    const key = JSON.stringify(query);
    if (!this.listCache.has(key)) {
      const hasFilter = query.name.trim() !== '' || query.race !== '';
      let params = new HttpParams();
      if (query.name.trim()) {
        params = params.set('name', query.name.trim());
      }
      if (query.race) {
        params = params.set('race', query.race);
      }
      if (!hasFilter) {
        params = params.set('page', String(query.page)).set('limit', String(PAGE_SIZE));
      }

      let failed = false;
      const req = this.http
        .get<DragonballListResponse | DragonballApiCharacter[]>(`${API}/characters`, { params })
        .pipe(
          map((res) => toPage(res)),
          catchError((err: HttpErrorResponse) => {
            if (err.status === 404) {
              return of(EMPTY_PAGE);
            }
            failed = true;
            return throwError(() => err);
          }),
          finalize(() => {
            if (failed) {
              this.listCache.delete(key);
            }
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      this.listCache.set(key, req);
    }
    return this.listCache.get(key)!;
  }

  getDetail(id: number): Observable<DragonballDetail> {
    if (!this.detailCache.has(id)) {
      let failed = false;
      const req = this.http.get<DragonballApiDetail>(`${API}/characters/${id}`).pipe(
        map(toDetail),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return of(EMPTY_DETAIL(id));
          }
          failed = true;
          return throwError(() => err);
        }),
        finalize(() => {
          if (failed) {
            this.detailCache.delete(id);
          }
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.detailCache.set(id, req);
    }
    return this.detailCache.get(id)!;
  }
}

const EMPTY_PAGE: DragonballPage = { items: [], totalPages: 0, total: 0 };

function EMPTY_DETAIL(id: number): DragonballDetail {
  return {
    id,
    name: 'Desconocido',
    ki: '—',
    maxKi: '—',
    race: 'Unknown',
    gender: 'Unknown',
    description: '',
    image: '',
    affiliation: 'Other',
    originPlanet: null,
    transformations: [],
  };
}

/**
 * Filtered queries return a plain array without pagination; unfiltered
 * queries return `{ items, meta, links }`.
 */
function toPage(res: DragonballListResponse | DragonballApiCharacter[]): DragonballPage {
  if (Array.isArray(res)) {
    return { items: res.map(toCharacter), totalPages: 1, total: res.length };
  }
  return {
    items: res.items.map(toCharacter),
    totalPages: res.meta.totalPages,
    total: res.meta.totalItems,
  };
}

function toCharacter(raw: DragonballApiCharacter): DragonballCharacter {
  return {
    id: raw.id,
    name: raw.name,
    ki: raw.ki,
    maxKi: raw.maxKi,
    race: raw.race,
    gender: raw.gender,
    description: raw.description,
    image: raw.image,
    affiliation: raw.affiliation,
  };
}

function toDetail(raw: DragonballApiDetail): DragonballDetail {
  return {
    ...toCharacter(raw),
    originPlanet: raw.originPlanet ?? null,
    transformations: raw.transformations ?? [],
  };
}
