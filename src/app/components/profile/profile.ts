import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {

  profileForm!: FormGroup;
  currentUser: any = null;
  userStats: any = null; // Stores performance metrics
  isEditMode: boolean = false; // Toggles between Dashboard and Edit Form

  todayDate: Date = new Date(); 
  
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.minLength(8),
        Validators.pattern('^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).+$')
      ]],
      confirmPassword: ['']
    }, { validators: this.passwordMatchValidator });

    this.loadProfileAndStats();
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && password.value && confirmPassword && password.value !== confirmPassword.value) {
      return { 'mismatch': true };
    }
    return null;
  }

  loadProfileAndStats(): void {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUser = JSON.parse(userJson);

    // 1. Fetch User Stats (Performance Metrics)
    this.http.get(`http://localhost:8090/api/auth/user-stats?email=${this.currentUser.email}`, { withCredentials: true })
      .subscribe({
        next: (stats) => this.userStats = stats,
        error: (err) => console.error('Failed to load stats', err)
      });

    // 2. Fetch Fresh Profile Data for the Form
    this.authService.getProfile(this.currentUser.email).subscribe({
      next: (data: any) => {
        this.profileForm.patchValue({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        });
      }
    });
  }

  toggleEdit(): void {
    this.isEditMode = !this.isEditMode;
    this.successMessage = '';
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formValue = this.profileForm.value;
    const request = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      password: formValue.password || undefined,
      confirmPassword: formValue.confirmPassword || undefined
    };

    this.authService.updateProfile(this.currentUser.email, request).subscribe({
      next: () => {
        this.successMessage = 'Profile updated successfully!';
        this.errorMessage = '';
        this.profileForm.patchValue({ password: '', confirmPassword: '' });
        this.isEditMode = false; // Return to stats view
        this.loadProfileAndStats(); 
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => {
        this.successMessage = '';
        this.errorMessage = err.status === 409 ? 'Email already in use.' : 'Update failed.';
      }
    });
  }
}