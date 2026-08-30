import styled from "styled-components";

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(12, 8, 20, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

export const DialogPanel = styled.div`
  width: 100%;
  max-width: 360px;
  background: #16101f;
  border: 1px solid rgba(155, 92, 255, 0.28);
  border-radius: 16px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

export const DialogCard = styled.form`
  width: 100%;
  max-width: 360px;
  background: #16101f;
  border: 1px solid rgba(155, 92, 255, 0.28);
  border-radius: 16px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

export const DialogTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
`;

export const SessionSelect = styled.select`
  width: 100%;
  border: 1px solid rgba(155, 92, 255, 0.22);
  border-radius: 10px;
  background: #16101f;
  color: #f4eefe;
  padding: 0.55rem 0.65rem;
`;

export const DialogBody = styled.p`
  margin: 0;
  color: #9b8fb0;
  font-size: 0.875rem;
`;
