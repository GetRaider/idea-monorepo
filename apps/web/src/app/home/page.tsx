'use client';

import { useState } from 'react';
import { Button } from '@denzel/ui/src/';

import styles from './page.module.css';
import { UsersSection } from '../components/Users-Section/users-section.component';
import { signIn, signOut, useSession } from '../../lib/auth-client';

export default function HomePage() {
  const [showUsers, setShowUsers] = useState(false);
  const { data: session } = useSession();
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <h1 className={styles.mainTitle}>Home</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {session?.user ? (
            <>
              <span>
                Signed in as {session.user.email || session.user.name}
              </span>
              <Button onClick={() => signOut()}>Sign out</Button>
            </>
          ) : (
            <>
              <Button onClick={() => signIn.social({ provider: 'github' })}>
                Sign in with GitHub
              </Button>
            </>
          )}
        </div>
        <Button onClick={() => setShowUsers(!showUsers)}>Show Users</Button>
        {showUsers && <UsersSection />}
      </div>
    </main>
  );
}
