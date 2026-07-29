import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContractService } from '../../services/contract';
import { NotificationService } from '../../services/notification';

@Component({
  selector: 'app-contract-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './contract-add.html',
  styleUrls: ['./contract-add.css']
})
export class ContractAddComponent implements OnInit {

  contractForm!: FormGroup;
  clientId!: number;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private contractService: ContractService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Read the client ID from the query parameter
    this.clientId = Number(this.route.snapshot.queryParams['clientId']);

    this.contractForm = this.fb.group({
      name: ['', [Validators.required]],
      redevance: ['', [Validators.required]],
      dateSignature: ['', [Validators.required]],
      monthsOfVisits: [''],
      clientId: [this.clientId]
    });
  }

  onSubmit(): void {
    if (this.contractForm.invalid) {
      this.contractForm.markAllAsTouched();
      return;
    }

    this.contractService.createContract(this.contractForm.value).subscribe({
      next: () => {
        this.notificationService.updateUnreadCount();
        this.router.navigate(['/dashboard']); // Redirect back on success
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to register the contract. Please try again.';
        console.error(err);
      }
    });
  }
}