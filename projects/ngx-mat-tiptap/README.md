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

**Note**: The `tiptapHtml` pipe returns a `SafeHtml` object. Use `[innerHTML]` binding when you want to render the HTML, or use `generateHTMLFromTiptap()` directly when you need the raw HTML string.

### Renderer Component

The `NgxMatTiptapRenderer` component provides a safe and easy way to render TipTap content as HTML with proper styling:

```html
<!-- Render TipTap content as HTML -->
<ngx-mat-tiptap-renderer [content]="tiptapContent" [cssClass]="'my-content'" />
```

**Component Properties:**
- `content`: The TipTap JSON content to render
- `cssClass`: Optional CSS class to apply to the rendered content

**Usage Example:**
```typescript
import { NgxMatTiptapRendererComponent } from "@felixdulfer/ngx-mat-tiptap";

@Component({
  // ...
  imports: [NgxMatTiptapRendererComponent],
  template: `
    <ngx-mat-tiptap-renderer 
      [content]="editorContent" 
      [cssClass]="'article-content'">
    </ngx-mat-tiptap-renderer>
  `
})
```

**Important Notes:**
- The renderer component automatically handles HTML sanitization for security
- Use `generateHTMLFromTiptap()` when you need the raw HTML string (e.g., for display in code blocks)
- Use the renderer component when you want to display the formatted content to users
- The component includes built-in CSS for proper typography and spacing

**When to Use Each Approach:**

1. **`generateHTMLFromTiptap()`**: Use when you need the raw HTML string for:
   - Displaying HTML code in `<pre><code>` blocks
   - Logging or debugging
   - Sending to APIs
   - Storing in databases

2. **`tiptapHtml` pipe**: Use when you want to render HTML in templates:
   - With `[innerHTML]` binding
   - When you need Angular's security features

3. **`NgxMatTiptapRenderer` component**: Use when you want to display formatted content:
   - In article previews
   - In content displays
   - When you want consistent styling
   - When you need the content to be user-facing

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
