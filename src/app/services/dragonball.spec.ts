import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DragonballDetail } from '../interfaces/DragonballDetail';
import { DragonballPage } from '../interfaces/DragonballPage';
import { DragonballService } from './dragonball';

const API = 'https://dragonball-api.com/api/characters';

function apiCharacter(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    name: 'Goku',
    ki: '60.000.000',
    maxKi: '90 Septillion',
    race: 'Saiyan',
    gender: 'Male',
    description: 'El protagonista de la serie.',
    image: 'https://dragonball-api.com/characters/goku_normal.webp',
    affiliation: 'Z Fighter',
    deletedAt: null,
    ...overrides,
  };
}

const baseQuery = { name: '', race: '', page: 1 };

describe('DragonballService', () => {
  let service: DragonballService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DragonballService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request the paginated list with page and limit', () => {
    let result: DragonballPage | undefined;
    service.getCharacters(baseQuery).subscribe((r) => (result = r));

    const req = httpMock.expectOne(
      (r) => r.url === API && r.params.get('page') === '1' && r.params.get('limit') === '24',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      items: [apiCharacter()],
      meta: { totalItems: 58, itemCount: 24, itemsPerPage: 24, totalPages: 3, currentPage: 1 },
    });

    expect(result?.items.length).toBe(1);
    expect(result?.totalPages).toBe(3);
    expect(result?.total).toBe(58);
  });

  it('should send name and race filters without pagination params', () => {
    service.getCharacters({ name: 'vegeta', race: 'Saiyan', page: 2 }).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === API && r.params.get('name') === 'vegeta' && r.params.get('race') === 'Saiyan',
    );
    expect(req.request.params.get('page')).toBeNull();
    expect(req.request.params.get('limit')).toBeNull();
    req.flush([apiCharacter({ name: 'Vegeta' })]);
  });

  it('should map a plain filtered array response to a single page', () => {
    let result: DragonballPage | undefined;
    service.getCharacters({ name: '', race: 'Saiyan', page: 1 }).subscribe((r) => (result = r));

    const req = httpMock.expectOne((r) => r.params.get('race') === 'Saiyan');
    req.flush([apiCharacter(), apiCharacter({ id: 2, name: 'Vegeta' })]);

    expect(result?.items.length).toBe(2);
    expect(result?.totalPages).toBe(1);
    expect(result?.total).toBe(2);
  });

  it('should return an empty page on 404 (no matches)', () => {
    let result: DragonballPage | undefined;
    let errored = false;
    service.getCharacters({ name: 'zzzz', race: '', page: 1 }).subscribe({
      next: (r) => (result = r),
      error: () => (errored = true),
    });

    const req = httpMock.expectOne((r) => r.params.get('name') === 'zzzz');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    expect(errored).toBe(false);
    expect(result?.items).toEqual([]);
    expect(result?.total).toBe(0);
  });

  it('should propagate non-404 errors and not cache them', () => {
    let errored = false;
    service.getCharacters(baseQuery).subscribe({ error: () => (errored = true) });
    httpMock
      .expectOne((r) => r.url === API && r.params.get('page') === '1')
      .flush('Server error', { status: 500, statusText: 'Server Error' });
    expect(errored).toBe(true);

    service.getCharacters(baseQuery).subscribe({ error: () => (errored = true) });
    httpMock
      .expectOne((r) => r.url === API && r.params.get('page') === '1')
      .flush('Server error', { status: 500, statusText: 'Server Error' });
  });

  it('should cache list queries', () => {
    service.getCharacters(baseQuery).subscribe();
    service.getCharacters(baseQuery).subscribe();

    const reqs = httpMock.match((r) => r.url === API);
    expect(reqs.length).toBe(1);
    reqs[0].flush({
      items: [],
      meta: { totalItems: 0, itemCount: 0, itemsPerPage: 24, totalPages: 0, currentPage: 1 },
    });
  });

  it('should fetch the detail with planet and transformations', () => {
    let detail: DragonballDetail | undefined;
    service.getDetail(1).subscribe((d) => (detail = d));

    const req = httpMock.expectOne(`${API}/1`);
    req.flush({
      ...apiCharacter(),
      originPlanet: {
        id: 1,
        name: 'Planeta Vegeta',
        isDestroyed: true,
        description: '',
        image: '',
      },
      transformations: [{ id: 1, name: 'Super Saiyan', image: 'x.webp', ki: '3 Million' }],
    });

    expect(detail?.originPlanet?.name).toBe('Planeta Vegeta');
    expect(detail?.originPlanet?.isDestroyed).toBe(true);
    expect(detail?.transformations.length).toBe(1);
    expect(detail?.transformations[0].ki).toBe('3 Million');
  });

  it('should default planet and transformations when missing', () => {
    let detail: DragonballDetail | undefined;
    service.getDetail(7).subscribe((d) => (detail = d));

    httpMock.expectOne(`${API}/7`).flush(apiCharacter());

    expect(detail?.originPlanet).toBeNull();
    expect(detail?.transformations).toEqual([]);
  });

  it('should cache detail queries', () => {
    service.getDetail(3).subscribe();
    service.getDetail(3).subscribe();

    const reqs = httpMock.match(`${API}/3`);
    expect(reqs.length).toBe(1);
    reqs[0].flush(apiCharacter({ id: 3 }));
  });
});
