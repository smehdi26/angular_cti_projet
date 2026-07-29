import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContractService, Contract } from '../../services/contract';
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
  keyword: string = '';
  redevanceFilter: string = '';

  constructor(
    private contractService: ContractService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.contractService.getContracts(this.keyword, this.redevanceFilter).subscribe({
      next: (data: Contract[]) => {
        this.contracts = data;
      },
      error: (err: any) => {
        console.error('Failed to load contracts directory', err);
      }
    });
  }

  onSearchAndFilter(): void {
    this.loadContracts();
  }

  // Safe helper to extract primary phone for routing
  getPrimaryPhone(client: any): string {
    if (client && client.phones && client.phones.length > 0) {
      return client.phones[0].phoneNumber;
    }
    return '00000000';
  }

  deleteContract(id: number): void {
    if (confirm('Are you sure you want to permanently delete/terminate this maintenance contract?')) {
      this.contractService.deleteContract(id).subscribe({
        next: () => {
          this.loadContracts(); // Reload list
          this.notificationService.updateUnreadCount();
        },
        error: (err: any) => {
          console.error('Failed to delete contract', err);
        }
      });
    }
  }

  // Interactive Table Sorter [1.1.4]
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

    // Reset icons
    table.querySelectorAll('th.sortable i').forEach(icon => {
      icon.className = 'bi bi-arrow-down-up ms-1 text-muted';
    });

    // Update active icon
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