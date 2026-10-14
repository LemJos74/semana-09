import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DragonballCharacter } from '../../interfaces/DragonballCharacter';

@Component({
  selector: 'app-dbz-card',
  templateUrl: './dbz-card.html',
  styleUrl: './dbz-card.css',
})
export class DbzCard {
  @Input({ required: true }) character!: DragonballCharacter;
  @Output() selected = new EventEmitter<DragonballCharacter>();

  get displayId(): string {
    return `#${String(this.character.id).padStart(3, '0')}`;
  }

  onSelect(): void {
    this.selected.emit(this.character);
  }
}
