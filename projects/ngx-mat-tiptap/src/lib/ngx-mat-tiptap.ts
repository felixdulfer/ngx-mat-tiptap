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
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'ngx-mat-tiptap',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatDividerModule],
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
    <div class="expander" [class.expanded]="!empty">
      <div class="expander-content">
        <mat-divider class="divider" />
        <div class="tiptap-toolbar">
          <button
            matIconButton
            type="button"
            class="toolbar-btn"
            [class.active]="isBoldActive()"
            (click)="toggleBold()"
            [disabled]="disabled"
            title="Bold"
          >
            <mat-icon>format_bold</mat-icon>
          </button>
          <button
            matIconButton
            type="button"
            class="toolbar-btn"
            [class.active]="isItalicActive()"
            (click)="toggleItalic()"
            [disabled]="disabled"
            title="Italic"
          >
            <mat-icon>format_italic</mat-icon>
          </button>
          <button
            matIconButton
            type="button"
            class="toolbar-btn"
            [class.active]="isBulletListActive()"
            (click)="toggleBulletList()"
            [disabled]="disabled"
            title="Bullet List"
          >
            <mat-icon>format_list_bulleted</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .ngx-mat-tiptap {
      display: block;
      position: relative;
      margin: 0 -1rem;
    }

    .tiptap-editor {
      width: 100%;

      .tiptap.ProseMirror {
        padding: 0 1rem;
        outline: 0;
        p {
          margin: 0;
        }
      }
    }

    .divider-spacer {
    }

    mat-divider.divider {
      margin: 0.75rem 0 0 0;
      opacity: 0.3;
    }

    .expander {
      display: grid;
      grid-template-rows: 0fr;
      overflow: hidden;
      transition: grid-template-rows 0.2s;
    }

    .expander-content {
      min-height: 0;
      transition: visibility 0.2s;
      visibility: hidden;
    }

    .expander.expanded {
      grid-template-rows: 1fr;
    }

    .expander.expanded .expander-content {
      visibility: visible;
    }

    .tiptap-toolbar {
      display: flex !important;
      gap: 4px;
      margin-top: 4px;
      padding: 0 8px;

      .toolbar-btn {
        --mat-icon-button-container-shape: 12px;
        --mat-icon-button-state-layer-size: 32px;
        --mat-icon-button-icon-size: 24px;

        &.active {
          background-color: var(--mat-sys-primary);
          color: var(--mat-sys-on-primary);
        }

        &.mat-mdc-icon-button .mat-mdc-button-touch-target {
          width: 20px;
          height: 20px;
        }

        .mat-icon {
          width: unset;
          height: unset;
          font-size: 20px;
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
  public editor: Editor | null = null;

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
      content: this.value || null,
      editable: !this.disabled,
      onUpdate: ({ editor }) => {
        const json = editor.getJSON();
        this._value.set(json);
        this.onChange(json);
        this.stateChanges.next();
      },
      onFocus: () => {
        this.onFocusIn();
      },
      onBlur: () => {
        this.onFocusOut(new FocusEvent('blur'));
      },
    });

    console.log('Editor initialized:', this.editor);
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
    if (this.editor && value !== this.editor.getJSON()) {
      this.editor.commands.setContent(value || null);
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
    return (
      !this.value ||
      (typeof this.value === 'object' &&
        (!this.value.content ||
          (Array.isArray(this.value.content) &&
            this.value.content.length === 0) ||
          (Array.isArray(this.value.content) &&
            this.value.content.length === 1 &&
            this.value.content[0].type === 'paragraph' &&
            (!this.value.content[0].content ||
              this.value.content[0].content.length === 0))))
    );
  }

  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  get errorState(): boolean {
    return this.ngControl
      ? !!(this.ngControl.invalid && this.ngControl.touched)
      : false;
  }

  // Toolbar helper methods
  isBoldActive(): boolean {
    return this.editor?.isActive('bold') || false;
  }

  isItalicActive(): boolean {
    return this.editor?.isActive('italic') || false;
  }

  isBulletListActive(): boolean {
    return this.editor?.isActive('bulletList') || false;
  }

  toggleBold(): void {
    console.log('Toggle bold clicked, editor:', this.editor);
    this.editor?.chain().focus().toggleBold().run();
  }

  toggleItalic(): void {
    this.editor?.chain().focus().toggleItalic().run();
  }

  toggleBulletList(): void {
    this.editor?.chain().focus().toggleBulletList().run();
  }
}
