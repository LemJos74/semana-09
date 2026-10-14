import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PokeapiService } from './pokeapi';

describe('PokeapiService', () => {
  let service: PokeapiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PokeapiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch the pokemon list and map id/name', () => {
    let result: { id: number; name: string }[] = [];
    service.getPokemonList().subscribe((items) => (result = items));

    const req = httpMock.expectOne((r) => r.url.includes('/pokemon?limit='));
    expect(req.request.method).toBe('GET');
    req.flush({
      count: 2,
      results: [
        { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
        { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
      ],
    });

    expect(result).toEqual([
      { id: 1, name: 'bulbasaur' },
      { id: 2, name: 'ivysaur' },
    ]);
  });

  it('should cache the pokemon list (single request)', () => {
    service.getPokemonList().subscribe();
    service.getPokemonList().subscribe();

    const reqs = httpMock.match(() => true);
    expect(reqs.length).toBe(1);
    reqs[0].flush({ count: 0, results: [] });
  });

  it('should fetch a detail and map it to PokemonDetail', () => {
    let detail: import('../interfaces/PokemonDetail').PokemonDetail | undefined;
    service.getDetail(25).subscribe((d) => (detail = d));

    const req = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/25');
    req.flush({
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      base_experience: 112,
      types: [{ slot: 1, type: { name: 'electric' } }],
      stats: [{ base_stat: 35, stat: { name: 'hp' } }],
      abilities: [{ is_hidden: false, ability: { name: 'static' } }],
      sprites: { other: { 'official-artwork': { front_default: 'art.png' } } },
    });

    expect(detail).toMatchObject({
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      baseExperience: 112,
      sprite: 'art.png',
      types: [{ slot: 1, name: 'electric' }],
      stats: [{ name: 'hp', baseStat: 35 }],
      abilities: [{ name: 'static', isHidden: false }],
    });
  });

  it('should cache details per id', () => {
    service.getDetail(1).subscribe();
    service.getDetail(1).subscribe();

    const reqs = httpMock.match('https://pokeapi.co/api/v2/pokemon/1');
    expect(reqs.length).toBe(1);
    reqs[0].flush({
      id: 1,
      name: 'bulbasaur',
      height: 7,
      weight: 69,
      base_experience: 64,
      types: [],
      stats: [],
      abilities: [],
      sprites: {},
    });
  });

  it('should fetch type members as a set of ids within the national dex', () => {
    let members: Set<number> | undefined;
    service.getTypeMembers('fire').subscribe((m) => (members = m));

    const req = httpMock.expectOne('https://pokeapi.co/api/v2/type/fire');
    req.flush({
      id: 10,
      name: 'fire',
      pokemon: [
        { pokemon: { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' } },
        { pokemon: { name: 'some-form', url: 'https://pokeapi.co/api/v2/pokemon/10091/' } },
      ],
    });

    expect(members).toBeInstanceOf(Set);
    expect(members!.has(4)).toBe(true);
    expect(members!.has(10091)).toBe(false);
  });

  it('should list playable types only (no unknown/shadow)', () => {
    let names: string[] = [];
    service.getTypes().subscribe((t) => (names = t));

    const req = httpMock.expectOne((r) => r.url.includes('/type?'));
    req.flush({
      count: 21,
      results: [
        { name: 'normal', url: 'x' },
        { name: 'fire', url: 'x' },
        { name: 'unknown', url: 'x' },
        { name: 'shadow', url: 'x' },
      ],
    });

    expect(names).toEqual(['normal', 'fire']);
  });
});
