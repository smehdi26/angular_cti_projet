import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SectorService } from '../../services/sector';
import { Sector } from '../../services/client';
import { NotificationService } from '../../services/notification';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit {

  sectors: Sector[] = [];
  newSectorName: string = '';
  errorMessage: string = '';

  // In-place editing properties [1.2.6]
  editingSector: Sector | null = null;
  editingName: string = '';

  constructor(
    private sectorService: SectorService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadSectors();
  }

  loadSectors(): void {
    this.sectorService.getAllSectors().subscribe({
      next: (data: Sector[]) => {
        this.sectors = data;
      },
      error: (err: any) => console.error('Failed to load sectors', err)
    });
  }

  addSector(): void {
    const name = this.newSectorName.trim();
    if (!name) return;

    const request: Sector = {
      name: name,
      active: true
    };

    this.sectorService.createSector(request).subscribe({
      next: () => {
        this.newSectorName = '';
        this.errorMessage = '';
        this.loadSectors(); // Reload list
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to create sector. Ensure the name is unique.';
        console.error(err);
      }
    });
  }

  toggleStatus(sector: Sector): void {
    if (!sector.id) return;
    const nextStatus = !sector.active;

    this.sectorService.toggleStatus(sector.id, nextStatus).subscribe({
      next: () => {
        this.loadSectors();
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => console.error('Failed to toggle sector status', err)
    });
  }

  startEdit(sector: Sector): void {
    this.editingSector = sector;
    this.editingName = sector.name;
  }

  cancelEdit(): void {
    this.editingSector = null;
    this.editingName = '';
  }

  saveEdit(): void {
    if (!this.editingSector || !this.editingSector.id) return;
    const name = this.editingName.trim();
    if (!name) return;

    const request: Sector = {
      ...this.editingSector,
      name: name
    };

    this.sectorService.updateSector(this.editingSector.id, request).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadSectors();
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to update sector name. Name must be unique.';
        console.error(err);
      }
    });
  }
}