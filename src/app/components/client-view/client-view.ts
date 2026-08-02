import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientService, Client } from '../../services/client';
import { ContractService, Contract } from '../../services/contract';
import { ReservationService } from '../../services/reservation'; // Import ReservationService [1.2.1]
import { NotificationService } from '../../services/notification';

declare var bootstrap: any; // ADDED: Declares the global Bootstrap variable [1.2.6]


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
  selectedMonths: string[] = [];
  monthsList: string[] = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  constructor(
    private clientService: ClientService,
    private contractService: ContractService,
    private reservationService: ReservationService, // Inject ReservationService [1.2.1]
    private notificationService: NotificationService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.phone = this.route.snapshot.params['phone'];
    this.loadProfile();
  }

  loadProfile(): void {
    this.clientService.getClientByPhone(this.phone).subscribe({
      next: (data) => {
        this.client = data;
        this.loadReservations();
        this.loadContracts();
      },
      error: (err: any) => {
        console.error('Failed to load client details', err);
      }
    });
  }

  loadReservations(): void {
    this.clientService.getClientReservations(this.phone).subscribe({
      next: (data) => {
        this.reservations = data;
      },
      error: (err: any) => {
        console.error('Failed to load reservation log', err);
      }
    });
  }

  loadContracts(): void {
    if (this.client && this.client.id) {
      this.contractService.getContractsByClient(this.client.id).subscribe({
        next: (data) => {
          this.contracts = data;
        },
        error: (err: any) => {
          console.error('Failed to load contracts log', err);
        }
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
        error: (err: any) => {
          console.error('Failed to delete contract', err);
        }
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

  openScheduleModal(contract: Contract): void {
    this.selectedContract = contract;
    
    const existing = contract.monthsOfVisits ? contract.monthsOfVisits.split(', ') : [];
    const visitsCount = contract.numberOfVisits || 0;

    this.selectedMonths = [];
    for (let i = 0; i < visitsCount; i++) {
      this.selectedMonths.push(existing[i] || '');
    }

    const modalEl = document.getElementById('scheduleMonthsModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  // Safe helper to extract primary phone for routing
  getPrimaryPhone(client: Client): string {
    if (client && client.phones && client.phones.length > 0) {
      return client.phones[0].phoneNumber;
    }
    return '00000000';
  }
  
  saveSchedule(): void {
    if (!this.selectedContract || !this.selectedContract.id) return;

    const filledMonths = this.selectedMonths.filter(m => m && m.trim() !== '');
    const monthsString = filledMonths.join(', ');

    this.contractService.updateContractSchedule(this.selectedContract.id, monthsString).subscribe({
      next: () => {
        this.loadContracts();
        this.notificationService.updateUnreadCount();
        
        const modalEl = document.getElementById('scheduleMonthsModal');
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          modal?.hide();
        }
      },
      error: (err: any) => console.error('Failed to update contract schedule', err)
    });
  }

  trackByIndex(index: number): number {
    return index;
  }
}