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

### 1. Import the Component

```typescript
import { NgxMatTiptap } from "@felixdulfer/ngx-mat-tiptap";
```

### 2. Import the Styles (Optional)

If you need the custom form field styling, import the global styles:

```scss
@import "@felixdulfer/ngx-mat-tiptap/styles.css";
```

### 3. Use in Template

The editor does work stand-alone, but if this is what you are after, then better use ngx-tiptap instead.

```html
<ngx-mat-tiptap [(ngModel)]="content" />
```

### 4. With Angular Material Form Field

```html
<mat-form-field appearance="outline">
  <ngx-mat-tiptap formControlName="editorContent" />
  <mat-label>Rich Text Editor</mat-label>
</mat-form-field>
```

## Complete Example

```typescript
import { Component } from "@angular/core";
import { FormGroup, FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { NgxMatTiptap } from "@felixdulfer/ngx-mat-tiptap";
import { JsonPipe } from "@angular/common";

@Component({
  selector: "app-editor",
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, NgxMatTiptap, JsonPipe],
  template: `
    <form [formGroup]="form">
      <mat-form-field appearance="outline">
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

## Styling

The component includes built-in Material Design styling. You can customize the appearance by overriding CSS variables:

```scss
.ngx-mat-tiptap {
  --tiptap-editor-border-color: #e0e0e0;
  --tiptap-toolbar-background: #fafafa;
  --tiptap-button-active-color: #1976d2;
}
```

### Global Styles

The library provides global styles that can be imported manually in your main styles file:

```scss
@import "@felixdulfer/ngx-mat-tiptap/styles.css";
```

Or in your `angular.json`:

```json
{
  "styles": [
    "node_modules/@felixdulfer/ngx-mat-tiptap/styles.css"
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
