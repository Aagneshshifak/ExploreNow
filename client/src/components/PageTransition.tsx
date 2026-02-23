import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut');
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`${
        transitionStage === 'fadeOut' ? 'animate-out fade-out duration-150' : 'animate-in fade-in duration-300'
      }`}
      onAnimationEnd={() => {
        if (transitionStage === 'fadeOut') {
          setTransitionStage('fadeIn');
          setDisplayLocation(location);
          // Reset scroll position after fade out, before fade in
          window.scrollTo(0, 0);
        }
      }}
    >
      {children}
    </div>
  );
}
