import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  
  // Chronological Grouping State
  groupedNotifications: { [key: string]: NotificationLog[] } = {};
  bucketKeys = ['Today', 'Yesterday', 'This Month', 'Last Month', 'Older'];

  // Search & Filter Properties
  searchTerm: string = '';
  activeFilter: string = 'ALL';
  activeCategory: string = 'ALL';

  // Date Range & Sorting
  startDate: string = '';
  endDate: string = '';
  sortOrder: string = 'desc';

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadNotifications();
  }

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
      error: (err: any) => console.error('Failed to load notifications', err)
    });
  }

  applySearchAndFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    let temp = [...this.notifications];

    if (this.activeFilter !== 'ALL') {
      temp = temp.filter(n => n.type === this.activeFilter || (this.activeFilter === 'WARNING' && n.type === 'DANGER'));
    }

    if (this.activeCategory !== 'ALL') {
      temp = temp.filter(n => n.category === this.activeCategory);
    }

    if (this.startDate) {
      const startBoundary = new Date(this.startDate + 'T00:00:00');
      temp = temp.filter(n => new Date(n.createdAt) >= startBoundary);
    }
    if (this.endDate) {
      const endBoundary = new Date(this.endDate + 'T23:59:59');
      temp = temp.filter(n => new Date(n.createdAt) <= endBoundary);
    }

    if (term) {
      temp = temp.filter(n => 
        n.message.toLowerCase().includes(term) || 
        (n.title && n.title.toLowerCase().includes(term))
      );
    }

    // Chronological Sort
    temp.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return this.sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    this.filteredNotifications = temp;
    this.groupedNotifications = this.groupNotifications(temp);
  }

  groupNotifications(notifs: NotificationLog[]) {
    const groups: { [key: string]: NotificationLog[] } = {
      'Today': [], 'Yesterday': [], 'This Month': [], 'Last Month': [], 'Older': []
    };

    const now = new Date();
    const todayStr = now.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    notifs.forEach(n => {
      const d = new Date(n.createdAt);
      const dateStr = d.toDateString();

      if (dateStr === todayStr) {
        groups['Today'].push(n);
      } else if (dateStr === yesterdayStr) {
        groups['Yesterday'].push(n);
      } else if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        groups['This Month'].push(n);
      } else if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() - 1) {
        groups['Last Month'].push(n);
      } else {
        groups['Older'].push(n);
      }
    });

    return groups;
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
    this.applySearchAndFilter();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.activeFilter = 'ALL';
    this.activeCategory = 'ALL';
    this.startDate = '';
    this.endDate = '';
    this.sortOrder = 'desc';
    this.applySearchAndFilter();
  }

  /**
   * Action: Mark as Read & Navigate
   * When clicked, if it's unread, we update it via service first.
   */
  onNotificationClick(notif: NotificationLog): void {
  if (!notif.id) return;

  if (!notif.readStatus) {
    // 1. Mark as read in the backend
    this.notificationService.markAsRead(notif.id).subscribe({
      next: () => {
        // 2. Update the local property
        notif.readStatus = true;

        // 3. Update the sidebar count badge
        this.notificationService.updateUnreadCount();

        // 4. IMPORTANT: Re-run the grouping logic to force the UI to refresh the "New" badge
        this.groupedNotifications = this.groupNotifications(this.filteredNotifications);

        // 5. Navigate to the target page
        this.navigateToTarget(notif);
      },
      error: (err) => {
        console.error('Failed to mark as read', err);
        this.navigateToTarget(notif); // Navigate anyway
      }
    });
  } else {
    this.navigateToTarget(notif);
  }
}

  /**
   * Private Helper: Handles Redirection Logic
   */
  private navigateToTarget(notif: NotificationLog): void {
    if (notif.category === 'CLIENT' && notif.clientPhone) {
      this.router.navigate(['/clients', notif.clientPhone]);
    } else if (notif.category === 'CONTRACT' && notif.contractId) {
      this.router.navigate(['/contracts', notif.contractId]);
    } else if (notif.category === 'RESERVATION') {
      this.router.navigate(['/reservations']);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.loadNotifications()
    });
  }

  deleteNotification(id: number): void {
    if (confirm('Are you sure you want to permanently delete this notification log?')) {
      this.notificationService.deleteNotification(id).subscribe({
        next: () => this.loadNotifications()
      });
    }
  }
}