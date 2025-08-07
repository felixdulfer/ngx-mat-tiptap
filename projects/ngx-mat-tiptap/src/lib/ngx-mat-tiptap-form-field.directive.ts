import { Directive, ElementRef, OnInit, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[ngxMatTipTapFormField]',
  standalone: true,
})
export class NgxMatTipTapFormFieldDirective implements OnInit {
  private elementRef = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  ngOnInit(): void {
    // Add a CSS class to the host element
    this.renderer.addClass(this.elementRef.nativeElement, 'ngx-mat-tiptap-form-field');
  }
}
