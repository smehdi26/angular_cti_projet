import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Required for ngModel filtering
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
  activeCategory: string = 'ALL'; // ALL | CLIENT | CONTRACT | RESERVATION [1.2.6]
  

  constructor(private notificationService: NotificationService) { }

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
        // Synchronize global sidebar unread badge on load [1.2.6]
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => {
        console.error('Failed to load notifications list', err);
      }
    });
  }

  // Instant in-memory filters matching severity levels and text inputs [1.2.6]
  applySearchAndFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    let temp = this.notifications;

    // 1. Filter by Severity Level
    if (this.activeFilter !== 'ALL') {
      temp = this.notifications.filter(n => n.type === this.activeFilter || (this.activeFilter === 'WARNING' && n.type === 'DANGER'));
    }

    // 2. Filter by Domain Category [1.2.6]
    if (this.activeCategory !== 'ALL') {
      temp = this.notifications.filter(n => n.category === this.activeCategory);
    }

    // 3. Filter by Search Keyword
    if (term) {
      temp = temp.filter(n => n.message.toLowerCase().includes(term));
    }

    this.filteredNotifications = temp;
  }

  changeFilter(filterType: string): void {
    this.activeFilter = filterType;
    this.applySearchAndFilter();
  }

  // Switch Category Tab [1.2.6]
  changeCategory(categoryType: string): void {
    this.activeCategory = categoryType;
    this.applySearchAndFilter();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.loadNotifications(); // Reload list to update visual unread status classes
      },
      error: (err: any) => {
        console.error('Failed to mark all as read', err);
      }
    });
  }

  deleteNotification(id: number): void {
    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        this.loadNotifications(); // Refresh list on successful delete
      },
      error: (err: any) => {
        console.error('Failed to delete notification log', err);
      }
    });
  }
}