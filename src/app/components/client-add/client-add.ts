import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClientService, Client, Sector } from '../../services/client';
import { SectorService } from '../../services/sector';
import { CityService, City } from '../../services/city'; // Import CityService [1.2.1]

@Component({
  selector: 'app-client-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './client-add.html',
  styleUrls: ['./client-add.css']
})
export class ClientAddComponent implements OnInit {

  clientForm!: FormGroup;
  sectors: Sector[] = [];
  citiesList: string[] = []; // Loaded dynamically from DB
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private sectorService: SectorService,
    private cityService: CityService, // Inject CityService
    private router: Router
  ) { }

  ngOnInit(): void {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      description: [''],
      address: [''],
      city: [''], // Bound to the dynamically loaded governorates dropdown select [1.2.1]
      contact: [''],
      website: [''],
      sectorId: [''],
      phones: this.fb.array([this.createPhoneField()])
    });

    this.loadSectors();
    this.loadActiveCities();
  }

  loadSectors(): void {
    this.sectorService.getActiveSectors().subscribe({
      next: (data: Sector[]) => {
        this.sectors = data;
      },
      error: (err: any) => console.error('Failed to load active sectors', err)
    });
  }

  // Fetch active governorate strings from the database dynamically [1.2.6]
  loadActiveCities(): void {
    this.cityService.getActiveCities().subscribe({
      next: (data: City[]) => {
        this.citiesList = data.map((c: City) => c.name);
      },
      error: (err: any) => console.error('Failed to load active cities', err)
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
    const request: Client = {
      name: formValue.name,
      email: formValue.email,
      description: formValue.description,
      address: formValue.address || undefined, // Binds undefined to keep type safety [1.2.1]
      city: formValue.city || undefined,       // Binds undefined to keep type safety [1.2.1]
      contact: formValue.contact || undefined,
      website: formValue.website || undefined,
      sectorId: formValue.sectorId ? Number(formValue.sectorId) : undefined,
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