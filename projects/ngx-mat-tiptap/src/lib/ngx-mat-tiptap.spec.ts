import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxMatTiptap } from './ngx-mat-tiptap';

describe('NgxMatTiptap', () => {
  let component: NgxMatTiptap;
  let fixture: ComponentFixture<NgxMatTiptap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxMatTiptap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxMatTiptap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
