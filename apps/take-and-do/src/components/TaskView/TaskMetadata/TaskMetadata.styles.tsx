import { styled } from "styled-components";

export const MetadataContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
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

export const MetadataInput = styled.input<{ $width?: string }>`
  font-size: 14px;
  color: #fff;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 4px 8px;
  width: ${(props) => props.$width || "80px"};
  outline: none;

  &:focus {
    border-color: #667eea;
  }
`;

export const MetadataIcon = styled.span`
  display: flex;
  align-items: center;
  color: #888;
`;

export const EstimationInput = styled.input`
  width: 40px;
  padding: 4px 6px;
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

  &:focus {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
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
  gap: 2px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 4px 8px;

  &:focus-within {
    border-color: #667eea;
  }
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

export const AddLabelTag = styled(Tag)`
  background: transparent;
  border: 1px dashed #3a3a3a;
  color: #666;
`;

export const CreateLabelSpan = styled.span`
  color: #667eea;
`;
