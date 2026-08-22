import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // Added for direct API call
import { NgApexchartsModule } from "ng-apexcharts";
import { ClientService, Client } from '../../services/client';
import { ReservationService, Reservation } from '../../services/reservation';
import { NotificationService, NotificationLog } from '../../services/notification';
import { AnalyticsService } from '../../services/analytics';

declare var bootstrap: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgApexchartsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  // KPI Metrics
  totalClientsCount: number = 0;
  totalPhones: number = 0;
  todayReservationsCount: number = 0;

  // Data Lists
  todayMeetings: any[] = [];
  recentActivities: NotificationLog[] = [];
  recentClients: Client[] = [];
  upcomingAlerts: Reservation[] = [];
  
  // NEW: Urgent Visits Properties
  urgentVisits: any[] = [];

  // Chart Properties
  public chartOptions: any;

  constructor(
    private clientService: ClientService,
    private reservationService: ReservationService,
    private notificationService: NotificationService,
    private analyticsService: AnalyticsService,
    private http: HttpClient // Injected for urgent alerts check
  ) { }

  ngOnInit(): void {
    this.loadClientsData();
    this.loadNotificationMetrics();
    this.loadSchedulerHighlights();
    this.loadDashboardChart();
    
    // NEW: Check for urgent maintenance visits on load
    this.checkUrgentVisits();
  }

  loadClientsData(): void {
    this.clientService.getClients().subscribe({
      next: (data: Client[]) => {
        this.totalClientsCount = data.length;
        this.recentClients = data.slice(-3).reverse();
        this.totalPhones = data.reduce((acc, client) => acc + (client.phones ? client.phones.length : 0), 0);
      },
      error: (err: any) => console.error(err)
    });
  }

  loadNotificationMetrics(): void {
    this.reservationService.getTodayCount().subscribe({
      next: (count: number) => {
        this.todayReservationsCount = count;
        this.triggerDailySummaryModal();
      }
    });

    this.reservationService.getUpcomingAlerts().subscribe({
      next: (alerts: Reservation[]) => {
        this.upcomingAlerts = alerts.filter(alert => 
          localStorage.getItem('acknowledged_alert_' + alert.id) !== 'true'
        );
      }
    });

    this.notificationService.getNotifications().subscribe({
      next: (data: NotificationLog[]) => {
        this.recentActivities = data.slice(0, 5);
      }
    });
  }

  loadSchedulerHighlights(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    this.reservationService.getSlots(todayStr).subscribe({
      next: (slots) => {
        this.todayMeetings = slots.filter(s => s.booked);
      }
    });
  }

  loadDashboardChart(): void {
    this.analyticsService.getStats().subscribe(data => {
      if (data.reservationStatus) {
        this.chartOptions = {
          series: Object.values(data.reservationStatus),
          chart: { type: "donut", height: 220 },
          labels: Object.keys(data.reservationStatus),
          colors: ['#f59e0b', '#4f46e5', '#10b981', '#ef4444'],
          legend: { position: 'bottom', fontSize: '12px' },
          dataLabels: { enabled: false },
          plotOptions: { pie: { donut: { size: '70%' } } }
        };
      }
    });
  }

  // =========================================================================
  // URGENT VISITS LOGIC (NEW)
  // =========================================================================

  checkUrgentVisits(): void {
    const today = new Date().toISOString().split('T')[0];
    const lastDismissed = localStorage.getItem('urgent_alert_dismissed_date');

    // TDD Requirement: Only show if NOT already dismissed today
    if (lastDismissed === today) {
        console.log("Urgent alerts already read for today.");
        return;
    }

    this.http.get<any[]>('http://localhost:8090/api/contracts/urgent-alerts', { withCredentials: true })
      .subscribe({
        next: (data) => {
          this.urgentVisits = data;
          if (this.urgentVisits.length > 0) {
            this.triggerUrgentModal();
          }
        },
        error: (err) => console.error('Failed to fetch urgent visits', err)
      });
  }

  triggerUrgentModal(): void {
    setTimeout(() => {
      const modalEl = document.getElementById('urgentVisitsModal');
      if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
      }
    }, 1500); // Appear 1.5s after load for better UX
  }

  confirmUrgentRead(): void {
    const today = new Date().toISOString().split('T')[0];
    // TDD Requirement: Store date to prevent reappearing until tomorrow
    localStorage.setItem('urgent_alert_dismissed_date', today);
  }

  // =========================================================================
  // EXISTING MODAL & ALERT HELPERS
  // =========================================================================

  triggerDailySummaryModal(): void {
    const todayCount = this.todayReservationsCount;
    const todayDate = new Date().toISOString().split('T')[0];
    const acknowledged = JSON.parse(localStorage.getItem('lastAcknowledgedDailySummary') || 'null');

    if (todayCount > 0 && (!acknowledged || acknowledged.date !== todayDate)) {
      setTimeout(() => {
        const modalEl = document.getElementById('dailySummaryModal');
        if (modalEl) new bootstrap.Modal(modalEl).show();
      }, 500);
    }
  }

  acknowledgeDailySummary(): void {
    localStorage.setItem('lastAcknowledgedDailySummary', JSON.stringify({
      date: new Date().toISOString().split('T')[0],
      count: this.todayReservationsCount
    }));
  }

  acknowledgeAlert(alertId: number): void {
    localStorage.setItem('acknowledged_alert_' + alertId, 'true');
    this.upcomingAlerts = this.upcomingAlerts.filter(alert => alert.id !== alertId);
  }

  getPrimaryPhone(client: Client): string {
    return (client.phones && client.phones.length > 0) ? client.phones[0].phoneNumber : '00000000';
  }
}