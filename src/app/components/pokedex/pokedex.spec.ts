import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { PokemonDetail } from '../../interfaces/PokemonDetail';
import { PokemonListItem } from '../../interfaces/PokemonListItem';
import { PokeapiService } from '../../services/pokeapi';
import { SoundService } from '../../services/sound';
import { Pokedex } from './pokedex';

function makeDetail(id: number, name: string, types: string[]): PokemonDetail {
  return {
    id,
    name,
    height: 10,
    weight: 100,
    baseExperience: 100,
    sprite: null,
    types: types.map((t, i) => ({ slot: i + 1, name: t })),
    stats: [],
    abilities: [],
  };
}

class PokeapiStub {
  items: PokemonListItem[] = [
    { id: 1, name: 'bulbasaur' },
    { id: 2, name: 'ivysaur' },
    { id: 3, name: 'venusaur' },
    { id: 4, name: 'charmander' },
    { id: 5, name: 'charmeleon' },
    { id: 6, name: 'charizard' },
    { id: 7, name: 'squirtle' },
    { id: 25, name: 'pikachu' },
  ];

  getPokemonList(): Observable<PokemonListItem[]> {
    return of(this.items);
  }

  getTypes(): Observable<string[]> {
    return of(['grass', 'fire', 'water', 'electric']);
  }

  getTypeMembers(type: string): Observable<Set<number>> {
    const byType: Record<string, number[]> = {
      grass: [1, 2, 3],
      fire: [4, 5, 6],
      water: [7],
      electric: [25],
    };
    return of(new Set(byType[type] ?? []));
  }

  getDetail(id: number): Observable<PokemonDetail> {
    const item = this.items.find((p) => p.id === id);
    return of(makeDetail(id, item?.name ?? 'unknown', ['electric']));
  }
}

describe('Pokedex', () => {
  let stub: PokeapiStub;
  let sound: {
    click: ReturnType<typeof vi.fn>;
    modalOpen: ReturnType<typeof vi.fn>;
    modalClose: ReturnType<typeof vi.fn>;
    pageChange: ReturnType<typeof vi.fn>;
    chipToggle: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    stub = new PokeapiStub();
    sound = {
      click: vi.fn(),
      modalOpen: vi.fn(),
      modalClose: vi.fn(),
      pageChange: vi.fn(),
      chipToggle: vi.fn(),
      success: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [Pokedex],
      providers: [
        { provide: PokeapiService, useValue: stub },
        { provide: SoundService, useValue: sound },
      ],
    }).compileComponents();
  });

  function create(): Pokedex {
    const fixture = TestBed.createComponent(Pokedex);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('should create the component and load the list', () => {
    const component = create();
    expect(component).toBeTruthy();
    expect(component.status()).toBe('ok');
    expect(component.items().length).toBe(8);
    expect(component.types()).toContain('fire');
  });

  it('should show all items paginated (first page capped at 24)', () => {
    const component = create();
    expect(component.filtered().length).toBe(8);
    expect(component.pageItems().length).toBe(8);
    expect(component.pageCount()).toBe(1);
  });

  it('should filter by name (case-insensitive)', () => {
    const component = create();
    component.query.set('CHAR');
    expect(component.filtered().map((p) => p.name)).toEqual([
      'charmander',
      'charmeleon',
      'charizard',
    ]);
  });

  it('should filter by number', () => {
    const component = create();
    component.query.set('#25');
    expect(component.filtered().map((p) => p.id)).toEqual([25]);
  });

  it('should filter by type after loading its members', () => {
    const component = create();
    component.toggleType('fire');
    TestBed.flushEffects();
    expect(component.pendingTypes()).toEqual([]);
    expect(component.filtered().map((p) => p.id)).toEqual([4, 5, 6]);
  });

  it('should combine search and type filter', () => {
    const component = create();
    component.toggleType('grass');
    TestBed.flushEffects();
    component.query.set('saur');
    expect(component.filtered().map((p) => p.name)).toEqual(['bulbasaur', 'ivysaur', 'venusaur']);
  });

  it('should reset to page 1 when filters change', () => {
    const component = create();
    component.page.set(1);
    component.query.set('a');
    expect(component.page()).toBe(1);
  });

  it('should clear all filters', () => {
    const component = create();
    component.query.set('char');
    component.selectedTypes.set(['fire']);
    component.clearFilters();
    expect(component.query()).toBe('');
    expect(component.selectedTypes()).toEqual([]);
    expect(component.filtered().length).toBe(8);
  });

  it('should open the modal with detail on select', () => {
    const component = create();
    component.open({ id: 25, name: 'pikachu' });
    expect(component.modalDetail()?.name).toBe('pikachu');
    component.closeModal();
    expect(component.modalDetail()).toBeNull();
  });

  it('should paginate multiple pages', () => {
    stub.items = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      name: `pokemon-${i + 1}`,
    }));
    const component = create();
    expect(component.pageCount()).toBe(2);
    expect(component.pageItems().length).toBe(24);
    component.nextPage();
    TestBed.flushEffects();
    expect(component.pageItems().length).toBe(6);
    expect(component.safePage()).toBe(2);
  });

  describe('sound triggers', () => {
    it('should play modalOpen when selecting a pokemon', () => {
      const component = create();
      component.open({ id: 25, name: 'pikachu' });
      expect(sound.modalOpen).toHaveBeenCalledWith('pokemon');
    });

    it('should play modalClose when closing the modal', () => {
      const component = create();
      component.open({ id: 25, name: 'pikachu' });
      component.closeModal();
      expect(sound.modalClose).toHaveBeenCalledWith('pokemon');
    });

    it('should not play modalClose when no modal is open', () => {
      const component = create();
      component.closeModal();
      expect(sound.modalClose).not.toHaveBeenCalled();
    });

    it('should play chipToggle when toggling a type', () => {
      const component = create();
      component.toggleType('fire');
      expect(sound.chipToggle).toHaveBeenCalledWith('pokemon');
    });

    it('should play success when clearing filters', () => {
      const component = create();
      component.clearFilters();
      expect(sound.success).toHaveBeenCalledWith('pokemon');
    });

    it('should play pageChange on pagination', () => {
      stub.items = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `pokemon-${i + 1}` }));
      const component = create();
      component.nextPage();
      expect(sound.pageChange).toHaveBeenCalledWith('pokemon');
      component.prevPage();
      expect(sound.pageChange).toHaveBeenCalledTimes(2);
    });
  });
});
