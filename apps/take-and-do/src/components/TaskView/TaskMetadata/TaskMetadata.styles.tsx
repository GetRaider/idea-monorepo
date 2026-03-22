import { styled } from "styled-components";

import { Input } from "@/components/Input";

export const MetadataContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  width: 100%;
  min-width: 0;
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

export const MetadataInput = styled(Input)<{ $width?: string }>`
  padding: 4px 8px;
  width: ${(props) => props.$width || "80px"};
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
  flex-shrink: 0;
`;

export const LabelDropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: var(--label-menu-left, 0px);
  right: auto;
  margin-top: 4px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1001;
  width: 200px;
  max-width: min(200px, calc(100vw - 48px));
  max-height: 240px;
  overflow-y: auto;
  display: ${(props) => (props.$isOpen ? "block" : "none")};
  box-sizing: border-box;
`;

export const LabelDropdownRow = styled.div<{ $activeMenu?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-left: 12px;
  background: ${(p) =>
    p.$activeMenu ? "rgba(255,255,255,0.04)" : "transparent"};

  & + & {
    border-top: 1px solid #3a3a3a;
  }
`;

export const LabelDropdownRowToggle = styled.button<{ $onTask?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 10px 8px 10px 0;
  background: transparent;
  border: none;
  color: ${(p) => (p.$onTask ? "#e5e7eb" : "#aaa")};
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: color 0.15s;

  &:hover {
    color: #fff;
  }
`;

export const LabelDropdownRowLabelText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const LabelRowActions = styled.div`
  opacity: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0 8px 0 4px;
  color: #888;
  transition: opacity 0.15s;

  [data-label-actions-trigger] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 4px;
  }

  ${LabelDropdownRow}:hover &,
  ${LabelDropdownRow}[data-menu-open="true"] & {
    opacity: 1;
  }
`;

export const LabelDropdownEditInput = styled(Input)`
  flex: 1;
  margin: 6px 8px 6px 0;
  padding: 8px 10px;
  font-size: 13px;
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

export const LabelDropdownInput = styled(Input)`
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
  flex-shrink: 0;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 4px 8px;

  &:focus-within {
    border-color: #667eea;
  }
`;

export const Tag = styled.button<{
  $tintBg?: string;
  $tintHoverBg?: string;
  $tintBorder?: string;
}>`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: min(220px, 100%);
  padding: 4px 10px;
  background: ${(p) => p.$tintBg ?? "rgba(102, 126, 234, 0.1)"};
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 12px;
  color: #888;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => p.$tintHoverBg ?? "rgba(102, 126, 234, 0.2)"};
    border-color: ${(p) => p.$tintBorder ?? "rgba(102, 126, 234, 0.3)"};
  }
`;

export const TagText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TagDot = styled.span<{ $color?: string }>`
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(p) => p.$color ?? "#667eea"};
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

export const AddLabelTag = styled(Tag)`
  background: transparent;
  border: 1px dashed #3a3a3a;
  color: #666;
`;

export const CreateLabelSpan = styled.span<{ $accentColor?: string }>`
  color: ${(p) => p.$accentColor ?? "#667eea"};
`;
