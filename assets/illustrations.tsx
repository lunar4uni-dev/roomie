
import React from 'react';

/**
 * EYE ASSETS
 * Manage the paths here to "redraw" Roomie's expressions.
 */
export const EyeAssets = {
  Happy: () => (
    <>
      <path d="M40,50 Q60,30 80,50" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M120,50 Q140,30 160,50" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" />
    </>
  ),
  Sad: () => (
    <>
      <path d="M40,60 Q60,45 80,60" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M120,60 Q140,45 160,60" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" />
    </>
  ),
  Excited: () => (
    <>
       <circle cx="60" cy="55" r="12" fill="white" />
       <circle cx="140" cy="55" r="12" fill="white" />
    </>
  ),
  Default: () => (
    <>
      <circle cx="60" cy="55" r="8" fill="white" />
      <circle cx="140" cy="55" r="8" fill="white" />
    </>
  )
};

/**
 * MOUTH ASSETS
 */
export const MouthAssets = {
  Speaking: "M70,140 Q100,160 130,140",
  Resting: "M80,140 Q100,150 120,140",
  Sad: "M80,150 Q100,140 120,150"
};

/**
 * EXTRA DECORATIONS
 */
export const FaceDecorations = () => (
  <>
    <circle cx="40" cy="85" r="10" fill="pink" opacity="0.4" />
    <circle cx="160" cy="85" r="10" fill="pink" opacity="0.4" />
  </>
);
