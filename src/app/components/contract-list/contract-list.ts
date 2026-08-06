import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContractService, Contract } from '../../services/contract';
import { SectorService } from '../../services/sector';
import { Sector } from '../../services/client';
import { NotificationService } from '../../services/notification';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './contract-list.html',
  styleUrls: ['./contract-list.css']
})
export class ContractListComponent implements OnInit {

  contracts: Contract[] = [];
  sectors: Sector[] = [];
  
  // Tab control
  activeTab: string = 'directory'; // 'directory' | 'monthly'

  // General Filter Properties
  keyword: string = '';
  redevanceFilter: string = '';
  activeFilter: string = ''; // Status state filter [1.2.6]

  // Monthly Audit Properties [1.1.4]
  selectedMonth: number = new Date().getMonth() + 1; // 1-based (1-12)
  selectedYear: number = new Date().getFullYear();
  monthlyContracts: Contract[] = [];
  todayDate: Date = new Date();

  monthsList = [
    { value: 1, name: 'Janvier' }, { value: 2, name: 'Février' },
    { value: 3, name: 'Mars' }, { value: 4, name: 'Avril' },
    { value: 5, name: 'Mai' }, { value: 6, name: 'Juin' },
    { value: 7, name: 'Juillet' }, { value: 8, name: 'Août' },
    { value: 9, name: 'Septembre' }, { value: 10, name: 'Octobre' },
    { value: 11, name: 'Novembre' }, { value: 12, name: 'Décembre' }
  ];

  yearsList = [2026, 2027, 2028, 2029, 2030];

  constructor(
    private contractService: ContractService,
    private sectorService: SectorService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadContracts();
    this.loadSectors();
    this.loadMonthlyAudit();
  }

  loadContracts(): void {
    this.contractService.getContracts(this.keyword, this.redevanceFilter, this.activeFilter).subscribe({
      next: (data: Contract[]) => {
        this.contracts = data;
      },
      error: (err: any) => console.error('Failed to load contracts directory', err)
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

  // Queries Spring Boot for active visits scheduled for the chosen month [1.1.4, 1.2.6]
  loadMonthlyAudit(): void {
    this.contractService.getMonthlySchedules(this.selectedMonth, this.selectedYear).subscribe({
      next: (data: Contract[]) => {
        this.monthlyContracts = data;
      },
      error: (err: any) => console.error('Failed to load monthly audit', err)
    });
  }

  onSearchAndFilter(): void {
    this.loadContracts();
  }

  resetFilters(): void {
    this.keyword = '';
    this.redevanceFilter = '';
    this.activeFilter = '';
    this.loadContracts();
  }

  deleteContract(id: number): void {
    if (confirm('Are you sure you want to permanently delete/terminate this maintenance contract?')) {
      this.contractService.deleteContract(id).subscribe({
        next: () => {
          this.loadContracts();
          this.loadMonthlyAudit();
          this.notificationService.updateUnreadCount();
        },
        error: (err: any) => console.error('Failed to delete contract', err)
      });
    }
  }

  exportMonthlyPdf(): void {
    window.print(); // Triggers PDF print style sheet [1.2.1]
  }

  getPrimaryPhone(client: any): string {
    if (client && client.phones && client.phones.length > 0) {
      return client.phones[0].phoneNumber;
    }
    return '00000000';
  }

  // Client-side column sorter [1.1.4]
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