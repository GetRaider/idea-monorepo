import { PropsWithChildren } from 'react';
import { Inter } from 'next/font/google';
import { Theme } from '@radix-ui/themes';
import Header from '../../../../packages/ui/src/components/Header/Header.component';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function ({ children }: Readonly<PropsWithChildren>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Theme
          accentColor="violet"
          grayColor="slate"
          scaling="90%"
          panelBackground="solid"
          className="radix-theme-with-gradient"
        >
          <Header />
          {children}
        </Theme>
      </body>
    </html>
  );
}
