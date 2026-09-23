import React from "react";
import { demoSchemaSnippet } from "../config/demoSchema";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const SchemaViewer: React.FC = () => {
  return (
    <div className="schema-container">
      <div className="schema-header">
        <span>Validation Schema</span>
        <span>TypeScript</span>
      </div>
      <div className="schema-code">
        <SyntaxHighlighter 
          language="typescript" 
          style={oneLight}
          customStyle={{ margin: 0, padding: 0, background: 'transparent', fontSize: '0.85rem', fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace' }}
        >
          {demoSchemaSnippet}
        </SyntaxHighlighter>
      </div>
      <div className="schema-expected">
        <div className="schema-expected-title">Expected headers</div>
        <div className="schema-tokens">
          <span>id</span>
          <span>name</span>
          <span>email</span>
          <span>age</span>
          <span>active</span>
          <span>country</span>
        </div>
      </div>
    </div>
  );
};
