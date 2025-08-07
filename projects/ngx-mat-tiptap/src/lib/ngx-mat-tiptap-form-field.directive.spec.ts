import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxMatTipTapFormFieldDirective } from './ngx-mat-tiptap-form-field.directive';

@Component({
  template: '<div ngxMatTipTapFormField></div>',
  standalone: true,
  imports: [NgxMatTipTapFormFieldDirective],
})
class TestComponent {}

describe('NgxMatTipTapFormFieldDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add the ngx-mat-tiptap-form-field class to the host element', () => {
    const element = fixture.nativeElement.querySelector('div');
    expect(element.classList.contains('ngx-mat-tiptap-form-field')).toBe(true);
  });
});
