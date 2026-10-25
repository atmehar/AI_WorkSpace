import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

export const SafeMarkdown = ({ content }) => {
  return (
    <div className="markdown-content" style={{ fontSize: '0.95rem', lineHeight: '1.7' }}>
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};
