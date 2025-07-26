# ngx-mat-tiptap Demo

A demonstration of the `ngx-mat-tiptap` rich text editor component for Angular.

## 📋 Features Demonstrated

### Editor

Simple text editor with JSON output format

## 🛠️ Technical Details

### Dependencies

- Angular v20+
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
