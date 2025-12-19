import styled from "styled-components";

export const SubtasksSection = styled.div`
  margin: 0 24px 32px 24px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
`;

export const SubtasksHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
`;

export const SubtasksHeaderButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SubtasksHeaderButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  width: 28px;
  height: 28px;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
`;

export const SubtasksContainer = styled.div<{ $isExpanded: boolean }>`
  display: ${(props) => (props.$isExpanded ? "block" : "none")};
  padding: 0 12px 12px 12px;
`;

export const SubtaskItem = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  margin-bottom: 8px;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;

  &:hover {
    background: #333;
    border-color: #4a4a4a;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SubtaskHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

export const SubtaskKey = styled.span`
  font-size: 13px;
  color: #888;
  font-weight: 500;
`;

export const SubtaskIcon = styled.span`
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const SubtaskContent = styled.div`
  font-size: 14px;
  color: #fff;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SubtaskInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #667eea;
  }
`;

export const EmptySubtasksMessage = styled.div`
  color: #666;
  font-size: 14px;
  padding: 8px;
`;
