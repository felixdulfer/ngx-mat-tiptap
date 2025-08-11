import { Component, inject } from '@angular/core';
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
import { NgxMatTiptap, NgxMatTipTapFormFieldDirective, NgxMatTiptapRendererComponent, generateHTMLFromTiptap } from 'ngx-mat-tiptap';
import { MatIconRegistry } from '@angular/material/icon';

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
    NgxMatTipTapFormFieldDirective,
    NgxMatTiptapRendererComponent,
  ],
})
export class AppComponent {

  matIconReg = inject(MatIconRegistry);

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
                text: 'Hello, Tiptap! This is a ',
              },
              {
                type: 'text',
                marks: [{ type: 'bold' }],
                text: 'rich text editor',
              },
              {
                type: 'text',
                text: ' with ',
              },
              {
                type: 'text',
                marks: [{ type: 'italic' }],
                text: 'formatting options',
              },
              {
                type: 'text',
                text: '.',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'You can create:',
              },
            ],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Bullet points',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Bold and ',
                      },
                      {
                        type: 'text',
                        marks: [{ type: 'italic' }],
                        text: 'italic text',
                      },
                    ],
                  },
                ],
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

  ngOnInit(): void {
    this.matIconReg.setDefaultFontSetClass('material-symbols-outlined');
  }

  getRawHtml(): string {
    const content = this.form.get('tiptapContent')?.value;
    if (!content) return '';
    try {
      return generateHTMLFromTiptap(content);
    } catch (error) {
      console.error('Error generating HTML:', error);
      return '';
    }
  }
}
