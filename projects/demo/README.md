# ngx-mat-tiptap Demo

A comprehensive demonstration of the `ngx-mat-tiptap` rich text editor component for Angular.

## 🚀 Live Demo

The demo is running at: `http://localhost:4201`

## 📋 Features Demonstrated

### 1. Basic Editor

- Simple text editor with JSON output format
- Custom placeholder text
- Real-time content change tracking
- Copy to clipboard functionality

### 2. Rich Editor

- Advanced editor with HTML output format
- Pre-populated with rich content including:
  - Headings (H1, H2)
  - Bold, italic, and code formatting
  - Bullet lists
  - Code blocks with syntax highlighting
- HTML output display

### 3. Read-only Editor

- Editor in read-only mode
- Perfect for displaying content without editing capabilities
- Shows the underlying content structure

### 4. Features Overview

- Material Design integration
- Responsive layout
- Multiple output formats (JSON/HTML)
- Configurable options
- Standalone component architecture

## 🛠️ Technical Details

### Dependencies

- Angular 20
- Angular Material
- ngx-tiptap
- @tiptap/core
- @tiptap/starter-kit

### Component Structure

```
app.component.ts     - Main demo component with multiple editor instances
app.component.html   - Template with tabbed interface
app.component.scss   - Responsive styling with Material Design
```

### Key Features

- **Tabbed Interface**: Organized demonstration of different editor modes
- **Real-time Output**: Live preview of editor content in different formats
- **Copy Functionality**: Easy copying of output content
- **Responsive Design**: Works on desktop and mobile devices
- **Material Design**: Consistent UI following Material Design principles

## 🎯 Usage Examples

### Basic Setup

```typescript
import { NgxMatTiptap, NgxMatTiptapConfig } from "ngx-mat-tiptap";

@Component({
  imports: [NgxMatTiptap],
  // ...
})
export class MyComponent {
  config: NgxMatTiptapConfig = {
    outputFormat: "json",
    editable: true,
    placeholder: "Start typing...",
  };
}
```

### Template Usage

```html
<ngx-mat-tiptap [content]="editorContent" [config]="config" (contentchange)="onContentChange($event)"> </ngx-mat-tiptap>
```

## 🎨 Styling

The demo includes comprehensive styling that demonstrates:

- Material Design integration
- Responsive grid layouts
- Hover effects and transitions
- Professional typography
- Consistent color scheme

## 📱 Responsive Design

The demo is fully responsive and includes:

- Mobile-first approach
- Flexible grid layouts
- Adaptive typography
- Touch-friendly interactions

## 🔧 Development

To run the demo locally:

```bash
# Install dependencies
npm install

# Build the library
ng build ngx-mat-tiptap

# Start the demo
ng serve demo --port 4201
```

## 📄 License

This demo is part of the ngx-mat-tiptap project and follows the same license terms.
