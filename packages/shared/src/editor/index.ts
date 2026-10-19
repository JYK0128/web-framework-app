import sanitizeHtml from 'sanitize-html';

// A named import fails for this CommonJS module under Vite SSR.
// eslint-disable-next-line import-x/no-named-as-default-member
const { defaults } = sanitizeHtml;

export function sanitizeEditorHtml(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: [...defaults.allowedTags, 'img', 'figure', 'figcaption', 'video', 'audio', 'source', 'hr', 'sub', 'sup'],
    allowedAttributes: {
      '*': ['class', 'style'],
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'td': ['colspan', 'rowspan'],
      'th': ['colspan', 'rowspan', 'scope'],
      'col': ['span', 'width'],
      'video': ['src', 'controls', 'poster', 'width', 'height'],
      'audio': ['src', 'controls'],
      'source': ['src', 'type'],
      'ol': ['start', 'reversed', 'type'],
      'li': ['value'],
    },
    allowedClasses: { '*': [/^(?:__se__|se-)[\w-]+$/] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowProtocolRelative: false,
    allowedStyles: {
      '*': {
        'color': [/^(?:#[\da-f]{3,8}|rgba?\([\d.,%\s]+\)|[a-z]+)$/i],
        'background-color': [/^(?:#[\da-f]{3,8}|rgba?\([\d.,%\s]+\)|[a-z]+)$/i],
        'font-size': [/^\d+(?:\.\d+)?(?:px|pt|em|rem|%)$/],
        'font-family': [/^[\w\s,'"-]+$/],
        'font-weight': [/^(?:normal|bold|[1-9]00)$/],
        'font-style': [/^(?:normal|italic)$/],
        'text-align': [/^(?:left|right|center|justify)$/],
        'text-decoration': [/^(?:none|underline|line-through|overline)(?:\s+(?:underline|line-through|overline))*$/],
        'line-height': [/^\d+(?:\.\d+)?(?:px|em|rem|%)?$/],
        'width': [/^(?:auto|\d+(?:\.\d+)?(?:px|em|rem|%))$/],
        'height': [/^(?:auto|\d+(?:\.\d+)?(?:px|em|rem|%))$/],
        'margin-left': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
      },
    },
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }),
      img: (tagName, attribs) => {
        const { src, ...rest } = attribs;
        const safeSrc = !src?.startsWith('data:') || /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,/i.test(src);
        return { tagName, attribs: { ...rest, ...(safeSrc && src ? { src } : {}) } };
      },
    },
  });
}

export function toEditorHtml(content: string): string {
  if (/<\/?[a-z][^>]*>/i.test(content)) return sanitizeEditorHtml(content);
  return content.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').split('\n').map((line) => `<p>${line || '<br>'}</p>`).join('');
}

export function hasEditorContent(content: string): boolean {
  const html = sanitizeEditorHtml(content);
  return /<(?:img|video|audio)\b/i.test(html) || sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/&(?:nbsp|#160);/g, ' ').trim().length > 0;
}
