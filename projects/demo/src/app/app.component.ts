import {
  Component,
  inject,
  AfterViewInit,
  AfterViewChecked,
} from '@angular/core';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  NgxMatTiptap,
  NgxMatTipTapFormFieldDirective,
  NgxMatTiptapRendererComponent,
  generateHTMLFromTiptap,
} from 'ngx-mat-tiptap';
import { MatIconRegistry } from '@angular/material/icon';
import * as Prism from 'prismjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    JsonPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMatTiptap,
    NgxMatTipTapFormFieldDirective,
    NgxMatTiptapRendererComponent,
  ],
})
export class AppComponent implements AfterViewInit, AfterViewChecked {
  matIconReg = inject(MatIconRegistry);

  form: FormGroup = new FormGroup({
    tiptapContent: new FormControl(
      {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hello, Tiptap! This is a ',
              },
              {
                type: 'text',
                marks: [{ type: 'bold' }],
                text: 'rich text editor',
              },
              {
                type: 'text',
                text: ' with ',
              },
              {
                type: 'text',
                marks: [{ type: 'italic' }],
                text: 'formatting options',
              },
              {
                type: 'text',
                text: '.',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'You can create:',
              },
            ],
          },
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
                        text: 'Bullet points',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Bold and ',
                      },
                      {
                        type: 'text',
                        marks: [{ type: 'italic' }],
                        text: 'italic text',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      [Validators.required],
    ),
    regularText: new FormControl('', [
      Validators.required,
      Validators.minLength(5),
    ]),
  });

  constructor() {
    this.form.valueChanges.subscribe((values) => {
      console.log('Form values changed:', values);
    });
  }

  ngOnInit(): void {
    this.matIconReg.setDefaultFontSetClass('material-symbols-outlined');
  }

  ngAfterViewInit(): void {
    this.highlightCode();
  }

  ngAfterViewChecked(): void {
    this.highlightCode();
  }

  getRawHtml(): string {
    const content = this.form.get('tiptapContent')?.value;
    if (!content) return '';
    try {
      const html = generateHTMLFromTiptap(content);
      return this.formatHTML(html);
    } catch (error) {
      console.error('Error generating HTML:', error);
      return '';
    }
  }

  private formatHTML(html: string): string {
    let indent = 0;
    const indentSize = 2;
    const lines: string[] = [];

    // Split HTML into individual tags and text
    const parts = html.match(/<[^>]*>|[^<]+/g) || [];

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('</')) {
        // Closing tag - decrease indent first
        indent -= indentSize;
        lines.push(' '.repeat(Math.max(0, indent)) + trimmed);
      } else if (trimmed.startsWith('<') && !trimmed.endsWith('/>')) {
        // Opening tag - add current indent, then increase
        lines.push(' '.repeat(Math.max(0, indent)) + trimmed);
        indent += indentSize;
      } else {
        // Self-closing tag or text content
        lines.push(' '.repeat(Math.max(0, indent)) + trimmed);
      }
    }

    return lines.join('\n');
  }

  private highlightCode(): void {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      try {
        if (typeof Prism !== 'undefined') {
          Prism.highlightAll();
          console.log('Prism.js highlighting applied');
        } else {
          console.warn('Prism.js not loaded');
        }
      } catch (error) {
        console.error('Error applying syntax highlighting:', error);
      }
    }, 100); // Increased timeout for better reliability
  }
}
