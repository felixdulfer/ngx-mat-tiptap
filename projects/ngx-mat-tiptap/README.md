# @felixdulfer/ngx-mat-tiptap

A rich text editor component for Angular Material applications built with TipTap.

## Installation

First, install the required peer dependencies:

```bash
npm install @tiptap/core @tiptap/starter-kit
```

Then install the component:

```bash
npm install @felixdulfer/ngx-mat-tiptap
```

## Basic Usage

### 1. Import the Component and Directive

```typescript
import { NgxMatTiptap, NgxMatTipTapFormFieldDirective } from "@felixdulfer/ngx-mat-tiptap";
```

### 2. Import the Styles

Import the library's CSS file for proper form field styling integration:

```typescript
// In angular.json (global styles)
"styles": [
  "node_modules/@felixdulfer/ngx-mat-tiptap/styles.css",
  // ... other styles
]

// Or in a component
@Component({
  // ...
  styleUrls: ['../../node_modules/@felixdulfer/ngx-mat-tiptap/styles.css']
})

// Or using SCSS import
@import "@felixdulfer/ngx-mat-tiptap/styles.css";
```

### 3. Use in Template

The editor does work stand-alone, but if this is what you are after, then better use ngx-tiptap instead.

```html
<ngx-mat-tiptap [(ngModel)]="content" />
```

### 4. With Angular Material Form Field

```html
<mat-form-field ngxMatTipTapFormField appearance="outline">
  <ngx-mat-tiptap formControlName="editorContent" />
  <mat-label>Rich Text Editor</mat-label>
</mat-form-field>
```

## Complete Example

```typescript
import { Component } from "@angular/core";
import { FormGroup, FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { NgxMatTiptap, NgxMatTipTapFormFieldDirective } from "@felixdulfer/ngx-mat-tiptap";
import { JsonPipe } from "@angular/common";

@Component({
  selector: "app-editor",
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, NgxMatTiptap, NgxMatTipTapFormFieldDirective, JsonPipe],
  template: `
    <form [formGroup]="form">
      <mat-form-field ngxMatTipTapFormField appearance="outline">
        <ngx-mat-tiptap formControlName="content" />
        <mat-label>Rich Text Editor</mat-label>
      </mat-form-field>
    </form>

    <div>
      <h3>Editor Content:</h3>
      <pre>{{ form.get("content")?.value | json }}</pre>
    </div>
  `,
})
export class EditorComponent {
  form = new FormGroup({
    content: new FormControl({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Hello, this is a rich text editor!",
            },
          ],
        },
      ],
    }),
  });
}
```

## Available Features

The editor includes the following formatting options:

- **Bold** - `Ctrl+B` or toolbar button
- **Italic** - `Ctrl+I` or toolbar button
- **Bullet Lists** - Toolbar button

## HTML Utilities

The library provides utility functions and components for working with TipTap content outside of the editor:

### Utility Functions

```typescript
import { generateHTMLFromTiptap, generateTiptapFromHTML, renderTiptapContent, isTiptapContentEmpty } from "@felixdulfer/ngx-mat-tiptap";

// Convert TipTap JSON to HTML
const html = generateHTMLFromTiptap(tiptapContent);

// Convert HTML to TipTap JSON
const tiptapJson = generateTiptapFromHTML("<p>Hello world</p>");

// Render with optional CSS class
const renderedHtml = renderTiptapContent(tiptapContent, "my-content-class");

// Check if content is empty
const isEmpty = isTiptapContentEmpty(tiptapContent);
```

### Angular Pipe

```html
<!-- In your template -->
<div [innerHTML]="tiptapContent | tiptapHtml"></div>
```

### Renderer Component

```html
<!-- Render TipTap content as HTML -->
<ngx-mat-tiptap-renderer [content]="tiptapContent" [cssClass]="'my-content'" />
```

## Form Field Integration

The library provides a directive `NgxMatTipTapFormFieldDirective` that can be applied to `mat-form-field` elements to ensure proper styling and behavior when using the TipTap editor within Angular Material form fields.

### Usage

```html
<mat-form-field ngxMatTipTapFormField appearance="outline">
  <ngx-mat-tiptap formControlName="content" />
  <mat-label>Rich Text Editor</mat-label>
</mat-form-field>
```

The directive automatically adds the CSS class `ngx-mat-tiptap-form-field` to the form field for proper styling integration. **Make sure to import the library's CSS file** as shown in the Installation section above for the styling to work correctly.

## Content Format

The editor uses TipTap's JSON format for content. The content structure follows the ProseMirror schema:

```typescript
{
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Your text content here'
        }
      ]
    }
  ]
}
```

## Requirements

- Angular 20.1.0 or higher
- Angular Material 20.1.0 or higher
- TipTap Core 2.26.1 or higher
- TipTap Starter Kit 2.26.1 or higher

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
