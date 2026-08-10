import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgApexchartsModule } from "ng-apexcharts"; // Added for the chart
import { ClientService, Client } from '../../services/client';
import { ReservationService, Reservation } from '../../services/reservation';
import { NotificationService, NotificationLog } from '../../services/notification';
import { AnalyticsService } from '../../services/analytics'; // To get chart data

declare var bootstrap: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgApexchartsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  totalClientsCount: number = 0;
  totalPhones: number = 0;
  todayReservationsCount: number = 0;

  // Data Lists
  todayMeetings: any[] = [];
  recentActivities: NotificationLog[] = [];
  recentClients: Client[] = [];
  upcomingAlerts: Reservation[] = [];

  // Chart Properties
  public chartOptions: any;

  constructor(
    private clientService: ClientService,
    private reservationService: ReservationService,
    private notificationService: NotificationService,
    private analyticsService: AnalyticsService
  ) { }

  ngOnInit(): void {
    this.loadClientsData();
    this.loadNotificationMetrics();
    this.loadSchedulerHighlights();
    this.loadDashboardChart(); // Added
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

  // Added: Visual Chart for the Dashboard
  loadDashboardChart(): void {
    this.analyticsService.getStats().subscribe(data => {
      this.chartOptions = {
        series: Object.values(data.reservationStatus),
        chart: { type: "donut", height: 220 },
        labels: Object.keys(data.reservationStatus),
        colors: ['#f59e0b', '#4f46e5', '#10b981', '#ef4444'],
        legend: { position: 'bottom', fontSize: '12px' },
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: '70%' } } }
      };
    });
  }

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