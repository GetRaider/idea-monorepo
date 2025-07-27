import { PropsWithChildren } from 'react';
import { Inter } from 'next/font/google';
import { Theme } from '@radix-ui/themes';

import './globals.css';
import Header from '@denzel/ui/src/components/Header/Header.component';

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
