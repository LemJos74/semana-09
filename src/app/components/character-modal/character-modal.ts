import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RickMortyCharacter } from '../../interfaces/RickMortyCharacter';
import { RickMortyEpisode } from '../../interfaces/RickMortyEpisode';

@Component({
  selector: 'app-character-modal',
  templateUrl: './character-modal.html',
  styleUrl: './character-modal.css',
})
export class CharacterModal {
  @Input({ required: true }) character!: RickMortyCharacter;
  @Input() firstEpisode: RickMortyEpisode | null = null;
  @Input() lastEpisode: RickMortyEpisode | null = null;
  @Output() closed = new EventEmitter<void>();

  get episodesLabel(): string {
    const count = this.character.episodeCount;
    return count === 1 ? '1 episodio' : `${count} episodios`;
  }

  get showEpisodes(): boolean {
    return this.firstEpisode !== null || this.lastEpisode !== null;
  }

  get isSameEpisode(): boolean {
    return (
      this.firstEpisode !== null &&
      this.lastEpisode !== null &&
      this.firstEpisode.id === this.lastEpisode.id
    );
  }

  close(): void {
    this.closed.emit();
  }
}
