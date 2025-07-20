'use client';

import { Link } from '@radix-ui/themes';
import styles from './Header.module.css';

const navLinks = [
  { label: 'Home', href: '/home' },
  { label: 'Repositories', href: '/repos' },
  { label: 'Users', href: '/users' },
  { label: 'Analytics', href: '/analytics' },
];

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logoLink}>
            <img
              src="/denzel-logo-v2.png"
              alt="Denzel Logo"
              width={40}
              height={40}
              className={styles.logo}
            />
            <span className={styles.brandName}>Denzel</span>
          </Link>
        </div>

        <nav className={styles.navigation}>
          <ul className={styles.navList}>
            {navLinks.map((link) => (
              <li className={styles.navItem} key={link.href}>
                <Link href={link.href} className={styles.navLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
