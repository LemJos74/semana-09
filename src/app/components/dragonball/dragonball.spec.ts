import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { DragonballCharacter } from '../../interfaces/DragonballCharacter';
import { DragonballDetail } from '../../interfaces/DragonballDetail';
import { DragonballPage } from '../../interfaces/DragonballPage';
import { DragonballQuery } from '../../interfaces/DragonballQuery';
import { DragonballService } from '../../services/dragonball';
import { SoundService } from '../../services/sound';
import { Dragonball } from './dragonball';

function makeCharacter(id: number, name: string): DragonballCharacter {
  return {
    id,
    name,
    ki: '60.000.000',
    maxKi: '90 Septillion',
    race: 'Saiyan',
    gender: 'Male',
    description: 'El protagonista.',
    image: `https://dragonball-api.com/characters/${id}.webp`,
    affiliation: 'Z Fighter',
  };
}

function makeDetail(character: DragonballCharacter): DragonballDetail {
  return {
    ...character,
    originPlanet: {
      id: 1,
      name: 'Planeta Vegeta',
      isDestroyed: true,
      description: 'Origen de los Saiyan',
      image: '',
    },
    transformations: [
      { id: 1, name: 'Super Saiyan', image: 'ssj.webp', ki: '3 Million' },
      { id: 2, name: 'Super Saiyan 2', image: 'ssj2.webp', ki: '6 Million' },
    ],
  };
}

class DragonballServiceStub {
  readonly calls: DragonballQuery[] = [];
  totalPages = 1;
  totalCount = 2;
  results: DragonballCharacter[] | null = null;
  detail: DragonballDetail | null = null;
  fail = false;

  getCharacters(query: DragonballQuery): Observable<DragonballPage> {
    this.calls.push(query);
    if (this.fail) {
      return new Observable<DragonballPage>((observer) => observer.error(new Error('boom')));
    }
    return of({
      items: this.results ?? [makeCharacter(1, 'Goku'), makeCharacter(2, 'Vegeta')],
      totalPages: this.totalPages,
      total: this.totalCount,
    });
  }

  getDetail(id: number): Observable<DragonballDetail> {
    const base = this.results?.find((c) => c.id === id) ?? makeCharacter(id, 'Goku');
    return of(this.detail ?? makeDetail(base));
  }
}

class SoundStub {
  modalOpen = vi.fn();
  modalClose = vi.fn();
  pageChange = vi.fn();
  chipToggle = vi.fn();
}

describe('Dragonball', () => {
  let stub: DragonballServiceStub;
  let sound: SoundStub;

  beforeEach(async () => {
    vi.useFakeTimers();
    stub = new DragonballServiceStub();
    sound = new SoundStub();
    await TestBed.configureTestingModule({
      imports: [Dragonball],
      providers: [
        { provide: DragonballService, useValue: stub },
        { provide: SoundService, useValue: sound },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function create(): Dragonball {
    const fixture = TestBed.createComponent(Dragonball);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('should create and load the first page', () => {
    const component = create();
    expect(component).toBeTruthy();
    expect(component.loadStatus()).toBe('ok');
    expect(component.characters().length).toBe(2);
    expect(component.total()).toBe(2);
    expect(stub.calls[0]).toEqual({ name: '', race: '', page: 1 });
  });

  it('should debounce the name input before querying', () => {
    const component = create();
    const initialCalls = stub.calls.length;

    const input = { target: { value: 'gogeta' } } as unknown as Event;
    component.onNameInput(input);
    component.onNameInput(input);
    expect(stub.calls.length).toBe(initialCalls);

    vi.advanceTimersByTime(300);
    expect(stub.calls.length).toBe(initialCalls + 1);
    expect(stub.calls[stub.calls.length - 1].name).toBe('gogeta');
  });

  it('should query immediately when a race chip is toggled', () => {
    const component = create();
    const initialCalls = stub.calls.length;

    component.setRace('Saiyan');

    expect(stub.calls.length).toBe(initialCalls + 1);
    expect(stub.calls[stub.calls.length - 1].race).toBe('Saiyan');
    expect(component.page()).toBe(1);
    expect(sound.chipToggle).toHaveBeenCalledWith('ki');
    vi.advanceTimersByTime(300);
  });

  it('should not re-query when the same race is selected', () => {
    const component = create();
    component.setRace('Saiyan');
    const callsAfterFirst = stub.calls.length;

    component.setRace('Saiyan');
    expect(stub.calls.length).toBe(callsAfterFirst);
    vi.advanceTimersByTime(300);
  });

  it('should clear all filters and re-query', () => {
    const component = create();
    component.setRace('Saiyan');
    component.clearFilters();

    const last = stub.calls[stub.calls.length - 1];
    expect(last).toEqual({ name: '', race: '', page: 1 });
    expect(component.hasActiveFilters()).toBe(false);
    vi.advanceTimersByTime(300);
  });

  it('should paginate forward and backward with server pages', () => {
    stub.totalPages = 4;
    const component = create();

    component.nextPage();
    expect(component.page()).toBe(2);
    expect(stub.calls[stub.calls.length - 1].page).toBe(2);
    expect(sound.pageChange).toHaveBeenCalledWith('ki');

    component.prevPage();
    expect(component.page()).toBe(1);
    expect(stub.calls[stub.calls.length - 1].page).toBe(1);
    vi.advanceTimersByTime(300);
  });

  it('should not go below page 1 or above total pages', () => {
    stub.totalPages = 2;
    const component = create();

    component.prevPage();
    expect(component.page()).toBe(1);

    component.nextPage();
    component.nextPage();
    expect(component.page()).toBe(2);
    vi.advanceTimersByTime(300);
  });

  it('should open the modal with detail, planet and transformations', () => {
    const component = create();

    component.open(component.characters()[0]);

    expect(component.modalDetail()?.name).toBe('Goku');
    expect(component.modalDetail()?.transformations.length).toBe(2);
    expect(component.modalDetail()?.originPlanet?.name).toBe('Planeta Vegeta');
    expect(sound.modalOpen).toHaveBeenCalledWith('ki');
    expect(component.modalLoading()).toBe(false);
  });

  it('should close the modal with sound', () => {
    const component = create();
    component.open(component.characters()[0]);

    component.closeModal();

    expect(component.modalDetail()).toBeNull();
    expect(sound.modalClose).toHaveBeenCalledWith('ki');
  });

  it('should show an empty result when nothing matches', () => {
    stub.results = [];
    stub.totalCount = 0;
    const component = create();
    expect(component.loadStatus()).toBe('ok');
    expect(component.characters()).toEqual([]);
    vi.advanceTimersByTime(300);
  });

  it('should show the error state when the API fails', () => {
    stub.fail = true;
    const component = create();

    expect(component.loadStatus()).toBe('error');
    expect(component.characters()).toEqual([]);
    vi.advanceTimersByTime(300);
  });
});
