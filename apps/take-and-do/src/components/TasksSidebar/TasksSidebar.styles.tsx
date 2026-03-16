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
  cursor: ${(props) => (props.$active ? "default" : "pointer")};
  transition: all 0.2s;
  text-align: left;
  font-size: 14px;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
`;

export const WorkspaceContainer = styled.div<{ $grow?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${(p) => p.$grow && "flex: 1; min-height: 0;"}
`;

export const SideBarSectionHeader = styled.div`
  font-size: 14px;
  font-weight: 800;
  color: #666;
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

export const WorkspaceList = styled.div<{ $isDragOver?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-height: 120px;
  border-radius: 8px;
  border: 1px dashed ${(p) => (p.$isDragOver ? "#7255c1" : "transparent")};
  background: ${(p) =>
    p.$isDragOver ? "rgba(114, 85, 193, 0.12)" : "transparent"};
  transition:
    border-color 0.15s,
    background 0.15s;
  padding: 2px 0;
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
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #888;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
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
  min-width: 0;
  padding: 8px 12px;
  font-size: 14px;
  height: auto;
  line-height: 1.4;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;

  &:focus {
    border-color: #3a3a3a;
    background: #2a2a2a;
  }
`;

export const BoardEditWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  flex: 1;
  min-width: 0;
`;

export const BoardEditInput = styled(Input)`
  flex: 1;
  min-width: 0;
  padding: 0;
  font-size: 14px;
  height: auto;
  line-height: 1.4;
  border: none;
  border-radius: 0;
  background: transparent;

  &:focus {
    outline: none;
  }
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
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
`;

export const FolderActionsWrapper = styled.div`
  opacity: 0;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding-right: 12px;
  padding-left: 4px;
  color: #888;
  transition: opacity 0.15s;

  [data-folder-actions-trigger] {
    padding: 4px;
    border-radius: 4px;
    transition:
      background 0.15s,
      color 0.15s;
  }

  [data-folder-actions-trigger]:hover {
    background: #3a3a3a;
    color: #fff;
  }
`;

export const FolderNameInput = styled(Input)`
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  font-size: 14px;
  height: auto;
  line-height: 1.4;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;

  &:focus {
    border-color: #3a3a3a;
    background: #2a2a2a;
  }
`;

export const FolderEditWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  flex: 1;
  min-width: 0;
`;

export const FolderEditInput = styled(Input)`
  flex: 1;
  min-width: 0;
  padding: 0;
  font-size: 14px;
  height: auto;
  line-height: 1.4;
  border: none;
  border-radius: 0;
  background: transparent;

  &:focus {
    outline: none;
  }
`;

export const FolderRow = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  border-radius: 8px;
  transition: background 0.15s;

  & ${WorkspaceToggle} {
    flex: 1;
  }

  & ${FolderEditWrap} {
    flex: 1;
  }

  & ${FolderNameInput} {
    flex: 1;
  }

  &:hover {
    background: #2a2a2a;
  }

  &:hover ${WorkspaceToggle} {
    color: #fff;
  }

  &:hover ${FolderActionsWrapper} {
    opacity: 1;
  }

  ${({ $active }) =>
    $active &&
    css`
      ${FolderActionsWrapper} {
        opacity: 1;
      }
    `}
`;

export const FolderDropTarget = styled.div<{ $isDragOver?: boolean }>`
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$isDragOver ? "#7255c1" : "transparent")};
  background: ${(p) =>
    p.$isDragOver ? "rgba(114, 85, 193, 0.15)" : "transparent"};
  transition:
    border-color 0.15s,
    background 0.15s;

  &:hover ${WorkspaceToggle} {
    background: #2a2a2a;
    color: #fff;
  }
`;

export const RootBoardsDropZone = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
`;
