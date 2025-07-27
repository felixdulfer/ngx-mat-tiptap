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
import { NgxMatTiptap } from '@felixdulfer/ngx-mat-tiptap';
```

### 2. Use in Template

```html
<ngx-mat-tiptap [(ngModel)]="content"></ngx-mat-tiptap>
```

### 3. With Angular Material Form Field

```html
<mat-form-field appearance="outline">
  <ngx-mat-tiptap formControlName="editorContent"></ngx-mat-tiptap>
  <mat-label>Rich Text Editor</mat-label>
</mat-form-field>
```

## Complete Example

```typescript
import { Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatTiptap } from '@felixdulfer/ngx-mat-tiptap';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, NgxMatTiptap],
  template: `
    <form [formGroup]="form">
      <mat-form-field appearance="outline">
        <ngx-mat-tiptap formControlName="content"></ngx-mat-tiptap>
        <mat-label>Rich Text Editor</mat-label>
      </mat-form-field>
    </form>
    
    <div>
      <h3>Editor Content:</h3>
      <pre>{{ form.get('content')?.value | json }}</pre>
    </div>
  `
})
export class EditorComponent {
  form = new FormGroup({
    content: new FormControl({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello, this is a rich text editor!'
            }
          ]
        }
      ]
    })
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

## Requirements

- Angular 20.1.0 or higher
- Angular Material 20.1.0 or higher
- TipTap Core 2.26.1 or higher
- TipTap Starter Kit 2.26.1 or higher

## Development

### Setup

```bash
git clone https://github.com/felixdulfer/ngx-mat-tiptap.git
cd ngx-mat-tiptap
npm install
```

### Building the Library

To build the library for development:

```bash
npm run build:lib
```

To build the library in watch mode (automatically rebuilds on changes):

```bash
npm run build:lib:watch
```

### Running the Demo

To start the demo application:

```bash
npm run demo
```

Navigate to `http://localhost:4200` to see the demo.

### Building the Demo

To build the demo for production:

```bash
npm run demo:build
```

### Testing

To run unit tests:

```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
