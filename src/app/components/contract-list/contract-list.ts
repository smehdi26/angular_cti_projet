import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContractService, Contract, VisitSchedule } from '../../services/contract';
import { SectorService } from '../../services/sector';
import { Sector } from '../../services/client';
import { NotificationService } from '../../services/notification';

declare var bootstrap: any;

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './contract-list.html',
  styleUrls: ['./contract-list.css']
})
export class ContractListComponent implements OnInit, AfterViewInit {

  contracts: Contract[] = [];
  sectors: Sector[] = [];
  activeTab: string = 'directory';

  // General Filter Properties
  keyword: string = '';
  redevanceFilter: string = '';
  activeFilter: string = '';

  // Monthly Audit Properties
  selectedMonth: number = new Date().getMonth() + 1;
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

  // Scheduler Modal Properties [1.2.6]
  selectedContract: Contract | null = null;
  selectedDates: string[] = [];
  selectedFiles: string[] = [];
  selectedFileNames: string[] = [];

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

  ngAfterViewInit(): void {
    // Optional
  }

  loadContracts(): void {
    this.contractService.getContracts(this.keyword, this.redevanceFilter, this.activeFilter).subscribe({
      next: (data: Contract[]) => this.contracts = data,
      error: (err: any) => console.error(err)
    });
  }

  loadSectors(): void {
    this.sectorService.getActiveSectors().subscribe({
      next: (data: Sector[]) => this.sectors = data,
      error: (err: any) => console.error(err)
    });
  }

  loadMonthlyAudit(): void {
    this.contractService.getMonthlySchedules(this.selectedMonth, this.selectedYear).subscribe({
      next: (data: Contract[]) => this.monthlyContracts = data,
      error: (err: any) => console.error(err)
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
        error: (err: any) => console.error(err)
      });
    }
  }

  // Scheduler Modal Action Methods [1.2.1, 1.2.6]
  openScheduleModal(contract: Contract): void {
    this.selectedContract = contract;
    const visitsCount = contract.numberOfVisits || 0;

    this.selectedDates = [];
    this.selectedDates.push(contract.visitDate1 || '');
    this.selectedDates.push(contract.visitDate2 || '');
    this.selectedDates.push(contract.visitDate3 || '');
    this.selectedDates.push(contract.visitDate4 || '');
    this.selectedDates.push(contract.visitDate5 || '');
    this.selectedDates.push(contract.visitDate6 || '');

    this.selectedFiles = [];
    this.selectedFiles.push(contract.visitFile1Raw || '');
    this.selectedFiles.push(contract.visitFile2Raw || '');
    this.selectedFiles.push(contract.visitFile3Raw || '');
    this.selectedFiles.push(contract.visitFile4Raw || '');
    this.selectedFiles.push(contract.visitFile5Raw || '');
    this.selectedFiles.push(contract.visitFile6Raw || '');

    this.selectedFileNames = [];
    this.selectedFileNames.push(contract.visitFileName1 || '');
    this.selectedFileNames.push(contract.visitFileName2 || '');
    this.selectedFileNames.push(contract.visitFileName3 || '');
    this.selectedFileNames.push(contract.visitFileName4 || '');
    this.selectedFileNames.push(contract.visitFileName5 || '');
    this.selectedFileNames.push(contract.visitFileName6 || '');

    this.selectedDates = this.selectedDates.slice(0, visitsCount);
    this.selectedFiles = this.selectedFiles.slice(0, visitsCount);
    this.selectedFileNames = this.selectedFileNames.slice(0, visitsCount);

    const modalEl = document.getElementById('scheduleMonthsModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  onFileSelected(event: any, index: number): void {
    const file: File = event.target.files[0];
    if (file) {
      this.contractService.uploadFile(file).subscribe({
        next: (res) => {
          this.selectedFiles[index] = res.filePath;
          this.selectedFileNames[index] = res.fileName;
        },
        error: (err) => console.error('Upload failed', err)
      });
    }
  }

  clearVisitSlot(index: number): void {
    if (confirm(`Clear all scheduled data for Visit #${index + 1}?`)) {
      this.selectedDates[index] = '';
      this.selectedFiles[index] = '';
      this.selectedFileNames[index] = '';
    }
  }

  saveSchedule(): void {
    if (!this.selectedContract || !this.selectedContract.id) return;

    const visitsPayload: VisitSchedule[] = this.selectedDates.map((date, idx) => ({
      date: date,
      filePath: this.selectedFiles[idx] || undefined,
      fileName: this.selectedFileNames[idx] || undefined
    }));

    this.contractService.updateContractScheduleDates(this.selectedContract.id, visitsPayload).subscribe({
      next: () => {
        this.loadContracts();
        this.loadMonthlyAudit();
        this.notificationService.updateUnreadCount();
        
        const modalEl = document.getElementById('scheduleMonthsModal');
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          modal?.hide();
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  getMinDateForVisit(contract: Contract, visitIndex: number): string {
    if (!contract.dateSignature) return '';
    const signature = new Date(contract.dateSignature);
    const n = contract.numberOfVisits || 1;
    const t = 12 / n;
    const minDate = new Date(signature);
    minDate.setMonth(signature.getMonth() + (visitIndex * t));
    return minDate.toISOString().split('T')[0];
  }

  getMaxDateForVisit(contract: Contract, visitIndex: number): string {
    if (!contract.dateSignature) return '';
    const signature = new Date(contract.dateSignature);
    const n = contract.numberOfVisits || 1;
    const t = 12 / n;
    const maxDate = new Date(signature);
    maxDate.setMonth(signature.getMonth() + ((visitIndex + 1) * t));
    maxDate.setDate(maxDate.getDate() - 1);
    return maxDate.toISOString().split('T')[0];
  }

  exportMonthlyPdf(): void {
    window.print();
  }

  getPrimaryPhone(client: any): string {
    if (client && client.phones && client.phones.length > 0) {
      return client.phones[0].phoneNumber;
    }
    return '00000000';
  }

  trackByIndex(index: number): number {
    return index;
  }

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
  
  // Checks if a given visit date belongs to the currently selected month and year [1.1.4, 1.2.6]
  isDateInSelectedMonth(dateStr: string | undefined): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const m = date.getMonth() + 1; // 1-based month
    const y = date.getFullYear();
    return m === Number(this.selectedMonth) && y === Number(this.selectedYear);
  }
}