// hooks/useScroll.ts
import { useState, useEffect, useRef } from 'react';

// The point at which the header will shrink when scrolling DOWN.
const SHRINK_THRESHOLD = 10;
// A lower point at which the header will expand when scrolling UP.
const EXPAND_THRESHOLD = 5;

export const useScroll = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const scrollYRef = useRef(window.scrollY);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const previousScrollY = scrollYRef.current;
            const isScrollingDown = currentScrollY > previousScrollY;

            setIsScrolled(currentState => {
                // If scrolling down and the header is currently expanded, check if we should shrink it.
                if (isScrollingDown && !currentState && currentScrollY > SHRINK_THRESHOLD) {
                    return true;
                }
                // If scrolling up and the header is currently shrunk, check if we should expand it.
                if (!isScrollingDown && currentState && currentScrollY < EXPAND_THRESHOLD) {
                    return false;
                }
                // Otherwise, keep the current state.
                return currentState;
            });
            
            // Update the ref for the next scroll event.
            scrollYRef.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []); // This effect runs only once and manages its own state via refs.

    return isScrolled;
};
