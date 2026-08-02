import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth';
import { NotificationService } from './services/notification';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  currentUrl: string = '';
  unreadCount: number = 0;
  currentUser: any = null; // Reactive property bound to the global sidebar footer card

  constructor(
    private router: Router, 
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    // Track active route changes to handle sidebar rendering dynamically [1.2.1]
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.url;
      this.loadCurrentUser(); // Keep current user data state refreshed on navigation
    });
  }

  ngOnInit(): void {
    // 1. Subscribe to the reactive unread notification counter stream [1.2.6]
    this.notificationService.unreadCount$.subscribe((count: number) => {
      this.unreadCount = count;
    });

    // 2. Subscribe to the reactive session user profile stream [1.2.6]
    this.authService.currentUser$.subscribe((user: any) => {
      this.currentUser = user;
    });

    // 3. Trigger initial queries on startup
    this.notificationService.updateUnreadCount();
    this.authService.updateCurrentUserInSidebar();
  }

  loadCurrentUser(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      this.currentUser = JSON.parse(userJson);
    } else {
      this.currentUser = null;
    }
  }

  showSidebar(): boolean {
    return !this.currentUrl.includes('/login') && 
           !this.currentUrl.includes('/register') && 
           this.currentUrl !== '/';
  }

  logout(): void {
    this.authService.logout();
    this.currentUser = null;
    this.router.navigate(['/login']);
  }
}