import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InboxComponent } from './inbox';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('InboxComponent', () => {
  let component: InboxComponent;
  let fixture: ComponentFixture<InboxComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InboxComponent, HttpClientTestingModule, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(InboxComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should create the inbox component', () => {
    expect(component).toBeTruthy();
  });

  it('should load messages from the backend on init', () => {
    const mockMessages = [
      { id: 1, subject: 'Maintenance Required', senderEmail: 'tech@cti.tn', content: 'Check Rack 1', sentAt: new Date().toISOString(), isRead: false },
      { id: 2, subject: 'HR Update', senderEmail: 'hr@cti.tn', content: 'Policy update', sentAt: new Date().toISOString(), isRead: true }
    ];

    const req = httpMock.expectOne('http://localhost:8090/api/messages/inbox');
    expect(req.request.method).toBe('GET');
    req.flush(mockMessages);

    expect(component.messages.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should select a message and mark it as read', () => {
    const testMsg = { id: 99, subject: 'Test', isRead: false };
    component.messages = [testMsg];
    
    component.selectMessage(testMsg);

    expect(component.selectedMessage).toBe(testMsg);
    expect(testMsg.isRead).toBeTrue();

    const req = httpMock.expectOne('http://localhost:8090/api/messages/99/read');
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });
});