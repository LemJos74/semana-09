import { Component, HostListener, computed, inject, signal } from '@angular/core';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { DragonballCharacter } from '../../interfaces/DragonballCharacter';
import { DragonballDetail } from '../../interfaces/DragonballDetail';
import { DragonballQuery } from '../../interfaces/DragonballQuery';
import { DragonballService } from '../../services/dragonball';
import { SoundService } from '../../services/sound';
import { DbzCard } from '../dbz-card/dbz-card';
import { DbzModal } from '../dbz-modal/dbz-modal';

const DEBOUNCE_MS = 300;

const RACES = [
  '',
  'Saiyan',
  'Human',
  'Namekian',
  'Majin',
  'Frieza Race',
  'Android',
  'Jiren Race',
  'God',
  'Angel',
  'Evil',
] as const;

type LoadStatus = 'loading' | 'ok' | 'error';

@Component({
  selector: 'app-dragonball',
  imports: [DbzCard, DbzModal],
  templateUrl: './dragonball.html',
  styleUrl: './dragonball.css',
})
export class Dragonball {
  private readonly api = inject(DragonballService);
  private readonly sound = inject(SoundService);

  readonly name = signal('');
  readonly race = signal('');
  readonly page = signal(1);

  readonly characters = signal<DragonballCharacter[]>([]);
  readonly totalPages = signal(0);
  readonly total = signal(0);
  readonly loadStatus = signal<LoadStatus>('loading');

  readonly modalDetail = signal<DragonballDetail | null>(null);
  readonly modalLoading = signal(false);

  readonly races = RACES;

  readonly hasActiveFilters = computed(() => this.name().trim() !== '' || this.race() !== '');

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
              race: this.race(),
              page: this.page(),
            }) satisfies DragonballQuery,
        ),
        distinctUntilChanged((a, b) => a.name === b.name && a.race === b.race && a.page === b.page),
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
          this.characters.set(outcome.result.items);
          this.totalPages.set(outcome.result.totalPages);
          this.total.set(outcome.result.total);
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

  setRace(value: string): void {
    if (this.race() === value) {
      return;
    }
    this.race.set(value);
    this.page.set(1);
    this.sound.chipToggle('ki');
    this.refresh$.next();
  }

  clearFilters(): void {
    this.name.set('');
    this.race.set('');
    this.page.set(1);
    this.sound.chipToggle('ki');
    this.refresh$.next();
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.sound.pageChange('ki');
      this.refresh$.next();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.sound.pageChange('ki');
      this.refresh$.next();
    }
  }

  open(character: DragonballCharacter): void {
    this.sound.modalOpen('ki');
    this.modalLoading.set(true);
    this.modalDetail.set(null);

    this.api.getDetail(character.id).subscribe({
      next: (detail) => {
        this.modalDetail.set(detail);
        this.modalLoading.set(false);
      },
      error: () => {
        this.modalLoading.set(false);
        this.sound.modalClose('ki');
      },
    });
  }

  closeModal(): void {
    if (this.modalDetail()) {
      this.sound.modalClose('ki');
    }
    this.modalDetail.set(null);
    this.modalLoading.set(false);
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.closeModal();
  }
}
