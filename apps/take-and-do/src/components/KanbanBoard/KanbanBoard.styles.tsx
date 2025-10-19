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
  background: #667eea;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #5568d3;
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

export const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 24px;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
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
