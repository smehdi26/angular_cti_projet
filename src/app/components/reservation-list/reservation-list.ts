import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReservationService, Reservation } from '../../services/reservation';
import { NotificationService } from '../../services/notification';

declare var bootstrap: any;
declare var FullCalendar: any;

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reservation-list.html',
  styleUrls: ['./reservation-list.css']
})
export class ReservationListComponent implements OnInit, AfterViewInit {

  reservations: Reservation[] = [];
  keyword: string = '';
  statusFilter: string = '';
  currentView: string = 'list';

  // Counts (pre-calculated to prevent UI lags)
  untreatedCount = 0;
  inprogressCount = 0;
  doneCount = 0;
  cancelledCount = 0;

  selectedRes: any = null;
  calendar: any = null;

  constructor(
    private reservationService: ReservationService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadReservations();
  }

  ngAfterViewInit(): void {
    this.initCalendar();
  }

  loadReservations(): void {
    this.reservationService.getReservations(this.keyword, this.statusFilter).subscribe({
      next: (data: Reservation[]) => {
        this.reservations = data;
        this.calculateStatusCounts();
        this.updateCalendarEvents(); // Automatically update calendar data source [1.2.6]
      },
      error: (err: any) => {
        console.error('Failed to load reservations', err);
      }
    });
  }

  calculateStatusCounts(): void {
    this.untreatedCount = this.reservations.filter(r => r.status === 'UNTREATED').length;
    this.inprogressCount = this.reservations.filter(r => r.status === 'IN_PROGRESS').length;
    this.doneCount = this.reservations.filter(r => r.status === 'DONE').length;
    this.cancelledCount = this.reservations.filter(r => r.status === 'CANCELLED').length;
  }

  getPrimaryPhone(client: any): string {
    if (client && client.phones && client.phones.length > 0) {
      return client.phones[0].phoneNumber;
    }
    return '00000000';
  }

  switchView(viewName: string): void {
    this.currentView = viewName;
    if (viewName === 'calendar' && this.calendar) {
      // Small timeout allows the container's d-none to be removed before calculating size [1.1.8]
      setTimeout(() => {
        this.calendar.updateSize();   // FORCES FullCalendar to recalculate its dimensions [1.1.8]
        this.updateCalendarEvents(); // Refreshes events securely
      }, 50);
    }
  }

  onSearchAndFilter(): void {
    this.loadReservations();
  }

  submitStatusForm(res: Reservation, selectElement: HTMLSelectElement): void {
    const status = selectElement.value;
    let reason = '';

    if (status === 'CANCELLED') {
      const promptVal = prompt("Enter the reason for cancelling this reservation (optional):");
      if (promptVal === null) {
        selectElement.value = res.status;
        return;
      }
      reason = promptVal;
    }

    this.reservationService.updateStatus(res.id!, status, reason).subscribe({
      next: () => {
        this.loadReservations();
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => {
        console.error('Failed to update status', err);
        selectElement.value = res.status;
      }
    });
  }

  initCalendar(): void {
    const calendarEl = document.getElementById('calendar-view');
    if (calendarEl && (window as any).FullCalendar) {
      this.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: [],
        eventClick: (info: any) => {
          this.selectedRes = info.event.extendedProps;
          this.selectedRes.start = info.event.start;
          
          const modalEl = document.getElementById('eventDetailsModal');
          if (modalEl) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
          }
        }
      });
      this.calendar.render();
    }
  }

  // Maps events directly from local memory (No DOM query selectors or Thymeleaf needed) [1.2.6]
  updateCalendarEvents(): void {
    if (!this.calendar) return;

    const events = this.reservations.map(res => ({
      id: res.client ? res.client.id?.toString() : '',
      title: res.client ? res.client.name : 'Unknown',
      start: res.reservationTime,
      extendedProps: {
        clientName: res.client ? res.client.name : 'Unknown',
        clientEmail: res.client ? res.client.email : '',
        clientPhone: this.getPrimaryPhone(res.client),
        description: res.description,
        status: res.status,
        cancellationReason: res.cancellationReason
      }
    }));

    this.calendar.removeAllEvents();
    this.calendar.addEventSource(events);
  }
}