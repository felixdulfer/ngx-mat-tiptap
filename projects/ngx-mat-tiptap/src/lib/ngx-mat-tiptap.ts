import {
  Component,
  ElementRef,
  input,
  signal,
  NgZone,
  OnDestroy,
  viewChild,
  OnInit,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

@Component({
  selector: 'ngx-mat-tiptap',
  standalone: true,
  template: `
    <div
      #editorElement
      [id]="id"
      [attr.aria-describedby]="describedBy"
      [attr.aria-required]="required"
      [attr.aria-disabled]="disabled"
      class="tiptap-editor"
      (focusin)="onFocusIn()"
      (focusout)="onFocusOut($event)"
    ></div>
  `,
  styles: `
    .ngx-mat-tiptap {
      display: block;
    }

    .tiptap-editor {
      width: 100%;

      .tiptap.ProseMirror {
        p {
          margin: 0;
        }
      }
    }
  `,
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: NgxMatTiptap,
    },
  ],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ngx-mat-tiptap',
  },
})
export class NgxMatTiptap
  implements MatFormFieldControl<any>, ControlValueAccessor, OnDestroy, OnInit
{
  static nextId = 0;

  editorElement = viewChild<ElementRef<HTMLDivElement>>('editorElement');

  placeholderInput = input('');
  requiredInput = input(false);
  disabledInput = input(false);
  valueInput = input<any>('');

  // Injected dependencies
  public ngControl: NgControl | null = null;
  private _elementRef!: ElementRef<HTMLElement>;
  private _ngZone!: NgZone;

  // Internal writable signals for state management
  private _value = signal<any>('');
  private _disabled = signal(false);
  private editor: Editor | null = null;

  stateChanges = new Subject<void>();
  focused = false;
  touched = false;
  controlType = 'ngx-mat-tiptap';
  id = `ngx-mat-tiptap-${NgxMatTiptap.nextId++}`;
  describedBy = '';

  onChange = (_: any) => {};
  onTouched = () => {};

  // Properties to satisfy MatFormFieldControl interface
  get placeholder(): string {
    return this.placeholderInput();
  }

  get required(): boolean {
    return this.requiredInput();
  }

  get disabled(): boolean {
    return this._disabled();
  }

  get value(): any {
    return this._value();
  }

  constructor() {
    const ngControl = inject(NgControl, { optional: true, self: true });
    const _elementRef = inject(ElementRef<HTMLElement>);
    const _ngZone = inject(NgZone);

    this.ngControl = ngControl;
    this._elementRef = _elementRef;
    this._ngZone = _ngZone;

    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit() {
    this.initEditor();
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    if (this.editor) {
      this.editor.destroy();
    }
  }

  private initEditor() {
    const element = this.editorElement();
    if (!element) return;

    this.editor = new Editor({
      element: element.nativeElement,
      extensions: [StarterKit],
      content: this.value || '',
      editable: !this.disabled,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        this._value.set(html);
        this.onChange(html);
        this.stateChanges.next();
      },
      onFocus: () => {
        this.onFocusIn();
      },
      onBlur: () => {
        this.onFocusOut(new FocusEvent('blur'));
      },
    });
  }

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() !== 'div') {
      this.editor?.commands.focus();
    }
  }

  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ');
  }

  onFocusIn() {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  onFocusOut(event: FocusEvent) {
    if (
      !this._elementRef.nativeElement.contains(event.relatedTarget as Element)
    ) {
      this.touched = true;
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }
  }

  autoFocusNext(control: NgControl, event: KeyboardEvent): void {
    // Implementation for auto-focusing next control
  }

  autoFocusPrev(control: NgControl, event: KeyboardEvent): void {
    // Implementation for auto-focusing previous control
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
    if (this.editor) {
      this.editor.setEditable(!isDisabled);
    }
    this.stateChanges.next();
  }

  writeValue(value: any): void {
    this._value.set(value);
    if (this.editor && value !== this.editor.getHTML()) {
      this.editor.commands.setContent(value || '');
    }
    this.stateChanges.next();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  get empty(): boolean {
    return !this.value || this.value.length === 0 || this.value === '<p></p>';
  }

  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  get errorState(): boolean {
    return this.ngControl
      ? !!(this.ngControl.invalid && this.ngControl.touched)
      : false;
  }
}
