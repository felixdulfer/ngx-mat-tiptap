import { TiptapHtmlPipe } from './tiptap-html.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import * as tiptapUtils from './tiptap-utils';

describe('TiptapHtmlPipe', () => {
  let pipe: TiptapHtmlPipe;
  let sanitizer: any;

  beforeEach(() => {
    sanitizer = {
      bypassSecurityTrustHtml: jest.fn().mockReturnValue('sanitized-html')
    };
    pipe = new TiptapHtmlPipe(sanitizer);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null value', () => {
    const result = pipe.transform(null);
    expect(result).toBe('');
  });

  it('should return empty string for undefined value', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('');
  });

  it('should transform valid TipTap content to HTML', () => {
    const tiptapContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello, world!'
            }
          ]
        }
      ]
    };

    const result = pipe.transform(tiptapContent);
    expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith('<p>Hello, world!</p>');
    expect(result).toBe('sanitized-html');
  });

  it('should handle bold text in TipTap content', () => {
    const tiptapContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'bold' }],
              text: 'Bold text'
            }
          ]
        }
      ]
    };

    const result = pipe.transform(tiptapContent);
    expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith('<p><strong>Bold text</strong></p>');
    expect(result).toBe('sanitized-html');
  });

  it('should handle italic text in TipTap content', () => {
    const tiptapContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [{ type: 'italic' }],
              text: 'Italic text'
            }
          ]
        }
      ]
    };

    const result = pipe.transform(tiptapContent);
    expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith('<p><em>Italic text</em></p>');
    expect(result).toBe('sanitized-html');
  });

  it('should handle bullet lists in TipTap content', () => {
    const tiptapContent = {
      type: 'doc',
      content: [
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
                      text: 'List item'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    const result = pipe.transform(tiptapContent);
    expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith('<ul><li><p>List item</p></li></ul>');
    expect(result).toBe('sanitized-html');
  });

  it('should handle errors gracefully and return empty string', () => {
    // Mock a scenario where generateHTMLFromTiptap would throw an error
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error in tests
    jest.spyOn(tiptapUtils, 'generateHTMLFromTiptap').mockImplementation(() => {
      throw new Error('Invalid content');
    });

    const invalidContent = 'invalid content';
    const result = pipe.transform(invalidContent);

    expect(result).toBe('');
    expect(console.error).toHaveBeenCalled();
  });
});
