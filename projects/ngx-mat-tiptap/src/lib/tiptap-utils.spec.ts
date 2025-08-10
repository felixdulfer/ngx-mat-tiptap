import { generateHTMLFromTiptap, generateTiptapFromHTML, renderTiptapContent, isTiptapContentEmpty } from './tiptap-utils';

describe('TiptapUtils', () => {
  describe('generateHTMLFromTiptap', () => {
    it('should generate HTML from valid TipTap JSON content', () => {
      const jsonContent = {
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

      const result = generateHTMLFromTiptap(jsonContent);
      expect(result).toBe('<p>Hello, world!</p>');
    });

    it('should handle bold text', () => {
      const jsonContent = {
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

      const result = generateHTMLFromTiptap(jsonContent);
      expect(result).toBe('<p><strong>Bold text</strong></p>');
    });

    it('should handle italic text', () => {
      const jsonContent = {
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

      const result = generateHTMLFromTiptap(jsonContent);
      expect(result).toBe('<p><em>Italic text</em></p>');
    });

    it('should handle bullet lists', () => {
      const jsonContent = {
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
                        text: 'List item 1'
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = generateHTMLFromTiptap(jsonContent);
      expect(result).toBe('<ul><li><p>List item 1</p></li></ul>');
    });

    it('should return empty string for null content', () => {
      const result = generateHTMLFromTiptap(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined content', () => {
      const result = generateHTMLFromTiptap(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for non-object content', () => {
      const result = generateHTMLFromTiptap('not an object');
      expect(result).toBe('');
    });
  });

  describe('generateTiptapFromHTML', () => {
    it('should generate TipTap JSON from simple HTML', () => {
      const html = '<p>Hello, world!</p>';
      const result = generateTiptapFromHTML(html);

      expect(result.type).toBe('doc');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('paragraph');
      expect(result.content[0].content[0].text).toBe('Hello, world!');
    });

    it('should handle bold HTML', () => {
      const html = '<p><strong>Bold text</strong></p>';
      const result = generateTiptapFromHTML(html);

      expect(result.content[0].content[0].marks).toHaveLength(1);
      expect(result.content[0].content[0].marks[0].type).toBe('bold');
    });

    it('should handle italic HTML', () => {
      const html = '<p><em>Italic text</em></p>';
      const result = generateTiptapFromHTML(html);

      expect(result.content[0].content[0].marks).toHaveLength(1);
      expect(result.content[0].content[0].marks[0].type).toBe('italic');
    });

    it('should return default structure for null HTML', () => {
      const result = generateTiptapFromHTML(null as any);
      expect(result.type).toBe('doc');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('paragraph');
    });

    it('should return default structure for undefined HTML', () => {
      const result = generateTiptapFromHTML(undefined as any);
      expect(result.type).toBe('doc');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('paragraph');
    });

    it('should return default structure for non-string HTML', () => {
      const result = generateTiptapFromHTML(123 as any);
      expect(result.type).toBe('doc');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('paragraph');
    });
  });

  describe('renderTiptapContent', () => {
    it('should render content with CSS class', () => {
      const jsonContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Test content'
              }
            ]
          }
        ]
      };

      const result = renderTiptapContent(jsonContent, 'my-class');
      expect(result).toBe('<div class="my-class"><p>Test content</p></div>');
    });

    it('should render content without CSS class', () => {
      const jsonContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Test content'
              }
            ]
          }
        ]
      };

      const result = renderTiptapContent(jsonContent);
      expect(result).toBe('<p>Test content</p>');
    });
  });

  describe('isTiptapContentEmpty', () => {
    it('should return true for null content', () => {
      expect(isTiptapContentEmpty(null)).toBe(true);
    });

    it('should return true for undefined content', () => {
      expect(isTiptapContentEmpty(undefined)).toBe(true);
    });

    it('should return true for non-object content', () => {
      expect(isTiptapContentEmpty('not an object')).toBe(true);
    });

    it('should return true for content without content array', () => {
      expect(isTiptapContentEmpty({ type: 'doc' })).toBe(true);
    });

    it('should return true for empty content array', () => {
      expect(isTiptapContentEmpty({ type: 'doc', content: [] })).toBe(true);
    });

    it('should return true for content with only empty paragraph', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: []
          }
        ]
      };
      expect(isTiptapContentEmpty(content)).toBe(true);
    });

    it('should return false for content with text', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hello'
              }
            ]
          }
        ]
      };
      expect(isTiptapContentEmpty(content)).toBe(false);
    });

    it('should return false for content with multiple paragraphs', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: []
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hello'
              }
            ]
          }
        ]
      };
      expect(isTiptapContentEmpty(content)).toBe(false);
    });
  });
});
