'use client';

import { useState } from 'react';
import { Button } from '@denzel/ui/src/';

import styles from './page.module.css';
import { UsersSection } from '../components/Users-Section/users-section.component';

export default function HomePage() {
  const [showUsers, setShowUsers] = useState(false);
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <h1 className={styles.mainTitle}>Home</h1>
        <Button onClick={() => setShowUsers(!showUsers)}>Show Users</Button>
        {showUsers && <UsersSection />}
      </div>
    </main>
  );
}
