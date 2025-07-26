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
  content = {
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

  config: NgxMatTiptapConfig = {
    outputFormat: 'html',
    editable: true,
    placeholder: 'Rich text editor with HTML output...',
  };

  output: any = this.content;

  onContentChange(content: any) {
    this.output = content;
  }

}
