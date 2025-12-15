import styled from "styled-components";

export const BoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #3c2856 100%);
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  // TODO: Think about the border
  // border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const WorkspacePath = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #7255c1;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const SettingsButton = styled.button`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  img {
    width: 20px;
    height: 20px;
  }
`;

// Popover
export const PopoverContainer = styled.div`
  position: relative;
`;

export const Popover = styled.div`
  position: absolute;
  right: 0;
  top: 50px;
  width: 420px;
  background: #1f1f1f;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  color: #e5e7eb;
  padding: 18px;
  z-index: 200;
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const Segmented = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

export const SegmentBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid #333;
  background: ${(p) => (p.$active ? "#2a2a2a" : "transparent")};
  color: #e5e7eb;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #2a2a2a;
  }
`;

export const Divider = styled.hr`
  height: 1px;
  border: none;
  background: #2a2a2a;
  margin: 16px 0;
`;

export const Label = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #e5e7eb;
  font-size: 16px;
`;

export const Select = styled.select`
  background: #1b1b1b;
  border: 1px solid #333;
  color: #e5e7eb;
  padding: 10px 12px;
  border-radius: 10px;
`;

export const IconBtn = styled.button`
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid #333;
  background: #1b1b1b;
  color: #e5e7eb;
  cursor: pointer;
`;

export const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  color: #cbd5e1;
  font-weight: 500;
  padding-top: 8px;
`;

export const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: min-content;
  column-gap: 24px;
  row-gap: 16px;
  padding: 24px;
  flex: 1;
  overflow: auto;
`;

export const TaskGroupWrapper = styled.div`
  display: contents;
`;

export const WorkspaceSeparator = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin: 0;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  min-height: 44px;
  max-height: 44px;
  box-sizing: border-box;
  cursor: pointer;
`;

export const GroupChevron = styled.svg<{ $expanded?: boolean }>`
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
  transform: ${({ $expanded }) =>
    $expanded ? "rotate(90deg)" : "rotate(0deg)"};
  color: currentColor;
`;

export const EmptyStateMessage = styled.div`
  color: #fff;
  padding: 24px;
  grid-column: 1 / -1;
`;

export const WorkspaceIcon = styled.div`
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px dashed #2a2a2a;
  border-radius: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #3a3a3a;
    color: #888;
    background: rgba(42, 42, 42, 0.3);
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  grid-column: 1 / -1;
  min-height: 200px;
  color: #fff;
`;

export const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #7255c1;
  border-right-color: #7255c1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
