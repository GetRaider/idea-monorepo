import styled from "styled-components";

export const NavigationSidebarContainer = styled.aside<{ $isOpen: boolean }>`
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
  padding: 8px 12px;
  color: #888;
`;

export const SearchInput = styled.input`
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

export const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 4px;
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

export const Workspace = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const WorkspaceHeader = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

export const Chevron = styled.svg<{ $expanded?: boolean }>`
  transition: transform 0.2s;
  transform: ${(props) => (props.$expanded ? "rotate(90deg)" : "rotate(0)")};
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
