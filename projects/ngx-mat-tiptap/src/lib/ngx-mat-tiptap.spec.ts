import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxMatTiptap } from './ngx-mat-tiptap';

function createMockEditor(options?: {
  isBoldActive?: boolean;
  isItalicActive?: boolean;
  isBulletListActive?: boolean;
  getJSONReturn?: any;
}) {
  const run = jasmine.createSpy('run');
  const toggleBold = jasmine.createSpy('toggleBold').and.returnValue({ run });
  const toggleItalic = jasmine
    .createSpy('toggleItalic')
    .and.returnValue({ run });
  const toggleBulletList = jasmine
    .createSpy('toggleBulletList')
    .and.returnValue({ run });
  const focusChain = {
    toggleBold,
    toggleItalic,
    toggleBulletList,
    run,
  } as any;
  const chain = jasmine.createSpy('chain').and.returnValue({
    focus: jasmine.createSpy('focus').and.returnValue(focusChain),
  });

  const setEditable = jasmine.createSpy('setEditable');
  const destroy = jasmine.createSpy('destroy');
  const getJSON = jasmine
    .createSpy('getJSON')
    .and.returnValue(options?.getJSONReturn ?? {});
  const commands = {
    setContent: jasmine.createSpy('setContent'),
    focus: jasmine.createSpy('commands.focus'),
  } as any;
  const isActive = jasmine
    .createSpy('isActive')
    .and.callFake((name: string) => {
      if (name === 'bold') return !!options?.isBoldActive;
      if (name === 'italic') return !!options?.isItalicActive;
      if (name === 'bulletList') return !!options?.isBulletListActive;
      return false;
    });

  return {
    chain,
    commands,
    isActive,
    setEditable,
    destroy,
    getJSON,
  } as any;
}

describe('NgxMatTiptap', () => {
  let component: NgxMatTiptap;
  let fixture: ComponentFixture<NgxMatTiptap>;

  beforeEach(async () => {
    spyOn<any>(NgxMatTiptap.prototype as any, 'initEditor').and.callFake(() => {});

    await TestBed.configureTestingModule({
      imports: [NgxMatTiptap],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxMatTiptap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set describedBy from ids', () => {
    component.setDescribedByIds(['a', 'b', 'c']);
    expect(component.describedBy).toBe('a b c');
  });

  it('onFocusIn should set focused once and emit', () => {
    let emits = 0;
    const sub = component.stateChanges.subscribe(() => emits++);
    component.onFocusIn();
    expect(component.focused).toBeTrue();
    expect(emits).toBeGreaterThan(0);

    const before = emits;
    component.onFocusIn();
    expect(component.focused).toBeTrue();
    expect(emits).toBe(before);
    sub.unsubscribe();
  });

  it('onFocusOut should mark touched when focus leaves host', () => {
    component.onFocusIn();
    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);

    const fakeEvent = {
      relatedTarget: outsideEl,
    } as unknown as FocusEvent;

    component.onFocusOut(fakeEvent);

    expect(component.touched).toBeTrue();
    expect(component.focused).toBeFalse();
    document.body.removeChild(outsideEl);
  });

  it('empty should reflect content structure', () => {
    component.writeValue(undefined as any);
    expect(component.empty).toBeTrue();

    component.writeValue({});
    expect(component.empty).toBeTrue();

    component.writeValue({ content: [] });
    expect(component.empty).toBeTrue();

    component.writeValue({ content: [{ type: 'paragraph', content: [] }] });
    expect(component.empty).toBeTrue();

    component.writeValue({
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hi' }] },
      ],
    });
    expect(component.empty).toBeFalse();
  });

  it('shouldLabelFloat should be true when focused or not empty', () => {
    component.writeValue({});
    expect(component.shouldLabelFloat).toBeFalse();

    component.onFocusIn();
    expect(component.shouldLabelFloat).toBeTrue();

    const outsideEl = document.createElement('div');
    const fakeEvent = { relatedTarget: outsideEl } as unknown as FocusEvent;
    component.onFocusOut(fakeEvent);
    component.writeValue({
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'x' }] },
      ],
    });
    expect(component.shouldLabelFloat).toBeTrue();
  });

  it('errorState should depend on ngControl validity and touched', () => {
    (component as any).ngControl = { invalid: true, touched: true } as any;
    expect(component.errorState).toBeTrue();

    (component as any).ngControl = { invalid: false, touched: true } as any;
    expect(component.errorState).toBeFalse();

    (component as any).ngControl = null;
    expect(component.errorState).toBeFalse();
  });

  it('setDisabledState should update internal state and editor editable', () => {
    const mockEditor = createMockEditor();
    component.editor = mockEditor;

    let emits = 0;
    const sub = component.stateChanges.subscribe(() => emits++);

    component.setDisabledState(true);
    expect(component.disabled).toBeTrue();
    expect(mockEditor.setEditable).toHaveBeenCalledWith(false);

    component.setDisabledState(false);
    expect(component.disabled).toBeFalse();
    expect(mockEditor.setEditable).toHaveBeenCalledWith(true);
    expect(emits).toBeGreaterThan(0);
    sub.unsubscribe();
  });

  it('writeValue should set value and call setContent when editor exists and differs', () => {
    const mockEditor = createMockEditor({ getJSONReturn: { content: [] } });
    component.editor = mockEditor;

    const newValue = {
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'abc' }] },
      ],
    } as any;

    component.writeValue(newValue);
    expect(component.value).toEqual(newValue);
    expect(mockEditor.commands.setContent).toHaveBeenCalled();
  });

  it('toolbar helpers should reflect editor isActive state', () => {
    const mockEditor = createMockEditor({
      isBoldActive: true,
      isItalicActive: false,
      isBulletListActive: true,
    });
    component.editor = mockEditor;

    expect(component.isBoldActive()).toBeTrue();
    expect(component.isItalicActive()).toBeFalse();
    expect(component.isBulletListActive()).toBeTrue();
  });

  it('toggle methods should chain and run when editor exists', () => {
    const mockEditor = createMockEditor();
    component.editor = mockEditor;

    component.toggleBold();
    component.toggleItalic();
    component.toggleBulletList();

    expect(mockEditor.chain).toHaveBeenCalled();
  });

  it('onContainerClick should focus the editor when clicking non-div elements', () => {
    const mockEditor = createMockEditor();
    component.editor = mockEditor;

    const span = document.createElement('span');
    const event = { target: span } as unknown as MouseEvent;
    component.onContainerClick(event);

    expect(mockEditor.commands.focus).toHaveBeenCalled();
  });

  it('ngOnDestroy should destroy editor when present', () => {
    const mockEditor = createMockEditor();
    component.editor = mockEditor;

    component.ngOnDestroy();
    expect(mockEditor.destroy).toHaveBeenCalled();
  });
});
