import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'; // Added FormsModule
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContractService, Contract } from '../../services/contract';
import { NotificationService } from '../../services/notification';

declare var bootstrap: any;

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink], // Added FormsModule
  templateUrl: './contract-detail.html',
  styleUrls: ['./contract-detail.css']
})
export class ContractDetailComponent implements OnInit {

  contractId!: number;
  contract!: Contract;
  editForm!: FormGroup;
  todayDate: Date = new Date();
  
  isEditing: boolean = false;
  errorMessage: string = '';

  // Added Scheduler Modal Properties [1.2.6]
  selectedDates: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private contractService: ContractService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.contractId = Number(this.route.snapshot.params['id']);

    this.editForm = this.fb.group({
      name: ['', [Validators.required]],
      redevance: ['', [Validators.required]],
      dateSignature: ['', [Validators.required]]
    });

    this.loadContract();
  }

  loadContract(): void {
    this.contractService.getContractById(this.contractId).subscribe({
      next: (data) => {
        this.contract = data;
        this.editForm.patchValue({
          name: data.name,
          redevance: data.redevance,
          dateSignature: data.dateSignature
        });
      },
      error: (err: any) => {
        console.error('Failed to load contract details', err);
        this.router.navigate(['/contracts']);
      }
    });
  }

  // Scheduler Modal Action Methods [1.2.1, 1.2.6]
  openScheduleModal(contract: Contract): void {
    const visitsCount = contract.numberOfVisits || 0;

    this.selectedDates = [];
    this.selectedDates.push(contract.visitDate1 || '');
    this.selectedDates.push(contract.visitDate2 || '');
    this.selectedDates.push(contract.visitDate3 || '');
    this.selectedDates.push(contract.visitDate4 || '');
    this.selectedDates.push(contract.visitDate5 || '');
    this.selectedDates.push(contract.visitDate6 || '');

    this.selectedDates = this.selectedDates.slice(0, visitsCount);

    const modalEl = document.getElementById('scheduleMonthsModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  saveSchedule(): void {
    const filledDates = this.selectedDates.filter(d => d && d.trim() !== '');

    this.contractService.updateContractScheduleDates(this.contractId, filledDates).subscribe({
      next: () => {
        this.loadContract(); // Refresh details page instantly
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

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  saveChanges(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const request = {
      ...this.editForm.value,
      clientId: this.contract.clientId
    };

    this.contractService.updateContract(this.contractId, request).subscribe({
      next: () => {
        this.isEditing = false;
        this.loadContract();
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to save changes.';
        console.error(err);
      }
    });
  }

  toggleStatus(): void {
    const nextStatus = this.contract.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const message = nextStatus === 'ACTIVE' ? 'Activate this contract?' : 'Suspend this contract?';

    if (confirm(message)) {
      this.contractService.toggleStatus(this.contractId, nextStatus).subscribe({
        next: () => {
          this.loadContract();
          this.notificationService.updateUnreadCount();
        },
        error: (err: any) => console.error('Status update failed', err)
      });
    }
  }

  renewContract(): void {
    if (confirm('Renew/Extend this contract signature date to another year? (This will also clear current scheduled months)')) {
      this.contractService.renewContract(this.contractId).subscribe({
        next: () => {
          this.loadContract();
          this.notificationService.updateUnreadCount();
        },
        error: (err: any) => console.error('Renewal failed', err)
      });
    }
  }

  deleteContract(): void {
    if (confirm('Permanently delete/terminate this maintenance contract?')) {
      this.notificationService.updateUnreadCount();
      this.router.navigate(['/contracts']);
    }
  }

  getNextVisit(): string {
    if (!this.contract || !this.contract.monthsOfVisits) return 'Non planifiée';
    
    const monthsList = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const currentMonthIndex = new Date().getMonth();
    const scheduled = this.contract.monthsOfVisits.split(', ');

    for (let i = 0; i < scheduled.length; i++) {
      const monthIdx = monthsList.indexOf(scheduled[i]);
      if (monthIdx >= currentMonthIndex) {
        return scheduled[i];
      }
    }
    return scheduled[0] + ' (Année Prochaine)';
  }

  exportToPdf(): void {
    window.print();
  }

  trackByIndex(index: number): number {
    return index;
  }
}