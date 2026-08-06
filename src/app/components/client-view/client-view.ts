import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientService, Client } from '../../services/client';
import { ContractService, Contract, VisitSchedule } from '../../services/contract';
import { ReservationService } from '../../services/reservation';
import { NotificationService } from '../../services/notification';

declare var bootstrap: any;

@Component({
  selector: 'app-client-view',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './client-view.html',
  styleUrls: ['./client-view.css']
})
export class ClientViewComponent implements OnInit {

  client!: Client;
  reservations: any[] = [];
  contracts: Contract[] = [];
  phone: string = '';
  activeTab: string = 'meetings';

  // Modal Properties
  selectedContract: Contract | null = null;
  selectedDates: string[] = []; // Direct mapping array of exact dates (YYYY-MM-DD) [1.2.6]
  selectedFiles: string[] = []; // Stores unique filePaths from server
  selectedFileNames: string[] = []; // Stores original fileNames for links [1.2.6]

  monthsList: string[] = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  constructor(
    private clientService: ClientService,
    private contractService: ContractService,
    private reservationService: ReservationService,
    private notificationService: NotificationService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.phone = this.route.snapshot.params['phone'];
    this.loadProfile();
  }

  loadProfile(): void {
    this.clientService.getClientByPhone(this.phone).subscribe({
      next: (data: Client) => {
        this.client = data;
        this.loadReservations();
        this.loadContracts();
      },
      error: (err: any) => console.error('Failed to load client details', err)
    });
  }

  loadReservations(): void {
    this.clientService.getClientReservations(this.phone).subscribe({
      next: (data: any[]) => {
        this.reservations = data;
      },
      error: (err: any) => console.error('Failed to load reservation log', err)
    });
  }

  loadContracts(): void {
    if (this.client && this.client.id) {
      this.contractService.getContractsByClient(this.client.id).subscribe({
        next: (data: Contract[]) => {
          this.contracts = data;
        },
        error: (err: any) => console.error('Failed to load contracts log', err)
      });
    }
  }

  deleteContract(id: number): void {
    if (confirm('Are you sure you want to delete/terminate this maintenance contract?')) {
      this.contractService.deleteContract(id).subscribe({
        next: () => {
          this.loadContracts();
          this.notificationService.updateUnreadCount();
        },
        error: (err: any) => console.error('Failed to delete contract', err)
      });
    }
  }

  // Handle in-profile manual status changes [1.2.6]
  updateStatus(res: any, selectElement: HTMLSelectElement): void {
    const status = selectElement.value;
    let reason = '';

    if (status === 'CANCELLED') {
      const promptVal = prompt("Enter the reason for cancelling this reservation (optional):");
      if (promptVal === null) {
        selectElement.value = res.status; // Revert selection
        return;
      }
      reason = promptVal;
    }

    this.reservationService.updateStatus(res.id, status, reason).subscribe({
      next: () => {
        this.loadReservations(); // Reload meeting log instantly [1.2.6]
        this.notificationService.updateUnreadCount(); // Update sidebar unread badge
      },
      error: (err: any) => {
        console.error('Failed to update status', err);
        selectElement.value = res.status; // Revert on failure
      }
    });
  }

