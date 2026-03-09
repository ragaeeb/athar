export const supportsTouchTraversalControls = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    if (navigator.maxTouchPoints > 0) {
        return true;
    }

    return window.matchMedia?.('(pointer: coarse)').matches ?? false;
};
