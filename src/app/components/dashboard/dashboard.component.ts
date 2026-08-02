import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClientService, Client } from '../../services/client';
import { ReservationService, Reservation } from '../../services/reservation';
import { NotificationService, NotificationLog } from '../../services/notification';

declare var bootstrap: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  totalClientsCount: number = 0;
  totalPhones: number = 0;
  todayReservationsCount: number = 0;

  // Highlights Previews
  todayMeetings: any[] = [];
  recentActivities: NotificationLog[] = [];
  recentClients: Client[] = [];
  upcomingAlerts: Reservation[] = [];

  constructor(
    private clientService: ClientService,
    private reservationService: ReservationService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadClientsData();
    this.loadNotificationMetrics();
    this.loadSchedulerHighlights();
  }

  loadClientsData(): void {
    this.clientService.getClients().subscribe({
      next: (data: Client[]) => {
        this.totalClientsCount = data.length;
        
        // Retrieve the last 3 registered clients
        this.recentClients = data.slice(-3).reverse();

        this.totalPhones = data.reduce((acc, client) => {
          return acc + (client.phones ? client.phones.length : 0);
        }, 0);
      },
      error: (err: any) => console.error(err)
    });
  }

  loadNotificationMetrics(): void {
    // 1. Get today's total active reservation count
    this.reservationService.getTodayCount().subscribe({
      next: (count: number) => {
        this.todayReservationsCount = count;
        this.triggerDailySummaryModal();
      },
      error: (err: any) => console.error(err)
    });

    // 2. Get active bookings starting within 1 hour
    this.reservationService.getUpcomingAlerts().subscribe({
      next: (alerts: Reservation[]) => {
        this.upcomingAlerts = alerts.filter(alert => 
          localStorage.getItem('acknowledged_alert_' + alert.id) !== 'true'
        );
      },
      error: (err: any) => console.error(err)
    });

    // 3. Load latest 5 system activity logs
    this.notificationService.getNotifications().subscribe({
      next: (data: NotificationLog[]) => {
        this.recentActivities = data.slice(0, 5); // Take the top 5
      },
      error: (err: any) => console.error(err)
    });
  }

  loadSchedulerHighlights(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    this.reservationService.getSlots(todayStr).subscribe({
      next: (slots) => {
        // Filter out occupied intervals to show today's timeline activity
        this.todayMeetings = slots.filter(s => s.booked);
      },
      error: (err: any) => console.error(err)
    });
  }

  triggerDailySummaryModal(): void {
    const todayCount = this.todayReservationsCount;
    const todayDate = new Date().toISOString().split('T')[0];
    const acknowledged = JSON.parse(localStorage.getItem('lastAcknowledgedDailySummary') || 'null');

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
    this.upcomingAlerts = this.upcomingAlerts.filter(alert => alert.id !== alertId);
  }

  getPrimaryPhone(client: Client): string {
    if (client.phones && client.phones.length > 0) {
      return client.phones[0].phoneNumber;
    }
    return '00000000';
  }
}