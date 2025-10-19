import styled from "styled-components";

export const SidebarContainer = styled.aside`
  width: 60px;
  height: 100vh;
  background: #1a1a1a;
  border-right: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
`;

export const Logo = styled.img`
  margin-bottom: 24px;
  width: 40px;
  height: 40px;
`;

export const LogoCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

export const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

export const NavButton = styled.button<{
  $active?: boolean;
  disabled?: boolean;
}>`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: ${(props) => (props.$active ? "#667eea" : "#888")};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s;
  position: relative;
  opacity: ${(props) => (props.disabled ? 0.3 : 1)};

  &:hover:not(:disabled) {
    background: #2a2a2a;
    color: #fff;
  }

  ${(props) =>
    props.$active &&
    `
    background: #2a2a2a;
    
    &::before {
      content: "";
      position: absolute;
      left: -8px;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 20px;
      background: #667eea;
      border-radius: 2px;
    }
  `}
`;

export const BottomActions = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

export const NotificationBadge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background: #ef4444;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #1a1a1a;
`;

export const UserAvatar = styled.div`
  margin-top: 8px;
`;

export const Avatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #2a2a2a;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
    border-color: #667eea;
  }
`;
