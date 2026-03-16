import React from 'react';

interface BBCodeRendererProps {
  text: string;
  className?: string;
}

export const BBCodeRenderer: React.FC<BBCodeRendererProps> = ({ text, className }) => {
  // Simple BBCode to HTML converter
  // Supports: [b], [i], [u], [color=red], [size=14], [url=...]
  
  const renderContent = (content: string) => {
    let html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br />')
      .replace(/  /g, '&nbsp;&nbsp;'); // Preserve double spaces for ASCII

    let previousHtml = '';
    // Loop to handle nested tags
    while (html !== previousHtml) {
      previousHtml = html;
      html = html
        .replace(/\[p\]/gi, '<p class="mb-4">')
        .replace(/\[\/p\]/gi, '</p>')
        .replace(/\[b\]((?:(?!\[b\]).)*?)\[\/b\]/gi, '<strong>$1</strong>')
        .replace(/\[i\]((?:(?!\[i\]).)*?)\[\/i\]/gi, '<em>$1</em>')
        .replace(/\[u\]((?:(?!\[u\]).)*?)\[\/u\]/gi, '<span class="underline">$1</span>')
        .replace(/\[color=['"]?(.*?)['"]?\]((?:(?!\[color).)*?)\[\/color\]/gi, (match, color, innerContent) => {
          const finalColor = color.trim().toLowerCase() === 'blue' ? '#60a5fa' : color.trim();
          return `<span style="color: ${finalColor}">${innerContent}</span>`;
        })
        .replace(/\[size=['"]?(.*?)['"]?\]((?:(?!\[size).)*?)\[\/size\]/gi, '<span style="font-size: $1px">$2</span>')
        .replace(/\[url=['"]?(.*?)['"]?\]((?:(?!\[url).)*?)\[\/url\]/gi, '<a href="$1" target="_blank" class="text-blue-500 hover:underline">$2</a>');
    }

    return <div className={`${className} whitespace-pre-wrap font-inherit`} dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return renderContent(text);
};
