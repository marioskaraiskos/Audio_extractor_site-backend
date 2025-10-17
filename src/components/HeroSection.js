import React from 'react';
import { motion } from 'framer-motion';
import './HeroSection.css'; // simple styles

const HeroSection = () => {
  return (
    <motion.div
      className="hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <h1>Audio Extractor</h1>
      <p>Download From Youtube And Other Famous Platforms audio easily and fast via URL.</p>
      <a href="https://github.com/marioskaraiskos/Audio_extractor/releases" target="_blank" rel="noreferrer">
        Download for Windows
      </a>
    </motion.div>
  );
};

export default HeroSection;
