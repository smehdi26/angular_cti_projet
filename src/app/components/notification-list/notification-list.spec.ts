import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationListComponent } from './notification-list';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NotificationLog } from '../../services/notification';

describe('NotificationListComponent', () => {
  let component: NotificationListComponent;
  let fixture: ComponentFixture<NotificationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotificationListComponent, 
        HttpClientTestingModule, 
        RouterTestingModule
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should group notifications into correct chronological buckets', () => {
    const now = new Date();
    const yesterday = new Date(); yesterday.setDate(now.getDate() - 1);
    const lastMonth = new Date(); lastMonth.setMonth(now.getMonth() - 1);

    const mockNotifs: NotificationLog[] = [
      { id: 1, title: 'T1', message: 'msg', createdAt: now.toISOString(), readStatus: false, type: 'INFO', category: 'USER' },
      { id: 2, title: 'Y1', message: 'msg', createdAt: yesterday.toISOString(), readStatus: false, type: 'INFO', category: 'USER' },
      { id: 3, title: 'M1', message: 'msg', createdAt: lastMonth.toISOString(), readStatus: false, type: 'INFO', category: 'USER' }
    ];

    const grouped = component.groupNotifications(mockNotifs);

    expect(grouped['Today'].length).toBe(1);
    expect(grouped['Yesterday'].length).toBe(1);
    expect(grouped['Last Month'].length).toBe(1);
    expect(grouped['This Month'].length).toBe(0);
  });
});