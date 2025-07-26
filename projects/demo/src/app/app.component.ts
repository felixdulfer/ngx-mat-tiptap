import { Component, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxMatTiptap } from 'ngx-mat-tiptap';

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
  ],
})
export class AppComponent implements OnDestroy {
  form: FormGroup;

  constructor() {
    this.form = new FormGroup({
      tiptapContent: new FormControl({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hello, Tiptap!'
              }
            ]
          }
        ]
      }, [Validators.required]),
      regularText: new FormControl('', [Validators.required, Validators.minLength(5)])
    });

    // Subscribe to form value changes
    this.form.valueChanges.subscribe(values => {
      console.log('Form values changed:', values);
    });
  }

  ngOnDestroy(): void {
    // No need to destroy editor manually as it's handled by the component
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Form submitted:', this.form.value);
      alert('Form submitted successfully! Check console for values.');
    } else {
      console.log('Form is invalid:', this.form.errors);
      alert('Please fill in all required fields correctly.');
    }
  }

  resetForm(): void {
    this.form.reset({
      tiptapContent: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hello, Tiptap!'
              }
            ]
          }
        ]
      },
      regularText: ''
    });
  }
}
