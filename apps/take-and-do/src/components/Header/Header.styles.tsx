import styled from "styled-components";

export const HeaderContainer = styled.header`
  height: 64px;
  background: #1a1a1a;
  border-bottom: 1px solid #2a2a2a;
  display: flex;
  align-items: center;
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 50;
`;

export const Content = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const Title = styled.h1`
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

export const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
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
