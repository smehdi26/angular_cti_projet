import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientAdd } from './client-add';

describe('ClientAdd', () => {
  let component: ClientAdd;
  let fixture: ComponentFixture<ClientAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientAdd],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientAdd);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
