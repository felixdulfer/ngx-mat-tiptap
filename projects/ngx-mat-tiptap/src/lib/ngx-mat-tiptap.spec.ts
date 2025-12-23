import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxMatTiptap } from './ngx-mat-tiptap';
import { Editor } from '@tiptap/core';
import { NgZone } from '@angular/core';

function createMockEditor(options?: {
  isBoldActive?: boolean;
  isItalicActive?: boolean;
  isBulletListActive?: boolean;
  getJSONReturn?: any;
}) {
  const run = jest.fn();
  const toggleBold = jest.fn().mockReturnValue({ run });
  const toggleItalic = jest.fn().mockReturnValue({ run });
  const toggleBulletList = jest.fn().mockReturnValue({ run });
  const focusChain = {
    toggleBold,
    toggleItalic,
    toggleBulletList,
    run,
  } as any;
  const chain = jest.fn().mockReturnValue({
    focus: jest.fn().mockReturnValue(focusChain),
  });

  const setEditable = jest.fn();
  const destroy = jest.fn();
  const getJSON = jest.fn().mockReturnValue(options?.getJSONReturn ?? {});
  const commands = {
    setContent: jest.fn(),
    focus: jest.fn(),
  } as any;
  const isActive = jest.fn().mockImplementation((name: string) => {
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
    jest.spyOn(NgxMatTiptap.prototype as any, 'initEditor').mockImplementation(() => {});

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
    expect(component.focused).toBe(true);
    expect(emits).toBeGreaterThan(0);

    const before = emits;
    component.onFocusIn();
    expect(component.focused).toBe(true);
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

    expect(component.touched).toBe(true);
    expect(component.focused).toBe(false);
    document.body.removeChild(outsideEl);
  });

  it('empty should reflect content structure', () => {
    component.writeValue(undefined as any);
    expect(component.empty).toBe(true);

    component.writeValue({});
    expect(component.empty).toBe(true);

    component.writeValue({ content: [] });
    expect(component.empty).toBe(true);

    component.writeValue({ content: [{ type: 'paragraph', content: [] }] });
    expect(component.empty).toBe(true);

    component.writeValue({
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hi' }] },
      ],
    });
    expect(component.empty).toBe(false);
  });

  it('shouldLabelFloat should be true when focused or not empty', () => {
    component.writeValue({});
    expect(component.shouldLabelFloat).toBe(false);

    component.onFocusIn();
    expect(component.shouldLabelFloat).toBe(true);

    const outsideEl = document.createElement('div');
    const fakeEvent = { relatedTarget: outsideEl } as unknown as FocusEvent;
    component.onFocusOut(fakeEvent);
    component.writeValue({
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'x' }] },
      ],
    });
    expect(component.shouldLabelFloat).toBe(true);
  });

  it('errorState should depend on ngControl validity and touched', () => {
    (component as any).ngControl = { invalid: true, touched: true } as any;
    expect(component.errorState).toBe(true);

    (component as any).ngControl = { invalid: false, touched: true } as any;
    expect(component.errorState).toBe(false);

    (component as any).ngControl = null;
    expect(component.errorState).toBe(false);
  });

  it('setDisabledState should update internal state and editor editable', () => {
    const mockEditor = createMockEditor();
    component.editor = mockEditor;

    let emits = 0;
    const sub = component.stateChanges.subscribe(() => emits++);

    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
    expect(mockEditor.setEditable).toHaveBeenCalledWith(false);

    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
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

    expect(component.isBoldActive()).toBe(true);
    expect(component.isItalicActive()).toBe(false);
    expect(component.isBulletListActive()).toBe(true);
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

    it('should handle onContainerClick when clicking div element', () => {
    const mockEditor = createMockEditor();
    component.editor = mockEditor;

    const div = document.createElement('div');
    const event = { target: div } as unknown as MouseEvent;

    component.onContainerClick(event);

    expect(mockEditor.commands.focus).not.toHaveBeenCalled();
  });

  it('should handle onFocusOut when focus stays within host element', () => {
    component.onFocusIn();

    // Create a mock element ref
    const mockElement = document.createElement('div');
    const insideEl = document.createElement('span');
    mockElement.appendChild(insideEl);

    // Mock the elementRef
    (component as any)._elementRef = { nativeElement: mockElement };

    const fakeEvent = {
      relatedTarget: insideEl,
    } as unknown as FocusEvent;

    component.onFocusOut(fakeEvent);

    expect(component.touched).toBe(false);
    expect(component.focused).toBe(true);
  });

  it('should test autoFocusNext and autoFocusPrev methods', () => {
    const mockControl = {} as any;
    const mockEvent = {} as KeyboardEvent;

    // These methods are currently empty implementations
    expect(() => component.autoFocusNext(mockControl, mockEvent)).not.toThrow();
    expect(() => component.autoFocusPrev(mockControl, mockEvent)).not.toThrow();
  });

  it('should test registerOnChange and registerOnTouched', () => {
    const mockChangeFn = jest.fn();
    const mockTouchedFn = jest.fn();

    component.registerOnChange(mockChangeFn);
    component.registerOnTouched(mockTouchedFn);

    // Test that the functions are called when appropriate
    component.onChange('test');
    component.onTouched();

    expect(mockChangeFn).toHaveBeenCalledWith('test');
    expect(mockTouchedFn).toHaveBeenCalled();
  });

  it('should test getter properties', () => {
    // Test placeholder getter
    expect(component.placeholder).toBe('');

    // Test required getter
    expect(component.required).toBe(false);

    // Test disabled getter
    expect(component.disabled).toBe(false);

    // Test value getter
    expect(component.value).toBe('');
  });

  it('should test writeValue when editor exists and value differs', () => {
    const mockEditor = createMockEditor({ getJSONReturn: { content: [] } });
    component.editor = mockEditor;

    const newValue = { content: [{ type: 'paragraph', content: [] }] };
    component.writeValue(newValue);

    expect(component.value).toEqual(newValue);
    expect(mockEditor.commands.setContent).toHaveBeenCalled();
  });

  it('should test writeValue when editor exists but value is same', () => {
    const sameValue = { content: [] };
    const mockEditor = createMockEditor({ getJSONReturn: sameValue });
    component.editor = mockEditor;

    component.writeValue(sameValue);

    expect(component.value).toEqual(sameValue);
    expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
  });

  it('should test writeValue when editor does not exist', () => {
    component.editor = null;

    const newValue = { content: [] };
    component.writeValue(newValue);

    expect(component.value).toEqual(newValue);
  });

  it('should test setDisabledState when editor exists', () => {
    const mockEditor = createMockEditor();
    component.editor = mockEditor;

    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
    expect(mockEditor.setEditable).toHaveBeenCalledWith(false);

    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
    expect(mockEditor.setEditable).toHaveBeenCalledWith(true);
  });

      it('should test setDisabledState when editor does not exist', () => {
    component.editor = null;

    component.setDisabledState(true);
    expect(component.disabled).toBe(true);

    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
  });

    it('should test ngOnInit calls initEditor', () => {
    const initEditorSpy = jest.spyOn(component as any, 'initEditor');

    component.ngOnInit();

    expect(initEditorSpy).toHaveBeenCalled();
  });

  it('should test initEditor when element is not available', () => {
    // Mock the editorElement signal to return null
    (component.editorElement as any).get = jest.fn().mockReturnValue(null);

    (component as any).initEditor();

    expect(component.editor).toBeNull();
  });

  describe('shouldShowToolbar', () => {
    it('should return false when editor is empty and not focused', () => {
      component.writeValue({});
      component.focused = false;

      expect(component.shouldShowToolbar).toBe(false);
    });

    it('should return false when editor has content but is not focused', () => {
      component.writeValue({
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'hi' }] },
        ],
      });
      component.focused = false;

      expect(component.shouldShowToolbar).toBe(false);
    });

    it('should return false when editor is focused but empty', () => {
      component.writeValue({});
      component.focused = true;

      expect(component.shouldShowToolbar).toBe(false);
    });

    it('should return true when user types content and editor is focused', () => {
      // Start with empty content
      component.writeValue({});
      component.focused = true;

      // Simulate user typing by triggering onUpdate callback
      const mockEditor = createMockEditor();
      component.editor = mockEditor;
      
      // Simulate the onUpdate callback directly
      (component as any)._userHasTyped.set(true);
      (component as any)._value.set({
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'hi' }] },
        ],
      });

      expect(component.shouldShowToolbar).toBe(true);
    });

    it('should return false on initialization with pre-existing content without focus', () => {
      // Simulate initialization with content (no user typing yet)
      component.writeValue({
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'existing' }] },
        ],
      });
      component.focused = false;

      expect(component.shouldShowToolbar).toBe(false);
    });

    it('should return false on initialization with pre-existing content even with focus', () => {
      // Simulate initialization with content (no user typing yet)
      component.writeValue({
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'existing' }] },
        ],
      });
      component.focused = true;

      expect(component.shouldShowToolbar).toBe(false);
    });

    it('should return true when user adds content to initially empty editor', () => {
      // Start with empty content (initially empty)
      component.writeValue({});
      component.focused = true;

      // User types content
      (component as any)._userHasTyped.set(true);
      (component as any)._value.set({
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'new content' }] },
        ],
      });

      expect(component.shouldShowToolbar).toBe(true);
    });

    it('should work correctly for empty -> content -> empty -> content cycle', () => {
      component.focused = true;
      
      // Initially empty
      component.writeValue({});
      expect(component.shouldShowToolbar).toBe(false);

      // User types content
      (component as any)._userHasTyped.set(true);
      (component as any)._value.set({
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'content' }] },
        ],
      });
      expect(component.shouldShowToolbar).toBe(true);

      // User deletes content
      (component as any)._value.set({});
      expect(component.shouldShowToolbar).toBe(false);

      // User types again
      (component as any)._value.set({
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'new content' }] },
        ],
      });
      expect(component.shouldShowToolbar).toBe(true);
    });
  });
});
