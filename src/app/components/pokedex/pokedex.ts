import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PokemonDetail } from '../../interfaces/PokemonDetail';
import { PokemonListItem } from '../../interfaces/PokemonListItem';
import { PokeapiService } from '../../services/pokeapi';
import { SoundService } from '../../services/sound';
import { PokemonCard } from '../pokemon-card/pokemon-card';
import { PokemonModal } from '../pokemon-modal/pokemon-modal';

const PAGE_SIZE = 24;

type LoadStatus = 'loading' | 'ok' | 'error';

@Component({
  selector: 'app-pokedex',
  imports: [PokemonCard, PokemonModal],
  templateUrl: './pokedex.html',
  styleUrl: './pokedex.css',
})
export class Pokedex {
  private readonly api = inject(PokeapiService);
  private readonly sound = inject(SoundService);

  readonly items = signal<PokemonListItem[]>([]);
  readonly types = signal<string[]>([]);
  readonly status = signal<LoadStatus>('loading');
  readonly query = signal('');
  readonly page = signal(1);
  readonly selectedTypes = signal<string[]>([]);
  readonly typeMembers = signal<Record<string, Set<number>>>({});
  readonly details = signal<Map<number, PokemonDetail>>(new Map());
  readonly modalDetail = signal<PokemonDetail | null>(null);
  readonly modalLoading = signal(false);

  readonly filtered = computed(() => {
    const rawQuery = this.query().trim().toLowerCase().replace(/^#/, '');
    let result = this.items();

    if (rawQuery) {
      const isNumeric = /^\d+$/.test(rawQuery);
      result = result.filter(
        (p) => p.name.includes(rawQuery) || (isNumeric && String(p.id).startsWith(rawQuery)),
      );
    }

    const selected = this.selectedTypes();
    if (selected.length > 0) {
      const members = this.typeMembers();
      const union = new Set<number>();
      for (const type of selected) {
        const ids = members[type];
        if (ids) {
          for (const id of ids) {
            union.add(id);
          }
        }
      }
      result = result.filter((p) => union.has(p.id));
    }

    return result;
  });

  readonly pendingTypes = computed(() =>
    this.selectedTypes().filter((t) => !(t in this.typeMembers())),
  );

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));

  readonly safePage = computed(() => Math.min(this.page(), this.pageCount()));

  readonly pageItems = computed(() => {
    const start = (this.safePage() - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  constructor() {
    this.api.getPokemonList().subscribe({
      next: (items) => {
        this.items.set(items);
        this.status.set('ok');
      },
      error: () => this.status.set('error'),
    });

    this.api.getTypes().subscribe({
      next: (types) => this.types.set(types),
      error: () => this.types.set([]),
    });

    effect((onCleanup) => {
      const members = this.typeMembers();
      const missing = this.selectedTypes().filter((t) => !(t in members));
      if (missing.length === 0) {
        return;
      }
      const subs = missing.map((type) =>
        this.api.getTypeMembers(type).subscribe({
          next: (ids) => this.typeMembers.update((m) => ({ ...m, [type]: ids })),
          error: () => this.typeMembers.update((m) => ({ ...m, [type]: new Set<number>() })),
        }),
      );
      onCleanup(() => subs.forEach((s) => s.unsubscribe()));
    });

    effect((onCleanup) => {
      const loaded = this.details();
      const missing = this.pageItems()
        .map((p) => p.id)
        .filter((id) => !loaded.has(id));
      if (missing.length === 0) {
        return;
      }
      const sub = forkJoin(missing.map((id) => this.api.getDetail(id))).subscribe((batch) =>
        this.details.update((map) => {
          const next = new Map(map);
          for (const detail of batch) {
            next.set(detail.id, detail);
          }
          return next;
        }),
      );
      onCleanup(() => sub.unsubscribe());
    });
  }

  onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  toggleType(type: string): void {
    this.selectedTypes.update((list) =>
      list.includes(type) ? list.filter((t) => t !== type) : [...list, type],
    );
    this.page.set(1);
    this.sound.chipToggle('pokemon');
  }

  isSelected(type: string): boolean {
    return this.selectedTypes().includes(type);
  }

  clearFilters(): void {
    this.query.set('');
    this.selectedTypes.set([]);
    this.page.set(1);
    this.sound.success('pokemon');
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => Math.max(1, p - 1));
      this.sound.pageChange('pokemon');
    }
  }

  nextPage(): void {
    if (this.page() < this.pageCount()) {
      this.page.update((p) => Math.min(this.pageCount(), p + 1));
      this.sound.pageChange('pokemon');
    }
  }

  open(item: PokemonListItem): void {
    const detail = this.details().get(item.id);
    this.sound.modalOpen('pokemon');
    if (detail) {
      this.modalDetail.set(detail);
      return;
    }
    this.modalLoading.set(true);
    this.api.getDetail(item.id).subscribe({
      next: (d) => {
        this.details.update((map) => {
          const next = new Map(map);
          next.set(d.id, d);
          return next;
        });
        this.modalDetail.set(d);
        this.modalLoading.set(false);
      },
      error: () => this.modalLoading.set(false),
    });
  }

  closeModal(): void {
    if (this.modalDetail()) {
      this.sound.modalClose('pokemon');
    }
    this.modalDetail.set(null);
    this.modalLoading.set(false);
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.modalDetail()) {
      this.closeModal();
    }
  }
}
