import React from 'react';
import styles from './HeroImage.module.css';

interface Props {
  imageUrl?: string;
  title: string;
  subtitle?: string;
}

const HeroImage: React.FC<Props> = ({ imageUrl, title, subtitle }) => {
  return (
    <div className={styles.hero}>
      {imageUrl ? (
        <img src={imageUrl} alt={title} className={styles.image} />
      ) : (
        <div className={styles.gradientBg} />
      )}
      <div className={styles.overlay} />
      <div className={styles.content}>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <h1 className={styles.title}>{title}</h1>
      </div>
    </div>
  );
};

export default HeroImage;
