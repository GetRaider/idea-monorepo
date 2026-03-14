import styled, { css } from "styled-components";

import { Input } from "../Input";

export const TasksSidebarContainer = styled.aside<{ $isOpen: boolean }>`
  width: 280px;
  height: 100vh;
  background: #1e1e1e;
  border-right: 1px solid #2a2a2a;
  position: fixed;
  left: 60px;
  top: 0;
  z-index: 90;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  transform: ${(props) =>
    props.$isOpen ? "translateX(0)" : "translateX(-100%)"};
  transition: transform 0.3s ease;
`;

export const Search = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 1px 8px;
  color: #888;
`;

export const SearchInput = styled(Input).attrs({
  maxLength: 64,
})`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 14px;

  &::placeholder {
    color: #666;
  }
`;

export const NavItem = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: ${(props) => (props.$active ? "#2a2a2a" : "transparent")};
  border: none;
  border-radius: 8px;
  color: ${(props) => (props.$active ? "#fff" : "#888")};
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-size: 14px;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
`;

export const WorkspaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const SideBarSectionHeader = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const AddButton = styled.button`
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  width: 20px;
  height: 20px;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
`;

export const WorkspaceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const WorkspaceItem = styled.div`
  display: flex;
  flex-direction: column;
`;

export const WorkspaceToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-size: 14px;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
`;

export const BoardToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #888;
  cursor: pointer;
  transition: color 0.2s;
  text-align: left;
  font-size: 14px;
  flex: 1;
`;

export const BoardActionsWrapper = styled.div`
  opacity: 0;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding-right: 12px;
  padding-left: 4px;
  color: #888;
  transition: opacity 0.15s;

  [data-board-actions-trigger] {
    padding: 4px;
    border-radius: 4px;
    transition:
      background 0.15s,
      color 0.15s;
  }

  [data-board-actions-trigger]:hover {
    background: #3a3a3a;
    color: #fff;
  }
`;

export const BoardRow = styled.div<{ $active?: boolean; $selected?: boolean }>`
  display: flex;
  align-items: center;
  border-radius: 8px;
  position: relative;
  background: ${({ $active, $selected }) =>
    $active || $selected ? "#2a2a2a" : "transparent"};
  transition: background 0.15s;

  &:hover {
    background: #2a2a2a;
  }

  &:hover ${BoardToggle} {
    color: #fff;
  }

  &:hover ${BoardActionsWrapper} {
    opacity: 1;
  }

  ${({ $active, $selected }) =>
    ($active || $selected) &&
    css`
      ${BoardActionsWrapper} {
        opacity: 1;
      }

      ${BoardToggle} {
        color: #fff;
      }
    `}

  &[data-selected] ${BoardToggle} {
    cursor: default;
  }
`;

export const BoardNameInput = styled(Input)`
  flex: 1;
  padding: 5px 10px;
  font-size: 14px;
  height: 34px;
`;

export const ChevronWrapper = styled.span<{ $expanded?: boolean }>`
  display: inline-flex;
  transition: transform 0.2s;
  transform: ${(props) => (props.$expanded ? "rotate(90deg)" : "rotate(0)")};
  margin-left: auto;
`;

export const SubItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-left: 24px;
  margin-top: 4px;
`;

export const SubItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  color: #888;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
`;