  // Open Scheduler modal and initialize exact dates & files
  openScheduleModal(contract: Contract): void {
    this.selectedContract = contract;
    const visitsCount = contract.numberOfVisits || 0;

    // Load existing date values
    this.selectedDates = [];
    this.selectedDates.push(contract.visitDate1 || '');
    this.selectedDates.push(contract.visitDate2 || '');
    this.selectedDates.push(contract.visitDate3 || '');
    this.selectedDates.push(contract.visitDate4 || '');
    this.selectedDates.push(contract.visitDate5 || '');
    this.selectedDates.push(contract.visitDate6 || '');

    // Load existing file values [1.2.6]
    this.selectedFiles = [];
    this.selectedFiles.push(contract.visitFile1Raw || '');
    this.selectedFiles.push(contract.visitFile2Raw || '');
    this.selectedFiles.push(contract.visitFile3Raw || '');
    this.selectedFiles.push(contract.visitFile4Raw || '');
    this.selectedFiles.push(contract.visitFile5Raw || '');
    this.selectedFiles.push(contract.visitFile6Raw || '');

    // Load existing filename values [1.2.6]
    this.selectedFileNames = [];
    this.selectedFileNames.push(contract.visitFileName1 || '');
    this.selectedFileNames.push(contract.visitFileName2 || '');
    this.selectedFileNames.push(contract.visitFileName3 || '');
    this.selectedFileNames.push(contract.visitFileName4 || '');
    this.selectedFileNames.push(contract.visitFileName5 || '');
    this.selectedFileNames.push(contract.visitFileName6 || '');

    // Trim arrays to match exact visits count [1.2.6]
    this.selectedDates = this.selectedDates.slice(0, visitsCount);
    this.selectedFiles = this.selectedFiles.slice(0, visitsCount);
    this.selectedFileNames = this.selectedFileNames.slice(0, visitsCount);

    const modalEl = document.getElementById('scheduleMonthsModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  // Upload file asynchronously via AJAX on select [1.2.6]
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

  // Cancels / Clears a specific visit index slot entirely [1.1.3, 1.2.6]
  clearVisitSlot(index: number): void {
    if (confirm(`Clear all scheduled data for Visit #${index + 1}?`)) {
      this.selectedDates[index] = '';
      this.selectedFiles[index] = '';
      this.selectedFileNames[index] = '';
    }
  }

  saveSchedule(): void {
    if (!this.selectedContract || !this.selectedContract.id) return;

    // Map into list DTO matching backend structure [1.2.6]
    const visitsPayload: VisitSchedule[] = this.selectedDates.map((date, idx) => ({
      date: date,
      filePath: this.selectedFiles[idx] || undefined,
      fileName: this.selectedFileNames[idx] || undefined
    }));

    this.contractService.updateContractScheduleDates(this.selectedContract.id, visitsPayload).subscribe({
      next: () => {
        this.loadContracts(); // Refresh
        this.notificationService.updateUnreadCount();
        
        const modalEl = document.getElementById('scheduleMonthsModal');
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          modal?.hide();
        }
      },
      error: (err: any) => console.error('Failed to save dates', err)
    });
  }

  // Calculate the minimum allowed date for a visit interval [1.1.4, 1.2.6]
  getMinDateForVisit(contract: Contract, visitIndex: number): string {
    if (!contract.dateSignature) return '';
    const signature = new Date(contract.dateSignature);
    const n = contract.numberOfVisits || 1;
    const t = 12 / n; // Interval length in months

    const minDate = new Date(signature);
    minDate.setMonth(signature.getMonth() + (visitIndex * t));
    return minDate.toISOString().split('T')[0];
  }

  // Calculate the maximum allowed date for a visit interval [1.1.4, 1.2.6]
  getMaxDateForVisit(contract: Contract, visitIndex: number): string {
    if (!contract.dateSignature) return '';
    const signature = new Date(contract.dateSignature);
    const n = contract.numberOfVisits || 1;
    const t = 12 / n;

    const maxDate = new Date(signature);
    maxDate.setMonth(signature.getMonth() + ((visitIndex + 1) * t));
    maxDate.setDate(maxDate.getDate() - 1); // Make inclusive
    return maxDate.toISOString().split('T')[0];
  }

  // Safe helper to extract primary phone for routing
  getPrimaryPhone(client: Client | undefined): string {
    if (client && client.phones && client.phones.length > 0) {
      return client.phones[0].phoneNumber;
    }
    return '00000000';
  }

  trackByIndex(index: number): number {
    return index;
  }

  deleteReservation(id: number): void {
    if (confirm('Permanently delete this meeting/reservation?')) {
      this.reservationService.deleteReservation(id).subscribe({
        next: () => {
          this.loadReservations(); // Refresh profile meeting history instantly
          this.notificationService.updateUnreadCount();
        },
        error: (err: any) => console.error(err)
      });
    }
  }
}