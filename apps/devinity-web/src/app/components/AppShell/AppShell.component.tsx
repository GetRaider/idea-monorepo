'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import HeaderBar from '../HeaderBar/HeaderBar.component';
import Sidebar from '../Sidebar/Sidebar.component';

export default function AppShell({ children }: Readonly<PropsWithChildren>) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) setCollapsed(saved === 'true');
    function handler(e: Event) {
      const detail = (e as CustomEvent<boolean>).detail;
      setCollapsed(Boolean(detail));
    }
    window.addEventListener('sidebar:collapsed', handler as EventListener);
    return () =>
      window.removeEventListener('sidebar:collapsed', handler as EventListener);
  }, []);

  return (
    <>
      <HeaderBar hideBrandText={collapsed} />
      <div style={{ display: 'flex', width: '100%' }}>
        <Sidebar />
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </>
  );
}
