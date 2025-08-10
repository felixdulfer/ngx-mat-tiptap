import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { generateHTMLFromTiptap } from './tiptap-utils';

/**
 * Angular pipe to render TipTap JSON content as HTML
 * Usage: {{ tiptapContent | tiptapHtml }}
 */
@Pipe({
  name: 'tiptapHtml',
  standalone: true,
  pure: false
})
export class TiptapHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: any): SafeHtml {
    if (!value) {
      return '';
    }

    try {
      const html = generateHTMLFromTiptap(value);
      return this.sanitizer.bypassSecurityTrustHtml(html);
    } catch (error) {
      console.error('Error in TiptapHtmlPipe:', error);
      return '';
    }
  }
}
