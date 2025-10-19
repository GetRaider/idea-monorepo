import styled from "styled-components";

export const Card = styled.div`
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #3a3a3a;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const PriorityIcon = styled.span`
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Id = styled.span`
  font-size: 12px;
  color: #888;
  font-weight: 500;
`;

export const Subtasks = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
`;

export const Title = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  line-height: 1.4;
  margin: 0;
`;

export const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const DateTime = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #888;
`;

export const Labels = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const Tag = styled.span<{ $isCategory?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${(props) =>
    props.$isCategory ? "rgba(245, 158, 11, 0.1)" : "rgba(102, 126, 234, 0.1)"};
  border-radius: 6px;
  font-size: 11px;
  color: #888;
  font-weight: 500;
`;

export const TagDot = styled.span<{ $isCategory?: boolean }>`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: ${(props) => (props.$isCategory ? "#f59e0b" : "#667eea")};
`;
