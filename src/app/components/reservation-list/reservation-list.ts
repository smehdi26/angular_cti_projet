import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReservationService, Reservation } from '../../services/reservation';
import { NotificationService } from '../../services/notification';
import { UserManagementService, SystemUser } from '../../services/user-management';

declare var bootstrap: any;
declare var FullCalendar: any;

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reservation-list.html',
  styleUrls: ['./reservation-list.css']
})
export class ReservationListComponent implements OnInit, AfterViewInit {

  reservations: Reservation[] = [];
  technicians: SystemUser[] = [];
  
  // UI State
  keyword: string = '';
  statusFilter: string = '';
  currentView: string = 'list';
  calendar: any = null;

  // Kanban Counts
  untreatedCount = 0;
  inprogressCount = 0;
  doneCount = 0;
  cancelledCount = 0;

  // Modal Properties
  selectedRes: any = null;
  editForm!: FormGroup;
  priorityFilter: string = '';


  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private notificationService: NotificationService,
    private userService: UserManagementService
  ) { }

  ngOnInit(): void {
    // 1. Initialize the Edit Form
    this.editForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required]],
      technicianId: [null],
      priority: ['MEDIUM', [Validators.required]],
      status: ['UNTREATED', [Validators.required]],
      description: ['']
    });

    this.loadReservations();
    this.loadTechnicians();
  }

  ngAfterViewInit(): void {
    // Delay slightly to ensure DOM element exists
    setTimeout(() => {
      this.initCalendar();
    }, 200);
  }

  loadReservations(): void {
  this.reservationService.getReservations(this.keyword, this.statusFilter, this.priorityFilter).subscribe({
    next: (data: Reservation[]) => {
      this.reservations = data;
      this.calculateStatusCounts();
      this.updateCalendarEvents();
      },
      error: (err: any) => console.error('Error loading reservations', err)
    });
  }

  loadTechnicians(): void {
    this.userService.getTechnicians().subscribe({
      next: (data) => this.technicians = data
    });
  }

  calculateStatusCounts(): void {
    this.untreatedCount = this.reservations.filter(r => r.status === 'UNTREATED').length;
    this.inprogressCount = this.reservations.filter(r => r.status === 'IN_PROGRESS').length;
    this.doneCount = this.reservations.filter(r => r.status === 'DONE').length;
    this.cancelledCount = this.reservations.filter(r => r.status === 'CANCELLED').length;
  }

  // =========================================================================
  // INTERACTIVE MODAL LOGIC (TDD: EDITING VIA POP-UP)
  // =========================================================================

  /**
   * Action: Triggered when clicking a title in the list or board.
   * Fills the form with existing data and opens the Edit Modal.
   */
  openEditModal(res: Reservation): void {
    this.selectedRes = res;
    
    // Populate form with current values
    this.editForm.patchValue({
      id: res.id,
      name: res.name,
      technicianId: res.technician ? res.technician.id : null,
      priority: res.priority,
      status: res.status,
      description: res.description
    });

    const modalEl = document.getElementById('resEditModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  /**
   * Action: Saves modified reservation data to the backend.
   */
  // UPDATE this specific method in reservation-list.ts
saveReservationChanges(): void {
  if (this.editForm.invalid) {
    this.editForm.markAllAsTouched();
    return;
  }

  const val = this.editForm.value;
  const reservationId = val.id;

  // We send the whole object to the new PUT /{id} endpoint
  this.reservationService.updateReservation(reservationId, val).subscribe({
    next: () => {
      this.loadReservations(); // Refresh the list and Kanban board
      this.notificationService.updateUnreadCount(); // Refresh notifications
      
      // Close the modal
      const modalEl = document.getElementById('resEditModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    },
    error: (err) => {
      console.error('Update failed', err);
      alert("Erreur lors de la mise à jour de la réservation.");
    }
  });
}

  // =========================================================================
  // EXISTING METHODS (LIST UTILS, SORTING, CALENDAR)
  // =========================================================================

  submitStatusForm(res: Reservation, selectElement: HTMLSelectElement): void {
    const status = selectElement.value;
    let reason = '';

    if (status === 'CANCELLED') {
      const promptVal = prompt("Motif de l'annulation :");
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
      }
    });
  }

  initCalendar(): void {
    const calendarEl = document.getElementById('calendar-view');
    if (calendarEl && (window as any).FullCalendar) {
      this.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridDay' },
        eventClick: (info: any) => {
          // Find the actual reservation object to open the same Edit Modal
          const resId = Number(info.event.id);
          const match = this.reservations.find(r => r.id === resId);
          if (match) this.openEditModal(match);
        }
      });
      this.calendar.render();
    }
  }

  updateCalendarEvents(): void {
    if (!this.calendar) return;
    const events = this.reservations.map(res => ({
      id: res.id?.toString(),
      title: res.name,
      start: res.reservationTime,
      color: res.priority === 'CRITICAL' ? '#ef4444' : res.priority === 'HIGH' ? '#f59e0b' : '#4f46e5'
    }));
    this.calendar.removeAllEvents();
    this.calendar.addEventSource(events);
  }

  switchView(viewName: string): void {
    this.currentView = viewName;
    if (viewName === 'calendar' && this.calendar) {
      setTimeout(() => this.calendar.updateSize(), 50);
    }
  }

  onSearchAndFilter(): void { this.loadReservations(); }

  getPrimaryPhone(client: any): string {
    return (client && client.phones && client.phones.length > 0) ? client.phones[0].phoneNumber : '00000000';
  }

  deleteReservation(id: number): void {
    if (confirm('Permanently delete this reservation?')) {
      this.reservationService.deleteReservation(id).subscribe(() => {
        this.loadReservations();
        this.notificationService.updateUnreadCount();
      });
    }
  }

  sort(headerEl: HTMLTableCellElement): void {
    const table = headerEl.closest('table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody?.querySelectorAll('tr') || []);
    const index = Array.from(headerEl.parentNode?.children || []).indexOf(headerEl);
    const isAsc = headerEl.getAttribute('data-sort-dir') === 'asc';
    const nextDir = isAsc ? 'desc' : 'asc';
    headerEl.setAttribute('data-sort-dir', nextDir);

    const priorityWeight: any = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };

    rows.sort((a, b) => {
      let valA = a.children[index].textContent?.trim() || '';
      let valB = b.children[index].textContent?.trim() || '';

      if (headerEl.innerText.includes('Priority')) {
        return isAsc ? priorityWeight[valB] - priorityWeight[valA] : priorityWeight[valA] - priorityWeight[valB];
      }
      return isAsc ? valB.localeCompare(valA) : valA.localeCompare(valB);
    });
    rows.forEach(row => tbody?.appendChild(row));
  }
  
  resetFilters(): void {
  this.keyword = '';
  this.statusFilter = '';
  this.priorityFilter = ''; // Added
  this.onSearchAndFilter();
}
}