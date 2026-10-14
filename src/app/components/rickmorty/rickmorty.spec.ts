import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { CharacterQuery } from '../../interfaces/CharacterQuery';
import { RickMortyCharacter } from '../../interfaces/RickMortyCharacter';
import { RickMortyEpisode } from '../../interfaces/RickMortyEpisode';
import { CharacterResult, RickmortyService } from '../../services/rickmorty';
import { SoundService } from '../../services/sound';
import { Rickmorty } from './rickmorty';

function makeCharacter(
  id: number,
  name: string,
  overrides: Partial<RickMortyCharacter> = {},
): RickMortyCharacter {
  return {
    id,
    name,
    status: 'Alive',
    species: 'Human',
    type: '',
    gender: 'Male',
    origin: 'Earth (C-137)',
    location: 'Earth (Replacement Dimension)',
    image: `https://rickandmortyapi.com/api/character/avatar/${id}.jpeg`,
    episodeCount: 3,
    firstEpisodeUrl: 'https://rickandmortyapi.com/api/episode/1',
    lastEpisodeUrl: 'https://rickandmortyapi.com/api/episode/3',
    ...overrides,
  };
}

class RickmortyServiceStub {
  readonly calls: CharacterQuery[] = [];
  pages = 1;
  totalCount = 2;
  results: RickMortyCharacter[] | null = null;

  getCharacters(query: CharacterQuery): Observable<CharacterResult> {
    this.calls.push(query);
    const results = this.results ?? [
      makeCharacter(1, 'Rick Sanchez'),
      makeCharacter(2, 'Morty Smith'),
    ];
    return of({
      info: {
        count: this.totalCount,
        pages: this.pages,
        next: this.pages > 1 ? 'next' : null,
        prev: null,
      },
      results,
    });
  }

  getEpisode(id: number): Observable<RickMortyEpisode> {
    return of({ id, name: `Episode ${id}`, episode: `S01E0${id}`, air_date: 'December 2, 2013' });
  }
}

class SoundStub {
  modalOpen = vi.fn();
  modalClose = vi.fn();
  pageChange = vi.fn();
  chipToggle = vi.fn();
  success = vi.fn();
}

describe('Rickmorty', () => {
  let stub: RickmortyServiceStub;
  let sound: SoundStub;

  beforeEach(async () => {
    vi.useFakeTimers();
    stub = new RickmortyServiceStub();
    sound = new SoundStub();
    await TestBed.configureTestingModule({
      imports: [Rickmorty],
      providers: [
        { provide: RickmortyService, useValue: stub },
        { provide: SoundService, useValue: sound },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function create(): Rickmorty {
    const fixture = TestBed.createComponent(Rickmorty);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('should create and load the first page', () => {
    const component = create();
    expect(component).toBeTruthy();
    expect(component.loadStatus()).toBe('ok');
    expect(component.characters().length).toBe(2);
    expect(component.total()).toBe(2);
    expect(stub.calls[0]).toEqual({ name: '', species: '', status: '', page: 1 });
  });

  it('should debounce text input before querying', () => {
    const component = create();
    const initialCalls = stub.calls.length;

    const input = { target: { value: 'morty' } } as unknown as Event;
    component.onNameInput(input);
    component.onNameInput(input);
    expect(stub.calls.length).toBe(initialCalls);

    vi.advanceTimersByTime(300);
    expect(stub.calls.length).toBe(initialCalls + 1);
    expect(stub.calls[stub.calls.length - 1].name).toBe('morty');
  });

  it('should query immediately when status changes', () => {
    const component = create();
    const initialCalls = stub.calls.length;

    component.setStatus('dead');

    expect(stub.calls.length).toBe(initialCalls + 1);
    expect(stub.calls[stub.calls.length - 1].status).toBe('dead');
    expect(component.page()).toBe(1);
    expect(sound.chipToggle).toHaveBeenCalledWith('portal');
    vi.advanceTimersByTime(300);
  });

  it('should not re-query when the same status is selected', () => {
    const component = create();
    component.setStatus('dead');
    const callsAfterFirst = stub.calls.length;

    component.setStatus('dead');
    expect(stub.calls.length).toBe(callsAfterFirst);
    vi.advanceTimersByTime(300);
  });

  it('should clear all filters and re-query', () => {
    const component = create();
    component.setStatus('dead');
    component.clearFilters();

    const last = stub.calls[stub.calls.length - 1];
    expect(last).toEqual({ name: '', species: '', status: '', page: 1 });
    expect(component.hasActiveFilters()).toBe(false);
    vi.advanceTimersByTime(300);
  });

  it('should paginate forward and backward with server pages', () => {
    stub.pages = 4;
    const component = create();

    component.nextPage();
    expect(component.page()).toBe(2);
    expect(stub.calls[stub.calls.length - 1].page).toBe(2);
    expect(sound.pageChange).toHaveBeenCalledWith('portal');

    component.prevPage();
    expect(component.page()).toBe(1);
    expect(stub.calls[stub.calls.length - 1].page).toBe(1);
    vi.advanceTimersByTime(300);
  });

  it('should not go below page 1 or above total pages', () => {
    stub.pages = 2;
    const component = create();

    component.prevPage();
    expect(component.page()).toBe(1);

    component.nextPage();
    component.nextPage();
    expect(component.page()).toBe(2);
    vi.advanceTimersByTime(300);
  });

  it('should open the modal with first and last episodes', () => {
    const component = create();
    const character = component.characters()[0];

    component.open(character);

    expect(component.modalCharacter()?.name).toBe('Rick Sanchez');
    expect(sound.modalOpen).toHaveBeenCalledWith('portal');
    expect(component.modalLoading()).toBe(false);
    expect(component.modalEpisodes().first?.id).toBe(1);
    expect(component.modalEpisodes().last?.id).toBe(3);
  });

  it('should close the modal with sound', () => {
    const component = create();
    component.open(component.characters()[0]);

    component.closeModal();

    expect(component.modalCharacter()).toBeNull();
    expect(sound.modalClose).toHaveBeenCalledWith('portal');
  });

  it('should show an empty result when nothing matches', () => {
    stub.results = [];
    stub.totalCount = 0;
    const component = create();
    expect(component.loadStatus()).toBe('ok');
    expect(component.characters()).toEqual([]);
    vi.advanceTimersByTime(300);
  });
});
