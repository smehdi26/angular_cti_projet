import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Added Import for ngModel inside modal
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientService, Client } from '../../services/client';
import { ContractService, Contract } from '../../services/contract';
import { NotificationService } from '../../services/notification';

declare var bootstrap: any;

@Component({
  selector: 'app-client-view',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule], // Added FormsModule
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
  selectedMonths: string[] = []; // Array size matches contract.numberOfVisits exactly
  monthsList: string[] = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  constructor(
    private clientService: ClientService,
    private contractService: ContractService,
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

  // Open Scheduler modal and initialize the exact visit slots [1.2.1]
  openScheduleModal(contract: Contract): void {
    this.selectedContract = contract;
    
    // Parse existing months if present (e.g. "Mars, Juin" -> ["Mars", "Juin"])
    const existing = contract.monthsOfVisits ? contract.monthsOfVisits.split(', ') : [];
    const visitsCount = contract.numberOfVisits || 0;

    this.selectedMonths = [];
    for (let i = 0; i < visitsCount; i++) {
      this.selectedMonths.push(existing[i] || ''); // Fill existing or empty string
    }

    const modalEl = document.getElementById('scheduleMonthsModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  saveSchedule(): void {
    if (!this.selectedContract || !this.selectedContract.id) return;

    // Filter out empty selections to only capture the months you have filled so far
    const filledMonths = this.selectedMonths.filter(m => m && m.trim() !== '');

    // Convert only the filled selections into a clean comma-separated string
    const monthsString = filledMonths.join(', ');

    this.contractService.updateContractSchedule(this.selectedContract.id, monthsString).subscribe({
      next: () => {
        this.loadContracts(); // Refresh client-view table state instantly
        this.notificationService.updateUnreadCount();
        
        // Hide Modal programmatically
        const modalEl = document.getElementById('scheduleMonthsModal');
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          modal?.hide();
        }
      },
      error: (err: any) => console.error('Failed to update contract schedule', err)
    });
  }

  // Tracks primitive arrays safely by their index to prevent visual dropdown cloning [1.2.6]
  trackByIndex(index: number): number {
    return index;
  }
}