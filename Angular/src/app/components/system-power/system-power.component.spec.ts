import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemPowerComponent } from './system-power.component';

describe('SystemPowerComponent', () => {
  let component: SystemPowerComponent;
  let fixture: ComponentFixture<SystemPowerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SystemPowerComponent]
    });
    fixture = TestBed.createComponent(SystemPowerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
