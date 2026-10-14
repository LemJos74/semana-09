import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PokemonDetail } from '../../interfaces/PokemonDetail';
import { PokemonListItem } from '../../interfaces/PokemonListItem';

const ARTWORK_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

@Component({
  selector: 'app-pokemon-card',
  templateUrl: './pokemon-card.html',
  styleUrl: './pokemon-card.css',
})
export class PokemonCard {
  @Input({ required: true }) item!: PokemonListItem;
  @Input() detail: PokemonDetail | null = null;
  @Output() selected = new EventEmitter<PokemonListItem>();

  get displayId(): string {
    return `#${String(this.item.id).padStart(4, '0')}`;
  }

  get sprite(): string {
    return this.detail?.sprite ?? `${ARTWORK_URL}/${this.item.id}.png`;
  }

  get displayName(): string {
    return this.item.name
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  }

  get types(): string[] {
    return this.detail ? this.detail.types.map((t) => t.name) : [];
  }

  onSelect(): void {
    this.selected.emit(this.item);
  }
}
