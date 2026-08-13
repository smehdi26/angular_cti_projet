import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login'; // Ensure this matches your class name
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth';
import { By } from '@angular/platform-browser';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Import necessary modules for the login component
      imports: [
        LoginComponent, 
        ReactiveFormsModule, 
        RouterTestingModule, 
        HttpClientTestingModule
      ],
      providers: [AuthService]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * TDD TEST: GOOGLE OAUTH LINK
   * This test ensures that the UI provides the entry point for Social Login
   * pointing to our Spring Boot Backend.
   */
  it('should contain a Google Login link pointing to the Spring Boot OAuth endpoint', () => {
    // Look for an anchor tag with the specific Spring Security OAuth2 URL
    const googleLinkDe = fixture.debugElement.query(By.css('a[href*="oauth2/authorization/google"]'));
    
    expect(googleLinkDe).toBeTruthy();
    
    const htmlElement = googleLinkDe.nativeElement as HTMLAnchorElement;
    // Verify it targets your backend port 8090
    expect(htmlElement.href).toContain('http://localhost:8090/oauth2/authorization/google');
  });

  /**
   * TEST: MANUAL LOGIN FORM
   * Ensures the existing form functionality remains intact.
   */
  it('should have a valid form when email and password are filled', () => {
    component.loginForm.controls['email'].setValue('admin@cti-network.tn');
    component.loginForm.controls['password'].setValue('Lionelmessi10*');
    expect(component.loginForm.valid).toBeTruthy();
  });

  it('should show error message if login fails', () => {
    component.errorMessage = 'Invalid email address or secure password.';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.alert-danger')?.textContent).toContain('Invalid email address or secure password.');
  });
});