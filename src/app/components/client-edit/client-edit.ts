import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientService } from '../../services/client';

@Component({
  selector: 'app-client-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './client-edit.html',
  styleUrls: ['./client-edit.css']
})
export class ClientEditComponent implements OnInit {

  clientForm!: FormGroup;
  originalPhone: string = '';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.originalPhone = this.route.snapshot.params['phone'];

    this.clientForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      description: [''],
      phones: this.fb.array([])
    });

    this.loadClientData();
  }

  get phones(): FormArray {
    return this.clientForm.get('phones') as FormArray;
  }

  createPhoneField(value: string = ''): FormGroup {
    return this.fb.group({
      phoneNumber: [value, [Validators.required, Validators.pattern('^[0-9]{8}$')]]
    });
  }

  addPhoneField(value: string = ''): void {
    this.phones.push(this.createPhoneField(value));
  }

  removePhoneField(index: number): void {
    if (this.phones.length > 1) {
      this.phones.removeAt(index);
    } else {
      alert("At least one registered contact number is required.");
    }
  }

  loadClientData(): void {
    this.clientService.getClientByPhone(this.originalPhone).subscribe({
      next: (client) => {
        this.clientForm.patchValue({
          id: client.id,
          name: client.name,
          email: client.email,
          description: client.description
        });

        // Map phone arrays
        if (client.phones) {
          client.phones.forEach(p => this.addPhoneField(p.phoneNumber));
        }
      },
      error: (err: any) => {
        console.error('Failed to load client details', err);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const formValue = this.clientForm.value;
    const request = {
      id: formValue.id,
      name: formValue.name,
      email: formValue.email,
      description: formValue.description,
      phones: formValue.phones.map((p: any) => p.phoneNumber)
    };

    this.clientService.updateClient(this.originalPhone, request).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.errorMessage = 'Update failed. Check that email or phone numbers are unique.';
        console.error(err);
      }
    });
  }
}