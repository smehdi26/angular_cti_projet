import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification';

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
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // 1. Initialize empty form groups
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

    this.loadProfile();
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    // Validate only if password input is not empty [1.2.6]
    if (password && password.value && confirmPassword && password.value !== confirmPassword.value) {
      return { 'mismatch': true };
    }
    return null;
  }

  loadProfile(): void {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUser = JSON.parse(userJson);

    // Fetch fresh profile state from Spring
    this.authService.getProfile(this.currentUser.email).subscribe({
      next: (data: any) => {
        this.profileForm.patchValue({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        });
      },
      error: (err: any) => console.error('Failed to load profile parameters', err)
    });
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
      password: formValue.password || undefined, // Send password only if typed in [1.2.6]
      confirmPassword: formValue.confirmPassword || undefined
    };

    this.authService.updateProfile(this.currentUser.email, request).subscribe({
      next: () => {
        this.successMessage = 'Profile updated successfully!';
        this.errorMessage = '';
        this.profileForm.patchValue({ password: '', confirmPassword: '' }); // Clear fields
        this.loadProfile(); // Refresh reference
        this.notificationService.updateUnreadCount();
      },
      error: (err: any) => {
        this.successMessage = '';
        if (err.status === 409) {
          this.errorMessage = 'Email address is already in use.';
        } else {
          this.errorMessage = 'Failed to update profile. Please try again.';
        }
        console.error(err);
      }
    });
  }
}