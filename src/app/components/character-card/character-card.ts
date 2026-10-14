import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RickMortyCharacter } from '../../interfaces/RickMortyCharacter';

const STATUS_LABELS: Record<string, string> = {
  Alive: 'Alive',
  Dead: 'Dead',
  unknown: 'Unknown',
};

@Component({
  selector: 'app-character-card',
  templateUrl: './character-card.html',
  styleUrl: './character-card.css',
})
export class CharacterCard {
  @Input({ required: true }) character!: RickMortyCharacter;
  @Output() selected = new EventEmitter<RickMortyCharacter>();

  get statusLabel(): string {
    return STATUS_LABELS[this.character.status] ?? this.character.status;
  }

  onSelect(): void {
    this.selected.emit(this.character);
  }
}
