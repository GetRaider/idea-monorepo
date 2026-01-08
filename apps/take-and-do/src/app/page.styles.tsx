import styled from "styled-components";

export const PageContainer = styled.div`
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #3c2856 100%);
  overflow: hidden;
`;

export const Main = styled.main<{ $withNavSidebar: boolean }>`
  flex: 1;
  margin-left: ${(props) => (props.$withNavSidebar ? "340px" : "60px")};
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a1a 0%, #3c2856 100%);
`;
