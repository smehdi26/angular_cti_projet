import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientService, Client, Sector } from '../../services/client';
import { SectorService } from '../../services/sector';
import { CityService, City } from '../../services/city'; // Import CityService [1.2.1]

@Component({
  selector: 'app-client-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './client-edit.html',
  styleUrls: ['./client-edit.css']
})
export class ClientEditComponent implements OnInit {

  clientForm!: FormGroup;
  sectors: Sector[] = [];
  citiesList: string[] = []; // Loaded dynamically from DB
  originalPhone: string = '';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private sectorService: SectorService,
    private cityService: CityService, // Inject CityService
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
      address: [''],
      city: [''], // Will bind to the dynamically loaded governorates dropdown select [1.2.1]
      contact: [''],
      website: [''],
      sectorId: [''],
      phones: this.fb.array([])
    });

    this.loadSectors();
    this.loadActiveCities();
  }

  loadSectors(): void {
    this.sectorService.getActiveSectors().subscribe({
      next: (data: Sector[]) => {
        this.sectors = data;
        this.loadClientData(); // Chain loading client data after sectors load
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
      next: (client: Client) => {
        this.clientForm.patchValue({
          id: client.id,
          name: client.name,
          email: client.email,
          description: client.description,
          address: client.address || '',
          city: client.city || '', // Safe default fallback
          contact: client.contact || '',
          website: client.website || '',
          sectorId: client.sector ? client.sector.id : ''
        });

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
    const request: Client = {
      id: formValue.id,
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