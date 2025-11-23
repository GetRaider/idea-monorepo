import styled from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

export const ModalContainer = styled.div`
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 32px;
  border-bottom: 1px solid #2a2a2a;
`;

export const HeaderLeft = styled.div`
  font-size: 16px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const StatusIconButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
  width: 32px;
  height: 32px;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
`;

export const TaskTitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px;
  padding-bottom: 16px;
`;

export const PriorityIcon = styled.button`
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
  }
`;

export const TaskTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
  line-height: 1.4;
  flex: 1;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
  }
`;

export const TaskTitleInput = styled.input`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
  line-height: 1.4;
  flex: 1;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  padding: 4px 8px;
  outline: none;
  scroll-snap-type: x mandatory; /* this will do the magic for parent */

  &:focus {
    border-color: #667eea;
  }
`;

export const TaskDescription = styled.p`
  padding: 0 24px 24px 24px;
  color: #888;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
  }
`;

export const DescriptionActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
`;

export const SaveButton = styled.button`
  padding: 6px 16px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #5568d3;
  }

  &:active {
    background: #4a5bc4;
  }
`;

export const CancelButton = styled.button`
  padding: 6px 16px;
  background: transparent;
  color: #888;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
    color: #fff;
    border-color: #4a4a4a;
  }
`;

export const TaskDescriptionMarkdown = styled.div`
  padding: 12px 32px 24px 32px;
  color: #888;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  min-height: 200px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
  }

  h2,
  h3,
  h4 {
    color: #fff;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
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

  /* Task list styles */
  ul[data-type="taskList"] {
    list-style: none;
    padding-left: 0;
  }

  li[data-type="taskItem"] {
    display: flex;
    align-items: flex-start;
    margin: 0.25em 0;

    > label {
      flex: 0 0 auto;
      margin-right: 0.5em;
      user-select: none;
      display: flex;
      align-items: center;
      margin-top: 0.1em;
    }

    > div {
      flex: 1 1 auto;
      min-width: 0;
    }

    input[type="checkbox"] {
      cursor: pointer;
      width: 16px;
      height: 16px;
      accent-color: #667eea;
      margin: 0;
    }

    p {
      margin: 0;
    }
  }

  strong {
    color: #fff;
    font-weight: 600;
  }

  em {
    font-style: italic;
  }

  u {
    text-decoration: underline;
  }
`;

export const TaskMetadata = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 0 12px 24px;
`;

export const MetadataItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #888;
`;

export const StatusSelector = styled.div`
  position: relative;
  display: inline-block;
`;

export const StatusButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 6px;
  font-size: 12px;
  color: #888;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(102, 126, 234, 0.2);
    border-color: rgba(102, 126, 234, 0.5);
  }
`;

export const DropdownContainer = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1001;
  min-width: 150px;
  display: ${(props) => (props.$isOpen ? "block" : "none")};
`;

export const DropdownItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;

  &:hover {
    background: #3a3a3a;
  }

  &:first-child {
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }
`;

export const MetadataIcon = styled.span`
  display: flex;
  align-items: center;
  color: #888;
`;

export const Tag = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 6px;
  font-size: 12px;
  color: #888;
  font-weight: 500;
`;

export const TagDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #667eea;
`;

export const AttachmentsSection = styled.div`
  padding: 0 24px 24px 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const AttachmentsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

export const AttachButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #3a3a3a;
    border-color: #4a4a4a;
  }

  svg {
    color: #888;
  }
`;

export const AttachmentItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #3a3a3a;
    border-color: #4a4a4a;
  }
`;

export const AttachmentIcon = styled.span`
  display: flex;
  align-items: center;
  color: #888;
`;

export const SubtasksSection = styled.div`
  padding: 0 24px 24px 24px;
`;

export const SubtasksHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;

  button {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 4px;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      background: #2a2a2a;
      color: #fff;
    }

    &:not(:last-child) {
      margin-right: 8px;
    }
  }
`;

export const SubtasksContainer = styled.div<{ $isExpanded: boolean }>`
  display: ${(props) => (props.$isExpanded ? "block" : "none")};
  margin-top: 8px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  padding: 12px;
`;

export const SubtaskItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  margin-bottom: 6px;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #3a3a3a;
    border-color: #4a4a4a;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SubtaskCheckbox = styled.div<{ $completed: boolean }>`
  width: 20px;
  height: 20px;
  border: 2px solid ${(props) => (props.$completed ? "#4ade80" : "#666")};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.$completed ? "#4ade80" : "transparent")};
  color: #fff;
  font-size: 12px;
  flex-shrink: 0;
`;

export const SubtaskIcon = styled.span`
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const SubtaskContent = styled.div`
  font-size: 14px;
  color: #fff;
  flex: 1;
`;

export const HistorySection = styled.div`
  padding: 0 24px 24px 24px;
`;

export const HistoryHeader = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 12px;
`;

export const CommentInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 12px;
`;

export const CommentInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 14px;
  outline: none;

  &::placeholder {
    color: #666;
  }
`;

export const AttachIconButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #3a3a3a;
    color: #fff;
  }
`;
