import { styled } from "styled-components";

export const ConfirmBody = styled.p`
  margin: 0 0 24px;
  font-size: 14px;
  color: #cbd5e1;
  line-height: 1.5;
`;

export const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

export const ConfirmCancelBtn = styled.button`
  padding: 10px 20px;
  background: transparent;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  color: #888;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2a2a2a;
    color: #fff;
  }
`;

export const ConfirmDeleteBtn = styled.button`
  padding: 10px 20px;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #dc2626;
  }
`;
