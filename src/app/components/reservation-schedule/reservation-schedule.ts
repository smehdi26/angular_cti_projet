import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReservationService, TimeSlot, BookingRequest } from '../../services/reservation';
import { ClientService, Client } from '../../services/client';
import { UserManagementService, SystemUser } from '../../services/user-management';
import { NotificationService } from '../../services/notification';

@Component({
  selector: 'app-reservation-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reservation-schedule.html',
  styleUrls: ['./reservation-schedule.css']
})
export class ReservationScheduleComponent implements OnInit {

  bookingForm!: FormGroup;
  selectedDate: string = '';
  slots: TimeSlot[] = [];
  clients: Client[] = [];
  technicians: SystemUser[] = [];
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private clientService: ClientService,
    private userService: UserManagementService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];

    // 1. Capture query parameters (handles navigation from Client Profile)
    const qParams = this.route.snapshot.queryParams;
    
    if (qParams['date']) {
      this.selectedDate = qParams['date'];
    }

    // 2. Initialize form and PRE-FILL data if it exists in the URL
    this.bookingForm = this.fb.group({
      name: ['', [Validators.required]],
      date: [this.selectedDate, [Validators.required]],
      time: ['', [Validators.required]],
      clientId: [qParams['clientId'] ? Number(qParams['clientId']) : '', [Validators.required]],
      technicianId: ['', [Validators.required]],
      priority: ['MEDIUM', [Validators.required]], // Default priority level
      description: [qParams['description'] || '']
    });
    
    this.loadSlots();
    this.loadClients();
    this.loadTechnicians();
  }

  loadSlots(): void {
    this.reservationService.getSlots(this.selectedDate).subscribe({
      next: (data: TimeSlot[]) => {
        this.slots = data;
      },
      error: (err: any) => {
        console.error('Failed to load timeline slots', err);
      }
    });
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (data: Client[]) => {
        this.clients = data;
      },
      error: (err: any) => {
        console.error('Failed to load client list', err);
      }
    });
  }

  loadTechnicians(): void {
    this.userService.getTechnicians().subscribe({
      next: (data: SystemUser[]) => {
        this.technicians = data;
      },
      error: (err: any) => {
        console.error('Failed to load technicians list', err);
      }
    });
  }

  onDateChange(): void {
    this.bookingForm.patchValue({ date: this.selectedDate });
    this.loadSlots();
  }

  prepareBooking(timeString: string): void {
    this.bookingForm.patchValue({ time: timeString });
  }

  cancelBooking(slot: TimeSlot): void {
    if (!slot.reservationId) return;

    const reason = prompt("Enter the reason for cancelling this reservation (optional):");
    if (reason === null) return;

    this.reservationService.cancelSlot(slot.reservationId, reason).subscribe({
      next: () => {
        this.loadSlots();
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => {
        console.error('Failed to cancel reservation', err);
      }
    });
  }

  onSubmit(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    const formValue = this.bookingForm.value;

    // Build the request object matching the BookingRequest interface in reservation.ts
    const request: BookingRequest = {
      name: formValue.name,
      clientId: Number(formValue.clientId),
      date: formValue.date,
      time: formValue.time,
      technicianId: Number(formValue.technicianId),
      priority: formValue.priority, // FIXED: Included priority field to satisfy TS2741
      description: formValue.description
    };

    this.reservationService.bookSlot(request).subscribe({
      next: () => {
        this.errorMessage = '';
        
        // Safely resets the validation state and clears the form
        this.bookingForm.reset({
          date: this.selectedDate, // Preserves the currently viewed date
          name: '',
          time: '',
          clientId: '',
          technicianId: '',
          priority: 'MEDIUM', // Reset priority to default
          description: ''
        });

        this.loadSlots();
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to book slot. This time might already be reserved.';
        console.error(err);
      }
    });
  }
}