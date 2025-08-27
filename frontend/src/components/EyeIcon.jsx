import React from 'react';
import EyeSvg from '../assets/eye.svg';

export default function EyeIcon({ className }) {
  return (
    <img src={EyeSvg} alt="" className={className} aria-hidden="true" />
  );
}


