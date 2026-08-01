import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClientService } from '../../services/client';
import { SectorService } from '../../services/sector'; // Import SectorService
import { Sector } from '../../services/client';

@Component({
  selector: 'app-client-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './client-add.html',
  styleUrls: ['./client-add.css']
})
export class ClientAddComponent implements OnInit {

  clientForm!: FormGroup;
  sectors: Sector[] = []; // Sectors dropdown array
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private sectorService: SectorService, // Inject SectorService
    private router: Router
  ) { }

  ngOnInit(): void {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      description: [''],
      // Optional fields initialization [1.2.6]
      address: [''],
      city: [''],
      contact: [''],
      website: [''],
      sectorId: [''],
      phones: this.fb.array([this.createPhoneField()])
    });

    this.loadSectors();
  }

  loadSectors(): void {
    this.sectorService.getActiveSectors().subscribe({
      next: (data: Sector[]) => {
        this.sectors = data;
      },
      error: (err: any) => console.error('Failed to load active sectors', err)
    });
  }

  get phones(): FormArray {
    return this.clientForm.get('phones') as FormArray;
  }

  createPhoneField(): FormGroup {
    return this.fb.group({
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]]
    });
  }

  addPhoneField(): void {
    this.phones.push(this.createPhoneField());
  }

  removePhoneField(index: number): void {
    if (this.phones.length > 1) {
      this.phones.removeAt(index);
    } else {
      alert("At least one registered contact number is required.");
    }
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const formValue = this.clientForm.value;
    const request = {
      name: formValue.name,
      email: formValue.email,
      description: formValue.description,
      address: formValue.address || undefined, // Changed from null
      city: formValue.city || undefined,       // Changed from null
      contact: formValue.contact || undefined,   // Changed from null
      website: formValue.website || undefined,   // Changed from null
      sectorId: formValue.sectorId ? Number(formValue.sectorId) : undefined, // Changed from null
      phones: formValue.phones.map((p: any) => p.phoneNumber)
    };

    this.clientService.createClient(request).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.errorMessage = 'An account with that email or phone number already exists.';
        console.error(err);
      }
    });
  }
}