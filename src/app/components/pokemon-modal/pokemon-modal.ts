import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PokemonDetail } from '../../interfaces/PokemonDetail';

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'At. esp.',
  'special-defense': 'Def. esp.',
  speed: 'Velocidad',
};

const MAX_STAT = 255;

@Component({
  selector: 'app-pokemon-modal',
  templateUrl: './pokemon-modal.html',
  styleUrl: './pokemon-modal.css',
})
export class PokemonModal {
  @Input({ required: true }) detail!: PokemonDetail;
  @Output() closed = new EventEmitter<void>();

  get displayName(): string {
    return this.detail.name
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  }

  get displayId(): string {
    return `#${String(this.detail.id).padStart(4, '0')}`;
  }

  get totalStats(): number {
    return this.detail.stats.reduce((sum, s) => sum + s.baseStat, 0);
  }

  statLabel(name: string): string {
    return STAT_LABELS[name] ?? name;
  }

  statWidth(baseStat: number): number {
    return Math.min(100, (baseStat / MAX_STAT) * 100);
  }

  displayAbility(name: string): string {
    return name
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  }

  close(): void {
    this.closed.emit();
  }
}
