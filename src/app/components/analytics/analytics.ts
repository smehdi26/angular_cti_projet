import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from "ng-apexcharts";
import { AnalyticsService } from '../../services/analytics';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, FormsModule],
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.css']
})
export class AnalyticsComponent implements OnInit {
  // --- All Chart Objects Preserved ---
  public sectorPieOptions: any;
  public statusDonutOptions: any;
  public contractBarOptions: any;
  public cityTreemapOptions: any;
  public executionRadialOptions: any;
  public techWorkloadOptions: any;
  public resMonthlyChartOptions: any;
  public acquisitionChartOptions: any; // Added for growth tracking

  public stats: any;
  public loading: boolean = true;

  private colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.analyticsService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.initCharts(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load analytics', err);
        this.loading = false;
      }
    });
  }

  initCharts(data: any): void {
    // 1. Sector Distribution (Pie)
    this.sectorPieOptions = {
      series: Object.values(data.clientsBySector || {}),
      chart: { type: "pie", height: 350 },
      labels: Object.keys(data.clientsBySector || {}),
      colors: this.colors,
      legend: { position: 'bottom' }
    };

    // 2. Reservation Status (Donut)
    this.statusDonutOptions = {
      series: Object.values(data.reservationStatus || {}),
      chart: { type: "donut", height: 350 },
      labels: Object.keys(data.reservationStatus || {}),
      colors: ['#f59e0b', '#4f46e5', '#10b981', '#ef4444'],
      plotOptions: { pie: { donut: { size: '70%' } } }
    };

    // 3. Contract Types (Bar)
    this.contractBarOptions = {
      series: [{ name: "Contracts", data: Object.values(data.contractsByType || {}) }],
      chart: { type: "bar", height: 350, toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 10, columnWidth: '50%' } },
      xaxis: { categories: Object.keys(data.contractsByType || {}) },
      colors: ['#4f46e5']
    };

    // 4. Regional Distribution (Treemap)
    this.cityTreemapOptions = {
      series: [{
        data: Object.entries(data.cityDistribution || {}).map(([key, val]) => ({ x: key, y: val }))
      }],
      chart: { height: 350, type: "treemap", toolbar: { show: false } },
      colors: ['#6366f1'],
      title: { text: "Regional Client Density", align: 'center' }
    };

    // 5. DOUBLE RADIAL: Performed vs Documented
    this.executionRadialOptions = {
      series: [data.executionRate?.performedPct || 0, data.executionRate?.documentedPct || 0],
      chart: { height: 380, type: "radialBar" },
      plotOptions: {
        radialBar: {
          dataLabels: {
            total: {
              show: true,
              label: "Visits Done",
              formatter: () => data.executionRate?.performed || 0
            }
          }
        }
      },
      labels: ["Performed", "Documented"],
      colors: ["#4f46e5", "#10b981"]
    };

    // 6. Tech Workload (Horizontal Bar)
    this.techWorkloadOptions = {
      series: [{ name: "Reservations", data: Object.values(data.techWorkload || {}) }],
      chart: { type: "bar", height: 350, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
      xaxis: { categories: Object.keys(data.techWorkload || {}) },
      colors: ["#8b5cf6"]
    };

    // 7. Monthly Reservation Volume (Grouped Columns)
    this.resMonthlyChartOptions = {
      series: [
        { name: "Untreated", data: data.reservationMonthly?.['UNTREATED'] || [], color: '#f59e0b' },
        { name: "In Progress", data: data.reservationMonthly?.['IN_PROGRESS'] || [], color: '#4f46e5' },
        { name: "Done", data: data.reservationMonthly?.['DONE'] || [], color: '#10b981' },
        { name: "Cancelled", data: data.reservationMonthly?.['CANCELLED'] || [], color: '#ef4444' }
      ],
      chart: { type: "bar", height: 350, toolbar: { show: false } },
      xaxis: { categories: data.monthLabels || [] },
      plotOptions: { bar: { columnWidth: "55%", borderRadius: 5 } },
      legend: { position: 'top' }
    };

    // 8. ADDED: Client Acquisition Growth (Area Chart)
    this.acquisitionChartOptions = {
      series: [{ name: "New Clients", data: data.clientMonthlyGrowth || [] }],
      chart: { type: "area", height: 350, zoom: { enabled: false }, toolbar: { show: false } },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3 },
      xaxis: { categories: data.monthLabels || [] },
      colors: ["#10b981"],
      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } }
    };
  }
}