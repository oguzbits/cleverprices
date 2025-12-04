'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEngagement } from '@/lib/analytics';

/**
 * ScrollTracker Component
 * 
 * Trackt wie weit Nutzer auf der Seite scrollen.
 * Wichtig für SEO: Zeigt ob Content engaging ist.
 * 
 * Usage: Füge <ScrollTracker /> in dein Layout ein
 */
export function ScrollTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let maxScroll = 0;
    const milestones = {
      25: false,
      50: false,
      75: false,
      100: false,
    };

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      const scrollPercentage = 
        ((scrollTop + windowHeight) / documentHeight) * 100;

      maxScroll = Math.max(maxScroll, scrollPercentage);

      // Track bei Meilensteinen (25%, 50%, 75%, 100%)
      Object.entries(milestones).forEach(([milestone, tracked]) => {
        const milestoneNum = parseInt(milestone);
        if (maxScroll >= milestoneNum && !tracked) {
          trackEngagement.scrollDepth(pathname, milestoneNum);
          milestones[milestoneNum as keyof typeof milestones] = true;
        }
      });
    };

    // Throttle scroll events für Performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    // Initial check (falls Seite schon gescrollt ist)
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [pathname]);

  return null; // Unsichtbares Component
}
