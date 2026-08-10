import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from "ng-apexcharts";
import { AnalyticsService } from '../../services/analytics';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, RouterLink],
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.css']
})
export class AnalyticsComponent implements OnInit {
  // Chart Options Objects
  public sectorPieOptions: any;
  public statusDonutOptions: any;
  public contractBarOptions: any;
  public cityTreemapOptions: any;
  public executionRadialOptions: any;
  public techWorkloadOptions: any;

  public stats: any;
  public loading: boolean = true;

  // Professional Color Palette
  private colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
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
    // 1. Clients by Sector (Pie)
    this.sectorPieOptions = {
      series: Object.values(data.clientsBySector || {}),
      chart: { type: "pie", height: 300 },
      labels: Object.keys(data.clientsBySector || {}),
      colors: this.colors,
      legend: { position: 'bottom' },
      responsive: [{ breakpoint: 480, options: { chart: { width: 200 } } }]
    };

    // 2. Reservation Status (Donut)
    this.statusDonutOptions = {
      series: Object.values(data.reservationStatus || {}),
      chart: { type: "donut", height: 300 },
      labels: Object.keys(data.reservationStatus || {}),
      colors: ['#f59e0b', '#4f46e5', '#10b981', '#ef4444'], // Matches Warning, Primary, Success, Danger
      plotOptions: { pie: { donut: { size: '65%' } } },
      legend: { position: 'bottom' }
    };

    // 3. Contract Types (Bar)
    this.contractBarOptions = {
      series: [{ name: "Contracts", data: Object.values(data.contractsByType || {}) }],
      chart: { type: "bar", height: 300, toolbar: { show: false } },
      colors: ['#4f46e5'],
      plotOptions: { bar: { borderRadius: 8, columnWidth: '45%' } },
      xaxis: { categories: Object.keys(data.contractsByType || {}) },
      dataLabels: { enabled: false }
    };

    // 4. Tunisian Governorate Distribution (Treemap)
    this.cityTreemapOptions = {
      series: [{
        data: Object.entries(data.cityDistribution || {}).map(([key, val]) => ({ x: key, y: val }))
      }],
      legend: { show: false },
      chart: { height: 350, type: "treemap", toolbar: { show: false } },
      colors: ['#6366f1'],
      title: { text: "Client Density by Governorate", align: 'center' }
    };

    // 5. Maintenance Execution Rate (Radial Bar)
    this.executionRadialOptions = {
      series: [data.executionRate?.percentage || 0],
      chart: { height: 350, type: "radialBar" },
      plotOptions: {
        radialBar: {
          hollow: { size: "70%" },
          dataLabels: {
            name: { show: true, color: "#64748b", fontSize: "14px", offsetY: -10 },
            value: { show: true, color: "#0f172a", fontSize: "30px", fontWeight: "700", offsetY: 5 },
            total: {
              show: true,
              label: "Visits Done",
              formatter: () => data.executionRate?.completed || 0
            }
          }
        }
      },
      labels: ["Completion Rate"],
      colors: ["#10b981"]
    };

    // 6. Technician Workload (Horizontal Bar)
    this.techWorkloadOptions = {
      series: [{ name: "Reservations", data: Object.values(data.techWorkload || {}) }],
      chart: { type: "bar", height: 350, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
      colors: ["#8b5cf6"],
      xaxis: { categories: Object.keys(data.techWorkload || {}) },
      title: { text: "Meetings Assigned per Technician", align: "center" }
    };
  }
}