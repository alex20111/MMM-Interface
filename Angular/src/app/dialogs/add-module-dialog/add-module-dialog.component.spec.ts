import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddModuleDialogComponent } from './add-module-dialog.component';

describe('AddModuleDialogComponent', () => {
  let component: AddModuleDialogComponent;
  let fixture: ComponentFixture<AddModuleDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddModuleDialogComponent]
    });
    fixture = TestBed.createComponent(AddModuleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
