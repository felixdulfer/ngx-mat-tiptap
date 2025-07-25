import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

export interface NgxMatTiptapConfig {
  placeholder?: string;
  editable?: boolean;
  content?: string | object;
  outputFormat?: 'html' | 'json';
}

@Component({
  selector: 'ngx-mat-tiptap',
  standalone: true,
  imports: [CommonModule, TiptapEditorDirective],
  template: `
    <div class="mat-tiptap-container">
      <!-- Editor Content -->
      <div class="mat-tiptap-editor-container">
        <div
          tiptap
          [editor]="editor"
          [outputFormat]="config.outputFormat || 'html'"
          class="mat-tiptap-editor"
          [class.readonly]="!config.editable"
          (contentChange)="onContentChange($event)"
        ></div>
      </div>
    </div>
  `,
  styles: [
    `
      .mat-tiptap-container {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .mat-tiptap-editor-container {
        padding: 16px;
        min-height: 200px;
      }

      .mat-tiptap-editor {
        outline: none;
        min-height: 180px;
      }

      .mat-tiptap-editor.readonly {
        background-color: #f5f5f5;
        cursor: not-allowed;
      }

      /* TipTap Editor Styles */
      .mat-tiptap-editor .ProseMirror {
        outline: none;
        font-family: 'Roboto', sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: rgba(0, 0, 0, 0.87);
      }

      .mat-tiptap-editor .ProseMirror h1,
      .mat-tiptap-editor .ProseMirror h2,
      .mat-tiptap-editor .ProseMirror h3 {
        margin: 16px 0 8px 0;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
      }

      .mat-tiptap-editor .ProseMirror h1 {
        font-size: 24px;
      }

      .mat-tiptap-editor .ProseMirror h2 {
        font-size: 20px;
      }

      .mat-tiptap-editor .ProseMirror h3 {
        font-size: 18px;
      }

      .mat-tiptap-editor .ProseMirror p {
        margin: 8px 0;
      }

      .mat-tiptap-editor .ProseMirror ul,
      .mat-tiptap-editor .ProseMirror ol {
        margin: 8px 0;
        padding-left: 24px;
      }

      .mat-tiptap-editor .ProseMirror li {
        margin: 4px 0;
      }

      .mat-tiptap-editor .ProseMirror blockquote {
        border-left: 4px solid #3f51b5;
        margin: 16px 0;
        padding-left: 16px;
        color: rgba(0, 0, 0, 0.6);
        font-style: italic;
      }

      .mat-tiptap-editor .ProseMirror code {
        background-color: #f5f5f5;
        padding: 2px 4px;
        border-radius: 4px;
        font-family: 'Roboto Mono', monospace;
        font-size: 13px;
      }

      .mat-tiptap-editor .ProseMirror pre {
        background-color: #f5f5f5;
        padding: 16px;
        border-radius: 4px;
        overflow-x: auto;
        margin: 16px 0;
      }

      .mat-tiptap-editor .ProseMirror pre code {
        background-color: transparent;
        padding: 0;
      }

      .mat-tiptap-editor .ProseMirror a {
        color: #3f51b5;
        text-decoration: none;
      }

      .mat-tiptap-editor .ProseMirror a:hover {
        text-decoration: underline;
      }

      /* Placeholder styles */
      .mat-tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left;
        color: rgba(0, 0, 0, 0.38);
        pointer-events: none;
        height: 0;
      }
    `,
  ],
})
export class NgxMatTiptap implements OnInit {
  @Input() config: NgxMatTiptapConfig = {
    placeholder: 'Start typing...',
    editable: true,
  };

  @Input() content: string | object = '';
  @Output() contentChange = new EventEmitter<string | object>();

  editor = new Editor({
    extensions: [StarterKit as any],
    onUpdate: ({ editor }) => {
      const output =
        this.config.outputFormat === 'json'
          ? editor.getJSON()
          : editor.getHTML();
      this.contentChange.emit(output);
    },
  });

  ngOnInit() {
    if (this.content) {
      this.editor.commands.setContent(this.content);
    }
    this.editor.setEditable(this.config.editable ?? true);
  }

  onContentChange(content: any) {
    this.contentChange.emit(content);
  }
}
