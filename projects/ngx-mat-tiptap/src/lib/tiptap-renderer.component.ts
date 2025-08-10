import { Component, input, ViewEncapsulation, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { generateHTMLFromTiptap } from './tiptap-utils';

/**
 * Component to render TipTap JSON content as HTML
 * Usage: <ngx-mat-tiptap-renderer [content]="tiptapContent" [cssClass]="'my-content'"></ngx-mat-tiptap-renderer>
 */
@Component({
  selector: 'ngx-mat-tiptap-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [class]="cssClass()"
      [innerHTML]="renderedHtml"
      class="tiptap-rendered-content">
    </div>
  `,
  styles: `
    .tiptap-rendered-content {
      line-height: 1.6;
    }

    .tiptap-rendered-content p {
      margin: 0 0 1rem 0;
    }

    .tiptap-rendered-content p:last-child {
      margin-bottom: 0;
    }

    .tiptap-rendered-content ul, .tiptap-rendered-content ol {
      margin: 0 0 1rem 1.5rem;
      padding: 0;
    }

    .tiptap-rendered-content li {
      margin-bottom: 0.25rem;
    }

    .tiptap-rendered-content strong {
      font-weight: 600;
    }

    .tiptap-rendered-content em {
      font-style: italic;
    }
  `,
  encapsulation: ViewEncapsulation.None
})
export class NgxMatTiptapRendererComponent {
  /**
   * The TipTap JSON content to render
   */
  content = input<any>(null);

  /**
   * Optional CSS class to apply to the rendered content
   */
  cssClass = input<string>('');

  /**
   * The rendered HTML content
   */
  renderedHtml = '';

  constructor() {
    // Use effect to automatically update rendered HTML when content changes
    effect(() => {
      this.updateRenderedHtml();
    });
  }

  private updateRenderedHtml(): void {
    if (!this.content()) {
      this.renderedHtml = '';
      return;
    }

    try {
      this.renderedHtml = generateHTMLFromTiptap(this.content());
    } catch (error) {
      console.error('Error rendering TipTap content:', error);
      this.renderedHtml = '';
    }
  }
}
