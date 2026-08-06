import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

// Service Imports [1.2.1]
import { SectorService } from '../../services/sector';
import { CityService, City } from '../../services/city';
import { SystemSettingService, SystemSetting } from '../../services/system-setting';
import { UserManagementService, SystemUser } from '../../services/user-management';
import { Sector } from '../../services/client';
import { NotificationService } from '../../services/notification';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit {

  activeSubTab: string = 'users'; // default sub-setting tab [1.2.1]
  errorMessage: string = '';
  successMessage: string = '';

  // 1. User Management State
  users: SystemUser[] = [];

  // 2. Roles & Permissions Skeleton Matrix [1.1.4]
  rolesList = ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_TECHNICIAN'];
  permissionsMatrix: { [role: string]: { [module: string]: boolean } } = {
    'ROLE_ADMIN': { 'Clients': true, 'Reservations': true, 'Contracts': true, 'Settings': true },
    'ROLE_HR': { 'Clients': true, 'Reservations': true, 'Contracts': false, 'Settings': false },
    'ROLE_TECHNICIAN': { 'Clients': false, 'Reservations': true, 'Contracts': true, 'Settings': false }
  };

  // 3. Sectors State
  sectors: Sector[] = [];
  newSectorName: string = '';
  editingSector: Sector | null = null;
  editingSectorName: string = '';

  // 4. Cities State [1.1.4]
  cities: City[] = [];
  newCityName: string = '';
  citySearchTerm: string = '';
  filteredCities: City[] = [];

  // 5. Notification Config Toggles [1.1.4]
  emailNotif: boolean = true;
  browserNotif: boolean = true;
  resReminders: boolean = true;
  contractReminders: boolean = true;

  constructor(
    private sectorService: SectorService,
    private cityService: CityService,
    private systemSettingService: SystemSettingService,
    private userService: UserManagementService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loadUsers();
    this.loadSectors();
    this.loadCities();
    this.loadSystemSettings();
  }

  switchSubTab(tab: string): void {
    this.activeSubTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // ==========================================
  // 1. USER MANAGEMENT METHODS
  // ==========================================
  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (data: SystemUser[]) => this.users = data,
      error: (err: any) => console.error(err)
    });
  }

  changeUserRole(user: SystemUser, selectElement: HTMLSelectElement): void {
    this.userService.updateRole(user.id, selectElement.value).subscribe({
      next: () => {
        this.loadUsers();
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => console.error(err)
    });
  }

  deleteUser(id: number): void {
    if (confirm('Permanently delete this administrative account from the workspace?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.loadUsers();
          this.notificationService.updateUnreadCount();
        },
        error: (err: any) => console.error(err)
      });
    }
  }

  // ==========================================
  // 2. ROLES & PERMISSIONS METHODS (SKELETON) [1.1.4]
  // ==========================================
  togglePermission(role: string, module: string): void {
    this.permissionsMatrix[role][module] = !this.permissionsMatrix[role][module];
    this.successMessage = 'Permissions matrix state updated locally.';
  }

  // ==========================================
  // 3. CLIENT SECTORS METHODS
  // ==========================================
  loadSectors(): void {
    this.sectorService.getAllSectors().subscribe({
      next: (data: Sector[]) => this.sectors = data,
      error: (err: any) => console.error(err)
    });
  }

  addSector(): void {
    const name = this.newSectorName.trim();
    if (!name) return;

    this.sectorService.createSector({ name, active: true }).subscribe({
      next: () => {
        this.newSectorName = '';
        this.loadSectors();
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to create sector. Name must be unique.';
        console.error(err);
      }
    });
  }

  toggleSector(sector: Sector): void {
    this.sectorService.toggleStatus(sector.id!, !sector.active).subscribe({
      next: () => {
        this.loadSectors();
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => console.error(err)
    });
  }

  // ==========================================
  // 4. CITIES METHODS [1.1.4]
  // ==========================================
  loadCities(): void {
    this.cityService.getAllCities().subscribe({
      next: (data: City[]) => {
        this.cities = data;
        this.applyCityFilter();
      },
      error: (err: any) => console.error(err)
    });
  }

  applyCityFilter(): void {
    const term = this.citySearchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredCities = this.cities;
    } else {
      this.filteredCities = this.cities.filter(c => c.name.toLowerCase().includes(term));
    }
  }

  addCity(): void {
    const name = this.newCityName.trim();
    if (!name) return;

    this.cityService.createCity({ name, active: true }).subscribe({
      next: () => {
        this.newCityName = '';
        this.loadCities();
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to create city. Name must be unique.';
        console.error(err);
      }
    });
  }

  toggleCity(city: City): void {
    this.cityService.toggleStatus(city.id!, !city.active).subscribe({
      next: () => {
        this.loadCities();
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => console.error(err)
    });
  }

  // ==========================================
  // 5. NOTIFICATION SETTINGS METHODS [1.1.4]
  // ==========================================
  loadSystemSettings(): void {
    this.systemSettingService.getAllSettings().subscribe({
      next: (data: SystemSetting[]) => {
        data.forEach(s => {
          const val = s.value === 'true';
          if (s.key === 'EMAIL_NOTIFICATIONS') this.emailNotif = val;
          if (s.key === 'BROWSER_NOTIFICATIONS') this.browserNotif = val;
          if (s.key === 'RESERVATION_REMINDERS') this.resReminders = val;
          if (s.key === 'CONTRACT_REMINDERS') this.contractReminders = val;
        });
      },
      error: (err: any) => console.error(err)
    });
  }

  saveNotificationSettings(): void {
    const payload = {
      'EMAIL_NOTIFICATIONS': this.emailNotif.toString(),
      'BROWSER_NOTIFICATIONS': this.browserNotif.toString(),
      'RESERVATION_REMINDERS': this.resReminders.toString(),
      'CONTRACT_REMINDERS': this.contractReminders.toString()
    };

    this.systemSettingService.updateSettings(payload).subscribe({
      next: () => {
        this.successMessage = 'Notification variables updated successfully!';
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to update system variables.';
        console.error(err);
      }
    });
  }
}