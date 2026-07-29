import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientEdit } from './client-edit';

describe('ClientEdit', () => {
  let component: ClientEdit;
  let fixture: ComponentFixture<ClientEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
