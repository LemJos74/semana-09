import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DragonballDetail } from '../../interfaces/DragonballDetail';

@Component({
  selector: 'app-dbz-modal',
  templateUrl: './dbz-modal.html',
  styleUrl: './dbz-modal.css',
})
export class DbzModal {
  @Input({ required: true }) detail!: DragonballDetail;
  @Output() closed = new EventEmitter<void>();

  get displayId(): string {
    return `#${String(this.detail.id).padStart(3, '0')}`;
  }

  get hasTransformations(): boolean {
    return this.detail.transformations.length > 0;
  }

  close(): void {
    this.closed.emit();
  }
}
