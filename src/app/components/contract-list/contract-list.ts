import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContractService, Contract, VisitSchedule } from '../../services/contract';
import { SectorService } from '../../services/sector';
import { Sector } from '../../services/client';
import { NotificationService } from '../../services/notification';

declare var bootstrap: any;
declare var XLSX: any; // ADDED: Declares the global SheetJS Excel variable [1.2.6]

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './contract-list.html',
  styleUrls: ['./contract-list.css']
})
export class ContractListComponent implements OnInit, AfterViewInit {

  contracts: any[] = [];
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

  // Compiles and downloads an Excel-compatible CSV file of the scheduled visit log [1.2.1, 1.2.6]
  exportMonthlyCsv(): void {
    if (this.monthlyContracts.length === 0) {
      alert('Aucune visite planifiée pour ce mois à exporter.');
      return;
    }

    // 1. Define Column Headers
    const headers = ['Client Code', 'Client Name', 'Contract Name', 'Visit Number', 'Visit Date', 'Attachment'];
    const csvRows = [headers.join(',')];

    // 2. Map and compile row data
    this.monthlyContracts.forEach(contract => {
      // Loop over the 6 potential visits [1.1.4, 1.2.6]
      const checkAndPushRow = (dateStr: string | undefined, fileName: string | undefined, visitNum: number) => {
        if (dateStr && this.isDateInSelectedMonth(dateStr)) {
          const clientCode = contract.client ? contract.client.clientCode : 'N/A';
          // Clean strings of commas to prevent cell misalignment
          const clientName = contract.client ? contract.client.name.replace(/,/g, ' ') : 'Unknown';
          const contractName = contract.name.replace(/,/g, ' ');
          const visitLabel = `Visite #${visitNum}`;
          
          // Format date as DD/MM/YYYY
          const dateObj = new Date(dateStr);
          const formattedDate = dateObj.toLocaleDateString('fr-FR');
          
          const fileLabel = fileName ? fileName.replace(/,/g, ' ') : 'None';

          const row = [clientCode, clientName, contractName, visitLabel, formattedDate, fileLabel];
          csvRows.push(row.map(val => `"${val}"`).join(',')); // Wrap values in quotes
        }
      };

      checkAndPushRow(contract.visitDate1, contract.visitFileName1, 1);
      checkAndPushRow(contract.visitDate2, contract.visitFileName2, 2);
      checkAndPushRow(contract.visitDate3, contract.visitFileName3, 3);
      checkAndPushRow(contract.visitDate4, contract.visitFileName4, 4);
      checkAndPushRow(contract.visitDate5, contract.visitFileName5, 5);
      checkAndPushRow(contract.visitDate6, contract.visitFileName6, 6);
    });

    // 3. Inject UTF-8 BOM so Excel reads French accent characters correctly [1.2.1]
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 4. Trigger browser download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const monthName = this.monthsList[this.selectedMonth - 1].name;
    link.setAttribute('download', `Suivi_Visites_Maintenance_${monthName}_${this.selectedYear}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Triggers the browser print dialog for the global contracts directory [1.2.1]
  exportAllContractsPdf(): void {
    window.print();
  }

  // Compiles and downloads an Excel-compatible CSV of all contracts in the directory [1.2.1, 1.2.6]
  exportAllContractsCsv(): void {
    if (this.contracts.length === 0) {
      alert('Aucun contrat enregistré à exporter.');
      return;
    }

    // 1. Define Column Headers
    const headers = ['Client Code', 'Client Name', 'Redevance', 'Contract Name', 'Signature Date', 'N.D.V', 'Months of Visits'];
    const csvRows = [headers.join(',')];

    // 2. Build Rows
    this.contracts.forEach(contract => {
      const clientCode = contract.client ? contract.client.clientCode : 'N/A';
      const clientName = contract.client ? contract.client.name.replace(/,/g, ' ') : 'Unknown';
      const redevance = contract.redevance;
      const contractName = contract.name.replace(/,/g, ' ');
      const signature = contract.dateSignature || '-';
      const ndv = contract.numberOfVisits || 0;
      const months = contract.monthsOfVisits ? contract.monthsOfVisits.replace(/,/g, ' ') : 'Aucun';

      const row = [clientCode, clientName, redevance, contractName, signature, ndv.toString(), months];
      csvRows.push(row.map(val => `"${val}"`).join(',')); // Wrap values in quotes to prevent spacing conflicts
    });

    // 3. Inject UTF-8 BOM so Excel opens French accent characters correctly [1.2.1]
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 4. Trigger browser download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const todayStr = this.todayDate.toISOString().split('T')[0];
    link.setAttribute('download', `Registre_Global_Contrats_Maintenance_${todayStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Generates and downloads a native Microsoft Excel (.xlsx) file of all contracts [1.2.1, 1.2.6]
  exportAllContractsXlsx(): void {
    if (this.contracts.length === 0) {
      alert('Aucun contrat enregistré à exporter.');
      return;
    }

    // 1. Prepare JSON data structure matching your directory columns
    const data = this.contracts.map(contract => ({
      'Client Code': contract.client ? contract.client.clientCode : 'N/A',
      'Client Name': contract.client ? contract.client.name : 'Unknown',
      'Redevance': contract.redevance,
      'Contract Name': contract.name,
      'Signature Date': contract.dateSignature || '-',
      'N.D.V': contract.numberOfVisits || 0,
      'Months of Visits': contract.monthsOfVisits || 'Aucun mois planifié'
    }));

    // 2. Generate worksheet and workbook [1.2.6]
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registre Contrats');

    // 3. Trigger download [1.2.6]
    const todayStr = this.todayDate.toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Registre_Global_Contrats_Maintenance_${todayStr}.xlsx`);
  }

  // Generates and downloads a native Microsoft Excel (.xlsx) file of the monthly audit [1.2.1, 1.2.6]
  exportMonthlyXlsx(): void {
    if (this.monthlyContracts.length === 0) {
      alert('Aucune visite planifiée pour ce mois à exporter.');
      return;
    }

    // 1. Prepare JSON data structure matching your monthly audit columns
    const data: any[] = [];
    this.monthlyContracts.forEach(contract => {
      const checkAndPushRow = (dateStr: string | undefined, fileName: string | undefined, visitNum: number) => {
        if (dateStr && this.isDateInSelectedMonth(dateStr)) {
          data.push({
            'Client Code': contract.client ? contract.client.clientCode : 'N/A',
            'Client Name': contract.client ? contract.client.name : 'Unknown',
            'Contract Name': contract.name,
            'Visit Number': `Visite #${visitNum}`,
            'Visit Date': new Date(dateStr).toLocaleDateString('fr-FR'),
            'Attachment Report': fileName || 'None'
          });
        }
      };

