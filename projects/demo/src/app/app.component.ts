import { Component } from '@angular/core';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
export class AppComponent {
  form: FormGroup = new FormGroup({
    tiptapContent: new FormControl(
      {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hello, Tiptap!',
              },
            ],
          },
        ],
      },
      [Validators.required]
    ),
    regularText: new FormControl('', [
      Validators.required,
      Validators.minLength(5),
    ]),
  });

  constructor() {
    this.form.valueChanges.subscribe((values) => {
      console.log('Form values changed:', values);
    });
  }
}
