import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Required for inputs mapping
import { Router } from '@angular/router'; // Import Router [1.2.1]
import { NotificationService, NotificationLog } from '../../services/notification';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-list.html',
  styleUrls: ['./notification-list.css']
})
export class NotificationListComponent implements OnInit {

  notifications: NotificationLog[] = [];
  filteredNotifications: NotificationLog[] = [];
  
  // Search & Filter Properties
  searchTerm: string = '';
  activeFilter: string = 'ALL'; // ALL | SUCCESS | WARNING | INFO
  activeCategory: string = 'ALL'; // ALL | CLIENT | CONTRACT | RESERVATION | USER

  // Dynamic Date Range & Sorting Properties [1.1.4, 1.2.6]
  startDate: string = ''; // Minimum date picker (YYYY-MM-DD)
  endDate: string = '';   // Maximum date picker (YYYY-MM-DD)
  sortOrder: string = 'desc'; // 'desc' (Newest first) | 'asc' (Oldest first)

  constructor(
    private notificationService: NotificationService,
    private router: Router // Inject Router [1.2.1]
  ) { }

  ngOnInit(): void {
    this.loadNotifications();
  }

  // Local getter that calculates remaining unread logs safely [1.2.6]
  get unreadCount(): number {
    return this.notifications.filter(n => !n.readStatus).length;
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (data: NotificationLog[]) => {
        this.notifications = data;
        this.applySearchAndFilter();
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => {
        console.error('Failed to load notifications list', err);
      }
    });
  }

  // Intersects all search keywords, severity levels, domains, date ranges, and sorting parameters [1.2.6]
  applySearchAndFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    let temp = this.notifications;

    // 1. Filter by Severity Level
    if (this.activeFilter !== 'ALL') {
      temp = this.notifications.filter(n => n.type === this.activeFilter || (this.activeFilter === 'WARNING' && n.type === 'DANGER'));
    }

    // 2. Filter by Domain Category
    if (this.activeCategory !== 'ALL') {
      temp = this.notifications.filter(n => n.category === this.activeCategory);
    }

    // 3. Filter by Date Range (Min - Max) [1.2.6]
    if (this.startDate) {
      const startBoundary = new Date(this.startDate + 'T00:00:00');
      temp = temp.filter(n => new Date(n.createdAt) >= startBoundary);
    }
    if (this.endDate) {
      const endBoundary = new Date(this.endDate + 'T23:59:59');
      temp = temp.filter(n => new Date(n.createdAt) <= endBoundary);
    }

    // 4. Filter by Search Keyword
    if (term) {
      temp = temp.filter(n => n.message.toLowerCase().includes(term));
    }

    // 5. Apply Chronological Sorting (Newest vs Oldest) [1.1.4, 1.2.6]
    temp.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return this.sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    this.filteredNotifications = temp;
  }

  changeFilter(filterType: string): void {
    this.activeFilter = filterType;
    this.applySearchAndFilter();
  }

  changeCategory(categoryType: string): void {
    this.activeCategory = categoryType;
    this.applySearchAndFilter();
  }

  toggleSort(): void {
    this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    this.applySearchAndFilter(); // Re-sort instantly [1.1.4, 1.2.6]
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.activeFilter = 'ALL';
    this.activeCategory = 'ALL';
    this.startDate = '';
    this.endDate = '';
    this.sortOrder = 'desc'; // Reset back to default newest first
    this.applySearchAndFilter();
  }

  // Interactive Redirection Engine [1.2.1, 1.2.6]
  onNotificationClick(notif: NotificationLog): void {
    if (notif.category === 'CLIENT' && notif.clientPhone) {
      this.router.navigate(['/clients', notif.clientPhone]); // Redirect to Client Profile [1.2.1]
    } else if (notif.category === 'CONTRACT' && notif.contractId) {
      this.router.navigate(['/contracts', notif.contractId]); // Redirect to Contract Details [1.2.1]
    } else if (notif.category === 'RESERVATION') {
      this.router.navigate(['/reservations']); // Redirect to Reservations Directory [1.2.1]
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.loadNotifications(),
      error: (err: any) => console.error(err)
    });
  }

  deleteNotification(id: number): void {
    this.notificationService.deleteNotification(id).subscribe({
      next: () => this.loadNotifications(),
      error: (err: any) => console.error(err)
    });
  }
}