      checkAndPushRow(contract.visitDate1, contract.visitFileName1, 1);
      checkAndPushRow(contract.visitDate2, contract.visitFileName2, 2);
      checkAndPushRow(contract.visitDate3, contract.visitFileName3, 3);
      checkAndPushRow(contract.visitDate4, contract.visitFileName4, 4);
      checkAndPushRow(contract.visitDate5, contract.visitFileName5, 5);
      checkAndPushRow(contract.visitDate6, contract.visitFileName6, 6);
    });

    // 2. Generate worksheet and workbook [1.2.6]
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    const monthName = this.monthsList[this.selectedMonth - 1].name;
    XLSX.utils.book_append_sheet(workbook, worksheet, `Visites ${monthName}`);

    // 3. Trigger download [1.2.6]
    XLSX.writeFile(workbook, `Suivi_Visites_Maintenance_${monthName}_${this.selectedYear}.xlsx`);
  }

  // NEW METHOD: Helper to safely extract visit data by index (1-6)
  getVisitData(contract: any, index: number) {
    if (!contract) return {};
    return {
      date: contract[`visitDate${index}`],
      file: contract[`visitFile${index}`],
      fileRaw: contract[`visitFile${index}Raw`],
      fileName: contract[`visitFileName${index}`]
    };
  }
}