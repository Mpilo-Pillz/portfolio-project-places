import React, { ReactNode } from "react";

import "./MainHeader.css";

interface MainHeaderProps {
  className?: string;
  children: ReactNode;
}
const MainHeader: React.FC<MainHeaderProps> = ({ children }) => {
  return <header className="main-header">{children}</header>;
};

export default MainHeader;
