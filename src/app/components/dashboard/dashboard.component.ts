import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClientService, Client, Phone } from '../../services/client';
import { ReservationService, Reservation } from '../../services/reservation'; // Added import
import { NotificationService } from '../../services/notification'; // Added import

declare var bootstrap: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  clients: Client[] = [];
  filteredClients: Client[] = [];
  searchTerm: string = '';
  totalPhones: number = 0;

  // Notification properties
  todayReservationsCount: number = 0;
  upcomingAlerts: Reservation[] = [];

  constructor(
    private clientService: ClientService,
    private reservationService: ReservationService, // Inject ReservationService
    private notificationService: NotificationService // Inject NotificationService
  ) { }

  ngOnInit(): void {
    this.loadClients();
    this.loadNotificationMetrics();
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (data: Client[]) => {
        this.clients = data;
        this.filteredClients = data;
        this.calculateTotalPhones();
      },
      error: (err: any) => {
        console.error('Failed to load clients', err);
      }
    });
  }

  loadNotificationMetrics(): void {
    // 1. Get today's total active reservation count
    this.reservationService.getTodayCount().subscribe({
      next: (count: number) => {
        this.todayReservationsCount = count;
        this.triggerDailySummaryModal();
      },
      error: (err: any) => console.error('Failed to load daily count', err)
    });

    // 2. Get active bookings starting within 1 hour
    this.reservationService.getUpcomingAlerts().subscribe({
      next: (alerts: Reservation[]) => {
        // Filter out already acknowledged warning cards locally from browser memory [1.2.1]
        this.upcomingAlerts = alerts.filter(alert => 
          localStorage.getItem('acknowledged_alert_' + alert.id) !== 'true'
        );
      },
      error: (err: any) => console.error('Failed to load upcoming alerts', err)
    });
  }

  triggerDailySummaryModal(): void {
    const todayCount = this.todayReservationsCount;
    const todayDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const acknowledged = JSON.parse(localStorage.getItem('lastAcknowledgedDailySummary') || 'null');

    // Display modal if count > 0, AND (date has changed OR reservation count has changed)
    if (todayCount > 0 && (!acknowledged || acknowledged.date !== todayDate || acknowledged.count !== todayCount)) {
      setTimeout(() => {
        const modalEl = document.getElementById('dailySummaryModal');
        if (modalEl) {
          const modal = new bootstrap.Modal(modalEl);
          modal.show();
        }
      }, 100);
    }
  }

  acknowledgeDailySummary(): void {
    const todayDate = new Date().toISOString().split('T')[0];
    localStorage.setItem('lastAcknowledgedDailySummary', JSON.stringify({
      date: todayDate,
      count: this.todayReservationsCount
    }));
  }

  acknowledgeAlert(alertId: number): void {
    localStorage.setItem('acknowledged_alert_' + alertId, 'true');
    // Filter list locally to hide card instantly
    this.upcomingAlerts = this.upcomingAlerts.filter(alert => alert.id !== alertId);
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredClients = this.clients;
    } else {
      this.filteredClients = this.clients.filter((client: Client) => 
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        (client.description && client.description.toLowerCase().includes(term)) ||
        (client.phones && client.phones.some((p: Phone) => p.phoneNumber.includes(term)))
      );
    }
  }

  calculateTotalPhones(): void {
    this.totalPhones = this.clients.reduce((acc: number, client: Client) => {
      return acc + (client.phones ? client.phones.length : 0);
    }, 0);
  }

  getPrimaryPhone(client: Client): string {
    if (client.phones && client.phones.length > 0) {
      return client.phones[0].phoneNumber;
    }
    return '00000000';
  }

  deleteClient(client: Client): void {
    const phone = this.getPrimaryPhone(client);
    if (phone === '00000000') return;

    if (confirm(`Are you sure you want to permanently delete client ${client.name}?`)) {
      this.clientService.deleteClient(phone).subscribe({
        next: () => {
          this.loadClients();
        },
        error: (err: any) => {
          console.error('Failed to delete client', err);
        }
      });
    }
  }
}