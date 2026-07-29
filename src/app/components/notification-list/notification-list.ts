import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationLog } from '../../services/notification';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-list.html',
  styleUrls: ['./notification-list.css']
})
export class NotificationListComponent implements OnInit {

  notifications: NotificationLog[] = [];

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (data: NotificationLog[]) => {
        this.notifications = data;
        // Automatically sync unread count on page load
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => {
        console.error('Failed to load notifications list', err);
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.loadNotifications(); // Reload to refresh visual styles
      },
      error: (err: any) => {
        console.error('Failed to mark all as read', err);
      }
    });
  }
}