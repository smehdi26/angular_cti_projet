import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService, User } from './services/auth';
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
  currentUser: User | null = null;
  initialized: boolean = false; // Prevents "401 wall" on startup

  constructor(
    private router: Router, 
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.url;
    });
  }

  ngOnInit(): void {
    // 1. Listen for session changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // 2. Ask backend "Who am I?" on every refresh
    this.authService.getMe().subscribe({
      next: (user) => {
        this.initialized = true;
        this.notificationService.updateUnreadCount();
      },
      error: () => {
        this.initialized = true;
        if (this.showSidebar()) {
          this.router.navigate(['/login']);
        }
      }
    });

    this.notificationService.unreadCount$.subscribe(count => this.unreadCount = count);
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