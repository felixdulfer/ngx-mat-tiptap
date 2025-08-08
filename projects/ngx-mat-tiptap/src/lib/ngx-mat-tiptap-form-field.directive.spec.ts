import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxMatTipTapFormFieldDirective } from './ngx-mat-tiptap-form-field.directive';
import { By } from '@angular/platform-browser';

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

  it('should not remove pre-existing classes on host element', () => {
    const host: HTMLElement = fixture.nativeElement.querySelector('div');
    host.classList.add('pre-existing');

    const dirDebug = fixture.debugElement.query(
      By.directive(NgxMatTipTapFormFieldDirective)
    );
    const directive = dirDebug.injector.get(NgxMatTipTapFormFieldDirective);

    // Re-run ngOnInit to simulate re-application; should keep existing classes
    directive.ngOnInit();

    expect(host.classList.contains('pre-existing')).toBe(true);
    expect(host.classList.contains('ngx-mat-tiptap-form-field')).toBe(true);
  });
});
