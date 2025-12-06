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

  @media (max-width: 600px) {
    padding: 10px;
  }
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

  @media (max-width: 600px) {
    max-height: 95vh;
    border-radius: 8px;
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #2a2a2a;
  flex-wrap: wrap;
  gap: 8px;

  @media (max-width: 600px) {
    padding: 14px 16px;
  }
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
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 24px;

  @media (max-width: 600px) {
    padding: 12px 16px;
    gap: 8px;
  }
`;

export const MetadataItem = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #888;
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
    border-color: #3a3a3a;
  }
`;

export const MetadataInput = styled.input`
  font-size: 14px;
  color: #fff;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 4px 8px;
  width: 80px;
  outline: none;

  &:focus {
    border-color: #667eea;
  }
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

export const Tag = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 12px;
  color: #888;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(102, 126, 234, 0.2);
    border-color: rgba(102, 126, 234, 0.3);
  }
`;

export const TagDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #667eea;
`;

export const AddTagButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: transparent;
  border: 1px dashed #3a3a3a;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
    border-color: #4a4a4a;
    color: #888;
  }
`;

export const TagInput = styled.input`
  font-size: 12px;
  color: #fff;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 4px 10px;
  width: 100px;
  outline: none;

  &:focus {
    border-color: #667eea;
  }
`;

export const LabelSelectorContainer = styled.div`
  position: relative;
`;

export const LabelDropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1001;
  min-width: 180px;
  max-height: 250px;
  overflow-y: auto;
  display: ${(props) => (props.$isOpen ? "block" : "none")};
`;

export const LabelDropdownItem = styled.button<{ $isSelected?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: ${(props) => (props.$isSelected ? "#3a3a3a" : "transparent")};
  border: none;
  color: #fff;
  font-size: 13px;
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

export const LabelDropdownInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-bottom: 1px solid #3a3a3a;
  color: #fff;
  font-size: 13px;
  outline: none;

  &::placeholder {
    color: #666;
  }
`;

export const EstimationInputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 2px 6px;

  &:focus-within {
    border-color: #667eea;
  }
`;

export const EstimationInput = styled.input`
  width: 32px;
  padding: 2px 4px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 13px;
  text-align: center;
  outline: none;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  -moz-appearance: textfield;
`;

export const EstimationLabel = styled.span`
  font-size: 11px;
  color: #666;
  min-width: 10px;
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
  margin: 0 24px 24px 24px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
`;

export const SubtasksHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
`;

export const SubtasksHeaderButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SubtasksHeaderButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  width: 28px;
  height: 28px;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
`;

export const SubtasksContainer = styled.div<{ $isExpanded: boolean }>`
  display: ${(props) => (props.$isExpanded ? "block" : "none")};
  padding: 0 12px 12px 12px;
`;

export const SubtaskItem = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  margin-bottom: 8px;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;

  &:hover {
    background: #333;
    border-color: #4a4a4a;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SubtaskHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

export const SubtaskKey = styled.span`
  font-size: 13px;
  color: #888;
  font-weight: 500;
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
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const SubtaskContent = styled.div`
  font-size: 14px;
  color: #fff;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
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
