import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxMatTiptapRendererComponent } from './tiptap-renderer.component';
import * as tiptapUtils from './tiptap-utils';

@Component({
  template: `
    <ngx-mat-tiptap-renderer
      [content]="testContent"
      [cssClass]="testCssClass">
    </ngx-mat-tiptap-renderer>
  `,
  standalone: true,
  imports: [NgxMatTiptapRendererComponent]
})
class TestHostComponent {
  testContent: any = null;
  testCssClass: string = '';
}

describe('NgxMatTiptapRendererComponent', () => {
  let component: NgxMatTiptapRendererComponent;
  let fixture: ComponentFixture<NgxMatTiptapRendererComponent>;
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxMatTiptapRendererComponent, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxMatTiptapRendererComponent);
    component = fixture.componentInstance;

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;

    fixture.detectChanges();
    hostFixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render empty content when no content is provided', () => {
    expect(component.renderedHtml).toBe('');
  });

  it('should render simple paragraph content', () => {
    const tiptapContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello, world!'
            }
          ]
        }
      ]
    };

    hostComponent.testContent = tiptapContent;
    hostFixture.detectChanges();

    const renderedComponent = hostFixture.debugElement.query(
      (de) => de.componentInstance instanceof NgxMatTiptapRendererComponent
    )?.componentInstance as NgxMatTiptapRendererComponent;

    expect(renderedComponent.renderedHtml).toBe('<p>Hello, world!</p>');
  });

  it('should render content with bold text', () => {
    const tiptapContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'bold' }],
              text: 'Bold text'
            }
          ]
        }
      ]
    };

    hostComponent.testContent = tiptapContent;
    hostFixture.detectChanges();

    const renderedComponent = hostFixture.debugElement.query(
      (de) => de.componentInstance instanceof NgxMatTiptapRendererComponent
    )?.componentInstance as NgxMatTiptapRendererComponent;

    expect(renderedComponent.renderedHtml).toBe('<p><strong>Bold text</strong></p>');
  });

  it('should render content with italic text', () => {
    const tiptapContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'italic' }],
              text: 'Italic text'
            }
          ]
        }
      ]
    };

    hostComponent.testContent = tiptapContent;
    hostFixture.detectChanges();

    const renderedComponent = hostFixture.debugElement.query(
      (de) => de.componentInstance instanceof NgxMatTiptapRendererComponent
    )?.componentInstance as NgxMatTiptapRendererComponent;

    expect(renderedComponent.renderedHtml).toBe('<p><em>Italic text</em></p>');
  });

  it('should render bullet lists', () => {
    const tiptapContent = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'List item 1'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    hostComponent.testContent = tiptapContent;
    hostFixture.detectChanges();

    const renderedComponent = hostFixture.debugElement.query(
      (de) => de.componentInstance instanceof NgxMatTiptapRendererComponent
    )?.componentInstance as NgxMatTiptapRendererComponent;

    expect(renderedComponent.renderedHtml).toBe('<ul><li><p>List item 1</p></li></ul>');
  });

  it('should handle errors gracefully and render empty string', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error in tests
    jest.spyOn(tiptapUtils, 'generateHTMLFromTiptap').mockImplementation(() => {
      throw new Error('Invalid content');
    });

    const invalidContent = 'invalid content';
    hostComponent.testContent = invalidContent;
    hostFixture.detectChanges();

    const renderedComponent = hostFixture.debugElement.query(
      (de) => de.componentInstance instanceof NgxMatTiptapRendererComponent
    )?.componentInstance as NgxMatTiptapRendererComponent;

    expect(renderedComponent.renderedHtml).toBe('');
    expect(console.error).toHaveBeenCalled();
  });

  it('should apply CSS class when provided', () => {
    hostComponent.testCssClass = 'my-custom-class';
    hostFixture.detectChanges();

    const element = hostFixture.nativeElement.querySelector('.tiptap-rendered-content');
    expect(element.classList.contains('my-custom-class')).toBe(true);
  });

  it('should not apply CSS class when not provided', () => {
    hostFixture.detectChanges();

    const element = hostFixture.nativeElement.querySelector('.tiptap-rendered-content');
    expect(element.classList.length).toBe(1); // Only the default class
    expect(element.classList.contains('tiptap-rendered-content')).toBe(true);
  });
});
