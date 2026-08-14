import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContractService, Contract } from '../../services/contract';
import { NotificationService } from '../../services/notification';

declare var bootstrap: any;

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './contract-detail.html',
  styleUrls: ['./contract-detail.css']
})
export class ContractDetailComponent implements OnInit {

  contractId!: number;
  contract!: any; // Use any to allow dynamic property access (visitDate1, etc.)
  editForm!: FormGroup;
  visitForm!: FormGroup;
  todayDate: Date = new Date();
  
  isEditing: boolean = false;
  errorMessage: string = '';

  // Properties for the individual Visit Validation Pop-up
  selectedVisitIndex: number = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private contractService: ContractService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.contractId = Number(this.route.snapshot.params['id']);

    // General Contract metadata form
    this.editForm = this.fb.group({
      name: ['', [Validators.required]],
      redevance: ['', [Validators.required]],
      dateSignature: ['', [Validators.required]]
    });

    // Individual Visit Validation form
    this.visitForm = this.fb.group({
      date: ['', [Validators.required]],
      observations: [''],
      filePath: [''],
      fileName: ['']
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

  /**
   * TDD Requirement: Sequential Control Logic
   * Logic: Visit N is accessible ONLY if N=1 OR Visit N-1 is validated (has a date).
   */
  canAccessVisit(index: number): boolean {
    if (index === 1) return true;
    const previousVisitData = this.getVisitDataByIndex(index - 1);
    return !!previousVisitData.date; // Accessible if previous has a date
  }

  /**
   * Utility to extract flat fields from the Contract object dynamically
   */
  getVisitDataByIndex(index: number) {
    if (!this.contract) return {};
    return {
      date: this.contract[`visitDate${index}`],
      obs: this.contract[`visitObs${index}`],
      user: this.contract[`visitUser${index}`],
      file: this.contract[`visitFile${index}`],
      fileName: this.contract[`visitFileName${index}`],
      fileRaw: this.contract[`visitFile${index}Raw`]
    };
  }

  /**
   * Action: Opens the pop-up for a specific visit index
   */
  openVisitModal(index: number): void {
    this.selectedVisitIndex = index;
    const data = this.getVisitDataByIndex(index);

    // Populate form with existing data (for "See" or "Update" capability)
    this.visitForm.reset({
      date: data.date || '',
      observations: data.obs || '',
      filePath: data.fileRaw || '',
      fileName: data.fileName || ''
    });

    const modalEl = document.getElementById('visitModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  /**
   * Action: Handles file upload for the specific visit form
   */
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.contractService.uploadFile(file).subscribe({
        next: (res) => {
          this.visitForm.patchValue({
            filePath: res.filePath,
            fileName: res.fileName
          });
        },
        error: (err) => console.error('Upload failed', err)
      });
    }
  }

  /**
   * Action: Submit validation for the single visit
   */
  saveVisitValidation(): void {
    if (this.visitForm.invalid) {
      this.visitForm.markAllAsTouched();
      return;
    }

    const payload = {
      visitIndex: this.selectedVisitIndex,
      ...this.visitForm.value
    };

    this.contractService.validateVisit(this.contractId, payload).subscribe({
      next: () => {
        this.loadContract(); // Refresh details instantly
        this.notificationService.updateUnreadCount();
        const modalEl = document.getElementById('visitModal');
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          modal?.hide();
        }
      },
      error: (err: any) => {
        alert(err.error?.message || "Error validating visit");
      }
    });
  }

  /**
   * Action: Delete specific visit data
   */
  deleteVisitData(): void {
    if (confirm(`Voulez-vous vraiment supprimer toutes les données de la visite #${this.selectedVisitIndex} ?`)) {
      this.contractService.deleteVisitData(this.contractId, this.selectedVisitIndex).subscribe({
        next: () => {
          this.loadContract();
          const modalEl = document.getElementById('visitModal');
          if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal?.hide();
          }
        }
      });
    }
  }

  // --- GENERAL CONTRACT HELPERS ---

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  saveChanges(): void {
    if (this.editForm.invalid) return;
    const request = { ...this.editForm.value, clientId: this.contract.clientId };
    this.contractService.updateContract(this.contractId, request).subscribe({
      next: () => { this.isEditing = false; this.loadContract(); }
    });
  }

  toggleStatus(): void {
    const nextStatus = this.contract.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    this.contractService.toggleStatus(this.contractId, nextStatus).subscribe(() => this.loadContract());
  }

  renewContract(): void {
    if (confirm('Renew this contract? Current visit slots will be archived to history.')) {
      this.contractService.renewContract(this.contractId).subscribe(() => this.loadContract());
    }
  }

  exportToPdf(): void { window.print(); }

  getNextVisit(): string {
    if (!this.contract || !this.contract.monthsOfVisits) return 'Non planifiée';
    const monthsList = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const currentMonthIndex = new Date().getMonth();
    const scheduled = this.contract.monthsOfVisits.split(', ');
    for (let month of scheduled) {
      if (monthsList.indexOf(month) >= currentMonthIndex) return month;
    }
    return scheduled[0] + ' (Année Prochaine)';
  }

  trackByIndex(index: number): number { return index; }
}