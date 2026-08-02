import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContractService, Contract } from '../../services/contract';
import { NotificationService } from '../../services/notification';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './contract-detail.html',
  styleUrls: ['./contract-detail.css']
})
export class ContractDetailComponent implements OnInit {

  contractId!: number;
  contract!: Contract;
  editForm!: FormGroup;
  todayDate: Date = new Date(); // ADDED: Declares the current date for PDF exports [1.2.6]
  
  isEditing: boolean = false;
  errorMessage: string = '';

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
      dateSignature: ['', [Validators.required]],
      monthsOfVisits: ['']
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
          dateSignature: data.dateSignature,
          monthsOfVisits: data.monthsOfVisits
        });
      },
      error: (err: any) => {
        console.error('Failed to load contract details', err);
        this.router.navigate(['/contracts']);
      }
    });
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
      this.contractService.deleteContract(this.contractId).subscribe({
        next: () => {
          this.notificationService.updateUnreadCount();
          this.router.navigate(['/contracts']);
        },
        error: (err: any) => console.error('Deletion failed', err)
      });
    }
  }

  // Calculates the next chronological unscheduled visit based on current system date [1.1.4, 1.2.6]
  getNextVisit(): string {
    if (!this.contract || !this.contract.monthsOfVisits) return 'Non planifiée';
    
    const monthsList = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const currentMonthIndex = new Date().getMonth(); // 0-based
    const scheduled = this.contract.monthsOfVisits.split(', ');

    for (let i = 0; i < scheduled.length; i++) {
      const monthIdx = monthsList.indexOf(scheduled[i]);
      if (monthIdx >= currentMonthIndex) {
        return scheduled[i];
      }
    }
    return scheduled[0] + ' (Année Prochaine)'; // Fallback to first month of next year [1.1.4]
  }

  // Triggers official browser print dialogue configured as a clean PDF layout [1.2.1]
  exportToPdf(): void {
    window.print();
  }
}