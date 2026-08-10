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
  public resMonthlyChartOptions: any;


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

    // 5. Maintenance Execution & Documentation (Double Radial Bar)
  this.executionRadialOptions = {
    // Two series: Performed vs Documented
    series: [data.executionRate.performedPct, data.executionRate.documentedPct],
    chart: { height: 380, type: "radialBar" },
    plotOptions: {
      radialBar: {
        dataLabels: {
          name: { fontSize: "22px" },
          value: { fontSize: "16px" },
          total: {
            show: true,
            label: "Total Visits",
            formatter: function(w: any) {
              return data.executionRate.performed; // Shows total performed in the center
            }
          }
        }
      }
    },
    labels: ["Work Performed", "Reports Attached"],
    colors: ["#4f46e5", "#10b981"] // Indigo for work, Green for files
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

    // 7. Grouped Column Chart: Monthly Reservations by Status
  this.resMonthlyChartOptions = {
    series: [
      { name: "Untreated", data: data.reservationMonthly['UNTREATED'], color: '#f59e0b' },
      { name: "In Progress", data: data.reservationMonthly['IN_PROGRESS'], color: '#4f46e5' },
      { name: "Done", data: data.reservationMonthly['DONE'], color: '#10b981' },
      { name: "Cancelled", data: data.reservationMonthly['CANCELLED'], color: '#ef4444' }
    ],
    chart: {
      type: "bar",
      height: 350,
      stacked: false, // Set to true if you want them on top of each other
      toolbar: { show: true }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 5
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"]
    },
    xaxis: {
      categories: data.monthLabels,
      title: { text: "Months of the Year" }
    },
    yaxis: {
      title: { text: "Number of Reservations" }
    },
    fill: { opacity: 1 },
    tooltip: {
      y: {
        formatter: (val: number) => val + " Reservations"
      }
    },
    legend: { position: 'top' }
  };
  }
}