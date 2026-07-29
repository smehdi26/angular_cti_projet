import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth';
import { NotificationService } from './services/notification'; // Import this

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  currentUrl: string = '';
  unreadCount: number = 0; // Local unread counter property

  constructor(
    private router: Router, 
    private authService: AuthService,
    private notificationService: NotificationService // Inject this
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.url;
    });
  }

  ngOnInit(): void {
    // 1. Subscribe to the reactive unread counter stream [1.2.6]
    this.notificationService.unreadCount$.subscribe((count: number) => {
      this.unreadCount = count;
    });

    // 2. Query the initial unread count on startup
    this.notificationService.updateUnreadCount();
  }

  showSidebar(): boolean {
    return !this.currentUrl.includes('/login') && 
           !this.currentUrl.includes('/register') && 
           this.currentUrl !== '/';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}