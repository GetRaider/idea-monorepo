'use client';

import { Button } from '@denzel/ui/components/Button/Button.component';

import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <h1 className={styles.mainTitle}>Welcome to Denzel!</h1>
        <p className={styles.description}>Your engineering team's manager</p>
        <Button>Get Started</Button>
      </div>
    </main>
  );
}
