import { Component, OnInit } from '@angular/core';
// Added RouterLinkActive import below [1.2.1]
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router'; 
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth';
import { NotificationService } from './services/notification';

@Component({
  selector: 'app-root',
  standalone: true,
  // Added RouterLinkActive to the metadata array below [1.2.6]
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule], 
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  currentUrl: string = '';
  unreadCount: number = 0;
  currentUser: any = null;

  constructor(
    private router: Router, 
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.url;
      this.loadCurrentUser();
    });
  }

  ngOnInit(): void {
    this.notificationService.unreadCount$.subscribe((count: number) => {
      this.unreadCount = count;
    });

    this.notificationService.updateUnreadCount();
    this.loadCurrentUser();
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