import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReservationService, TimeSlot, BookingRequest } from '../../services/reservation';
import { ClientService, Client } from '../../services/client';
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
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService // Add this

  ) { }

  ngOnInit(): void {
    // 1. Initialize selected date to today's date (format: YYYY-MM-DD)
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];

    // 2. Read optional query parameters (pre-selected clients or date from deep-links)
    const qParams = this.route.snapshot.queryParams;
    if (qParams['date']) {
      this.selectedDate = qParams['date'];
    }

    // 3. Initialize the booking form
    this.bookingForm = this.fb.group({
      name: ['', [Validators.required]], // Added validation rule
      date: [this.selectedDate, [Validators.required]],
      time: ['', [Validators.required]],
      clientId: [qParams['clientId'] ? Number(qParams['clientId']) : '', [Validators.required]],
      description: [qParams['description'] || '']
    });

    this.loadSlots();
    this.loadClients();
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
    if (reason === null) return; // Abort cancel on prompt cancel

    this.reservationService.cancelSlot(slot.reservationId, reason).subscribe({
      next: () => {
        this.loadSlots(); // Reload timeline instantly
        this.notificationService.updateUnreadCount(); // Add this: Syncs sidebar badge instantly [1.2.6]

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
    const request: BookingRequest = {
      name: formValue.name, // Map the name
      clientId: Number(formValue.clientId),
      date: formValue.date,
      time: formValue.time,
      description: formValue.description
    };

    this.reservationService.bookSlot(request).subscribe({
      next: () => {
        this.errorMessage = '';
        this.bookingForm.patchValue({ time: '', description: '' });
        this.loadSlots(); // Reload timeline on successful booking
        this.notificationService.updateUnreadCount(); // Add this: Syncs sidebar badge instantly [1.2.6]

      },
      error: (err: any) => {
        this.errorMessage = 'Failed to book slot. This time might already be reserved.';
        console.error(err);
      }
    });
  }
}