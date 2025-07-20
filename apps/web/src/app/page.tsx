'use client';

import { Button } from '@denzel/ui/src/';

import styles from './page.module.css';
import { UsersSection } from './components/Users-Section/users-section.component';
import { useState } from 'react';

export default function RootPage() {
  const [showUsers, setShowUsers] = useState(false);
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <h1 className={styles.mainTitle}>Welcome to Denzel!</h1>
        <p className={styles.description}>Your engineering team's manager</p>
        <Button>Get Started</Button>
        <Button onClick={() => setShowUsers(!showUsers)}>Show Users</Button>
        {showUsers && <UsersSection />}
      </div>
    </main>
  );
}
