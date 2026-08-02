import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClientService, Client, Sector } from '../../services/client';
import { SectorService } from '../../services/sector';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './client-list.html',
  styleUrls: ['./client-list.css']
})
export class ClientListComponent implements OnInit {

  clients: Client[] = [];
  filteredClients: Client[] = [];
  sectors: Sector[] = [];
  
  // Search & Filter Properties
  searchTerm: string = '';
  sectorFilter: string = '';
  cityFilter: string = '';

  // 24 Tunisian Governorates list [1.1.4]
  citiesList: string[] = [
    'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa',
    'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Le Kef', 'Mahdia',
    'La Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid',
    'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
  ];

  constructor(
    private clientService: ClientService,
    private sectorService: SectorService
  ) { }

  ngOnInit(): void {
    this.loadClients();
    this.loadSectors();
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (data: Client[]) => {
        this.clients = data;
        this.filteredClients = data;
        this.applyFilters();
      },
      error: (err: any) => console.error('Failed to load clients list', err)
    });
  }

  loadSectors(): void {
    this.sectorService.getActiveSectors().subscribe({
      next: (data: Sector[]) => {
        this.sectors = data;
      },
      error: (err: any) => console.error('Failed to load sectors', err)
    });
  }

  // Dual filter & keyword search [1.1.4, 1.2.6]
  applyFilters(): void {
    const term = this.searchTerm.toLowerCase().trim();
    let temp = this.clients;

    // 1. Filter by Sector
    if (this.sectorFilter) {
      temp = temp.filter(client => client.sector && client.sector.id === Number(this.sectorFilter));
    }

    // 2. Filter by City
    if (this.cityFilter) {
      temp = temp.filter(client => client.city === this.cityFilter);
    }

    // 3. Search by Keyword
    if (term) {
      temp = temp.filter(client => 
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        (client.clientCode && client.clientCode.toLowerCase().includes(term)) ||
        (client.phones && client.phones.some(p => p.phoneNumber.includes(term)))
      );
    }

    this.filteredClients = temp;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.sectorFilter = '';
    this.cityFilter = '';
    this.applyFilters();
  }

  getPrimaryPhone(client: Client): string {
    if (client.phones && client.phones.length > 0) {
      return client.phones[0].phoneNumber;
    }
    return '00000000';
  }

  deleteClient(client: Client): void {
    const phone = this.getPrimaryPhone(client);
    if (phone === '00000000') return;

    if (confirm(`Are you sure you want to permanently delete client ${client.name}?`)) {
      this.clientService.deleteClient(phone).subscribe({
        next: () => {
          this.loadClients();
        },
        error: (err: any) => console.error('Failed to delete client', err)
      });
    }
  }

  // Interactive Table Column Sorter [1.1.4]
  sort(headerEl: HTMLTableCellElement): void {
    const table = headerEl.closest('table');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody?.querySelectorAll('tr:not(.text-center)') || []);
    if (rows.length === 0) return;

    const index = Array.from(headerEl.parentNode?.children || []).indexOf(headerEl);
    const isAscending = headerEl.getAttribute('data-sort-dir') === 'asc';
    const nextDir = isAscending ? 'desc' : 'asc';
    headerEl.setAttribute('data-sort-dir', nextDir);

    table.querySelectorAll('th.sortable i').forEach(icon => {
      icon.className = 'bi bi-arrow-down-up ms-1 text-muted';
    });

    const icon = headerEl.querySelector('i');
    if (icon) {
      icon.className = nextDir === 'asc' ? 'bi bi-caret-up-fill ms-1 text-primary' : 'bi bi-caret-down-fill ms-1 text-primary';
    }

    rows.sort((rowA, rowB) => {
      const cellA = rowA.children[index].textContent?.trim() || '';
      const cellB = rowB.children[index].textContent?.trim() || '';

      if (!isNaN(Number(cellA)) && !isNaN(Number(cellB)) && cellA !== '' && cellB !== '') {
        return isAscending ? Number(cellB) - Number(cellA) : Number(cellA) - Number(cellB);
      }
      return isAscending ? cellB.localeCompare(cellA) : cellA.localeCompare(cellB);
    });

    rows.forEach(row => tbody?.appendChild(row));
  }
}