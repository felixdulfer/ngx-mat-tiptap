import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { MatChipsModule } from '@angular/material/chips';
import { NgxMatTiptap, NgxMatTiptapConfig } from 'ngx-mat-tiptap';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    NgxMatTiptap,
  ],
})
export class AppComponent {
  title = 'ngx-mat-tiptap Demo';

  // Basic editor content
  basicContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'This is a basic editor with rich text formatting capabilities. You can edit this content and see the changes in real-time.',
          },
        ],
      },
    ],
  };

  // Rich content with various elements
  richContent = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Rich Text Editor Demo' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'This editor supports ' },
          { type: 'text', marks: [{ type: 'bold' }], text: 'bold' },
          { type: 'text', text: ', ' },
          { type: 'text', marks: [{ type: 'italic' }], text: 'italic' },
          { type: 'text', text: ', and ' },
          { type: 'text', marks: [{ type: 'code' }], text: 'code' },
          { type: 'text', text: ' formatting.' },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Features' }],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Rich text formatting' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Headings and paragraphs' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Lists and code blocks' }],
              },
            ],
          },
        ],
      },
      {
        type: 'codeBlock',
        attrs: { language: 'typescript' },
        content: [
          {
            type: 'text',
            text: "// Example code block\nconst editor = new NgxMatTiptap({\n  outputFormat: 'json'\n});",
          },
        ],
      },
    ],
  };

  // Read-only content
  readonlyContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'This is a read-only editor. The content cannot be modified.',
          },
        ],
      },
    ],
  };

  // Editor configurations
  basicConfig: NgxMatTiptapConfig = {
    outputFormat: 'json',
    editable: true,
    placeholder: 'Start typing your content...',
  };

  richConfig: NgxMatTiptapConfig = {
    outputFormat: 'html',
    editable: true,
    placeholder: 'Rich text editor with HTML output...',
  };

  readonlyConfig: NgxMatTiptapConfig = {
    outputFormat: 'json',
    editable: false,
  };

  // Output content
  basicOutput: any = this.basicContent;
  richOutput: any = this.richContent;
  readonlyOutput: any = this.readonlyContent;

  // Event handlers
  onBasicContentChange(content: any) {
    this.basicOutput = content;
  }

  onRichContentChange(content: any) {
    this.richOutput = content;
  }

  onReadonlyContentChange(content: any) {
    this.readonlyOutput = content;
  }

  // Utility methods
  getOutputAsString(output: any): string {
    return typeof output === 'string'
      ? output
      : JSON.stringify(output, null, 2);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Content copied to clipboard');
    });
  }
}
