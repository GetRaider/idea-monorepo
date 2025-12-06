import styled from "styled-components";

export const EditorWrapper = styled.div`
  position: relative;
  padding: 12px 24px 24px 24px;
  min-height: 200px;

  @media (max-width: 600px) {
    padding: 12px 16px 16px 16px;
  }

  .editor-toolbar {
    display: flex;
    gap: 4px;
    padding: 8px;
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 4px 4px 0 0;
    margin-bottom: 0;
    flex-wrap: wrap;

    button {
      padding: 6px 10px;
      background: transparent;
      border: none;
      color: #888;
      cursor: pointer;
      border-radius: 4px;
      font-size: 14px;
      transition: all 0.2s;
      white-space: nowrap;

      @media (max-width: 480px) {
        padding: 6px 8px;
        font-size: 12px;
      }

      &:hover {
        background: #3a3a3a;
        color: #fff;
      }

      &.is-active {
        background: #667eea;
        color: #fff;
      }
    }
  }

  .ProseMirror {
    outline: none;
    min-height: 200px;
    padding: 12px;
    color: #888;
    font-size: 14px;
    line-height: 1.6;
    background: transparent;
    border: 1px solid #3a3a3a;
    border-top: none;
    border-radius: 0 0 4px 4px;

    &:focus {
      outline: none;
    }

    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: #666;
      pointer-events: none;
      height: 0;
    }

    h2,
    h3,
    h4 {
      color: #fff;
      font-weight: 600;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }

    h2 {
      font-size: 20px;
    }

    h3 {
      font-size: 18px;
    }

    h4 {
      font-size: 16px;
    }

    p {
      margin: 0.5em 0;
    }

    ul,
    ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }

    li {
      margin: 0.25em 0;
    }

    strong {
      color: #fff;
      font-weight: 600;
    }

    em {
      font-style: italic;
    }
  }
`;

export const Toolbar = styled.div`
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 4px 4px 0 0;
  margin-bottom: 0;
`;

export const ToolbarButton = styled.button<{ $isActive?: boolean }>`
  padding: 6px 12px;
  background: ${(props) => (props.$isActive ? "#667eea" : "transparent")};
  border: none;
  color: ${(props) => (props.$isActive ? "#fff" : "#888")};
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.$isActive ? "#667eea" : "#3a3a3a")};
    color: #fff;
  }
`;
