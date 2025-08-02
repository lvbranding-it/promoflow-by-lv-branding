import React from 'react';

const LoadingAnimation = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    <p className="text-muted-foreground">Loading...</p>
  </div>
);

export default LoadingAnimation;
