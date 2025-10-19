import styled from "styled-components";

export const PageContainer = styled.div`
  display: flex;
  height: 100vh;
  background: var(--background);
  overflow: hidden;
`;

export const Main = styled.main<{ $withNavSidebar: boolean }>`
  flex: 1;
  margin-left: ${(props) => (props.$withNavSidebar ? "340px" : "60px")};
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
  overflow: hidden;
`;
