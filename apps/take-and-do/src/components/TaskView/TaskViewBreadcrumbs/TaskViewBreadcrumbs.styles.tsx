import styled from "styled-components";

export const BreadcrumbsRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
`;

export const BreadcrumbChevron = styled.img`
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin: 0 4px;
  display: block;
`;

export const BoardTrigger = styled.button`
  background: none;
  border: none;
  padding: 4px 6px;
  margin: 0;
  font: inherit;
  font-size: 16px;
  color: #888;
  cursor: pointer;
  border-radius: 6px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }

  &:disabled:hover {
    background: none;
    color: #888;
  }
`;

export const BoardDropdownWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
`;

export const BoardDropdownPanel = styled.div<{ $isOpen: boolean }>`
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
  max-height: 240px;
  overflow-y: auto;
  display: ${(p) => (p.$isOpen ? "block" : "none")};
`;

export const BoardDropdownItem = styled.button`
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
  transition: background 0.2s;

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

export const ParentTaskButton = styled.button`
  background: none;
  border: none;
  padding: 4px 6px;
  margin: 0;
  font: inherit;
  font-size: 16px;
  color: #888;
  cursor: pointer;
  border-radius: 6px;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
`;

export const StatusDropdownWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const TaskKeyText = styled.span`
  font-size: 16px;
  color: #888;
  margin-left: 4px;
`;
