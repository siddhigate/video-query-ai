import React from 'react';
import Logo from './Logo';
import styles from './MainWindow.module.sass';

const TitleWithLogo: React.FC = () => (
  <h1 className={styles.title}>
    <Logo width="28" height="32" />ideo Query AI
  </h1>
);

export default TitleWithLogo; 