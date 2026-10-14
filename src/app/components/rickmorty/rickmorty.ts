import { Component, HostListener, computed, inject, signal } from '@angular/core';
import {
  catchError,
  forkJoin,
  merge,
  of,
  Subject,
  switchMap,
  map,
  tap,
  distinctUntilChanged,
  debounceTime,
} from 'rxjs';
import { CharacterQuery } from '../../interfaces/CharacterQuery';
import { RickMortyCharacter } from '../../interfaces/RickMortyCharacter';
import { RickMortyEpisode } from '../../interfaces/RickMortyEpisode';
import { RickmortyService, episodeIdFromUrl } from '../../services/rickmorty';
import { SoundService } from '../../services/sound';
import { CharacterCard } from '../character-card/character-card';
import { CharacterModal } from '../character-modal/character-modal';

const DEBOUNCE_MS = 300;

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'alive', label: 'Alive' },
  { value: 'dead', label: 'Dead' },
  { value: 'unknown', label: 'Unknown' },
] as const;

type LoadStatus = 'loading' | 'ok' | 'error';

@Component({
  selector: 'app-rickmorty',
  imports: [CharacterCard, CharacterModal],
  templateUrl: './rickmorty.html',
  styleUrl: './rickmorty.css',
})
export class Rickmorty {
  private readonly api = inject(RickmortyService);
  private readonly sound = inject(SoundService);

  readonly name = signal('');
  readonly species = signal('');
  readonly status = signal('');
  readonly page = signal(1);

  readonly characters = signal<RickMortyCharacter[]>([]);
  readonly totalPages = signal(0);
  readonly total = signal(0);
  readonly loadStatus = signal<LoadStatus>('loading');

  readonly modalCharacter = signal<RickMortyCharacter | null>(null);
  readonly modalEpisodes = signal<{
    first: RickMortyEpisode | null;
    last: RickMortyEpisode | null;
  }>({ first: null, last: null });
  readonly modalLoading = signal(false);

  readonly statusOptions = STATUS_OPTIONS;

  private readonly textInputs = new Subject<void>();
  private readonly refresh$ = new Subject<void>();

  constructor() {
    const trigger$ = merge(this.textInputs.pipe(debounceTime(DEBOUNCE_MS)), this.refresh$);

    trigger$
      .pipe(
        map(
          () =>
            ({
              name: this.name(),
              species: this.species(),
              status: this.status(),
              page: this.page(),
            }) satisfies CharacterQuery,
        ),
        distinctUntilChanged(
          (a, b) =>
            a.name === b.name &&
            a.species === b.species &&
            a.status === b.status &&
            a.page === b.page,
        ),
        tap(() => this.loadStatus.set('loading')),
        switchMap((query) =>
          this.api.getCharacters(query).pipe(
            map((result) => ({ ok: true as const, result })),
            catchError(() => of({ ok: false as const })),
          ),
        ),
      )
      .subscribe((outcome) => {
        if (outcome.ok) {
          this.characters.set(outcome.result.results);
          this.totalPages.set(outcome.result.info.pages);
          this.total.set(outcome.result.info.count);
          this.loadStatus.set('ok');
        } else {
          this.characters.set([]);
          this.totalPages.set(0);
          this.total.set(0);
          this.loadStatus.set('error');
        }
      });

    this.refresh$.next();
  }

  onNameInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
    this.page.set(1);
    this.textInputs.next();
  }

  onSpeciesInput(event: Event): void {
    this.species.set((event.target as HTMLInputElement).value);
    this.page.set(1);
    this.textInputs.next();
  }

  setStatus(value: string): void {
    if (this.status() === value) {
      return;
    }
    this.status.set(value);
    this.page.set(1);
    this.sound.chipToggle('portal');
    this.refresh$.next();
  }

  clearFilters(): void {
    this.name.set('');
    this.species.set('');
    this.status.set('');
    this.page.set(1);
    this.sound.chipToggle('portal');
    this.refresh$.next();
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.sound.pageChange('portal');
      this.refresh$.next();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.sound.pageChange('portal');
      this.refresh$.next();
    }
  }

  open(character: RickMortyCharacter): void {
    this.sound.modalOpen('portal');
    this.modalCharacter.set(character);
    this.modalLoading.set(true);
    this.modalEpisodes.set({ first: null, last: null });

    const firstId = episodeIdFromUrl(character.firstEpisodeUrl);
    const lastId = episodeIdFromUrl(character.lastEpisodeUrl);
    const requests: ReturnType<RickmortyService['getEpisode']>[] = [];
    if (firstId !== null) {
      requests.push(this.api.getEpisode(firstId));
    }
    if (lastId !== null && lastId !== firstId) {
      requests.push(this.api.getEpisode(lastId));
    }

    if (requests.length === 0) {
      this.modalLoading.set(false);
      return;
    }

    forkJoin(requests).subscribe({
      next: (episodes) => {
        const first = firstId !== null ? (episodes.find((e) => e.id === firstId) ?? null) : null;
        const last =
          lastId !== null && lastId !== firstId
            ? (episodes.find((e) => e.id === lastId) ?? null)
            : first;
        this.modalEpisodes.set({ first, last });
        this.modalLoading.set(false);
      },
      error: () => this.modalLoading.set(false),
    });
  }

  closeModal(): void {
    if (this.modalCharacter()) {
      this.sound.modalClose('portal');
    }
    this.modalCharacter.set(null);
    this.modalLoading.set(false);
  }

  hasActiveFilters(): boolean {
    return this.name().length > 0 || this.species().length > 0 || this.status() !== '';
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.closeModal();
  }
}
