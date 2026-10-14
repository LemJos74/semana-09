import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CharacterResult, RickmortyService } from './rickmorty';

const API = 'https://rickandmortyapi.com/api/character';

function apiCharacter(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    name: 'Rick Sanchez',
    status: 'Alive',
    species: 'Human',
    type: '',
    gender: 'Male',
    origin: { name: 'Earth (C-137)', url: 'https://rickandmortyapi.com/api/location/1' },
    location: { name: 'Citadel of Ricks', url: 'https://rickandmortyapi.com/api/location/3' },
    image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
    episode: [
      'https://rickandmortyapi.com/api/episode/1',
      'https://rickandmortyapi.com/api/episode/2',
    ],
    ...overrides,
  };
}

const baseQuery = { name: '', status: '', species: '', page: 1 };

describe('RickmortyService', () => {
  let service: RickmortyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RickmortyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request characters without empty params', () => {
    let result: CharacterResult | undefined;
    service.getCharacters(baseQuery).subscribe((r) => (result = r));

    const req = httpMock.expectOne(API);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({
      info: { count: 826, pages: 42, next: 'page2', prev: null },
      results: [apiCharacter()],
    });

    expect(result?.info.count).toBe(826);
    expect(result?.results.length).toBe(1);
  });

  it('should send name, status, species and page params', () => {
    service
      .getCharacters({ name: 'morty', status: 'alive', species: 'human', page: 3 })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url === API && r.params.get('name') === 'morty');
    expect(req.request.params.get('status')).toBe('alive');
    expect(req.request.params.get('species')).toBe('human');
    expect(req.request.params.get('page')).toBe('3');
    req.flush({ info: { count: 1, pages: 1, next: null, prev: null }, results: [] });
  });

  it('should map api characters to the view model', () => {
    let results: CharacterResult | undefined;
    service.getCharacters(baseQuery).subscribe((r) => (results = r));

    const req = httpMock.expectOne(API);
    req.flush({
      info: { count: 1, pages: 1, next: null, prev: null },
      results: [apiCharacter({ status: 'unknown', gender: 'Genderless', type: 'Clone' })],
    });

    const character = results!.results[0];
    expect(character).toMatchObject({
      id: 1,
      name: 'Rick Sanchez',
      status: 'unknown',
      gender: 'Genderless',
      origin: 'Earth (C-137)',
      location: 'Citadel of Ricks',
      episodeCount: 2,
      firstEpisodeUrl: 'https://rickandmortyapi.com/api/episode/1',
      lastEpisodeUrl: 'https://rickandmortyapi.com/api/episode/2',
    });
  });

  it('should return an empty result on 404 (no matches)', () => {
    let result: CharacterResult | undefined;
    let errored = false;
    service.getCharacters({ ...baseQuery, name: 'zzzz' }).subscribe({
      next: (r) => (result = r),
      error: () => (errored = true),
    });

    const req = httpMock.expectOne((r) => r.params.get('name') === 'zzzz');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    expect(errored).toBe(false);
    expect(result?.results).toEqual([]);
    expect(result?.info.count).toBe(0);
  });

  it('should propagate non-404 errors', () => {
    let errored = false;
    service.getCharacters(baseQuery).subscribe({ error: () => (errored = true) });

    const req = httpMock.expectOne(API);
    req.flush('Server error', { status: 500, statusText: 'Server Error' });

    expect(errored).toBe(true);
  });

  it('should cache character queries', () => {
    service.getCharacters(baseQuery).subscribe();
    service.getCharacters(baseQuery).subscribe();

    const reqs = httpMock.match(API);
    expect(reqs.length).toBe(1);
    reqs[0].flush({ info: { count: 0, pages: 0, next: null, prev: null }, results: [] });
  });

  it('should fetch and cache episodes', () => {
    let episode: { id: number; name: string } | undefined;
    service.getEpisode(1).subscribe((e) => (episode = e));
    service.getEpisode(1).subscribe();

    const reqs = httpMock.match('https://rickandmortyapi.com/api/episode/1');
    expect(reqs.length).toBe(1);
    reqs[0].flush({ id: 1, name: 'Pilot', episode: 'S01E01', air_date: 'December 2, 2013' });

    expect(episode?.name).toBe('Pilot');
  });
});
