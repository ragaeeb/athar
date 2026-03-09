import { create } from 'zustand';

export type GameplaySessionState = {
    dismissOnboarding: () => void;
    onboardingDismissed: boolean;
    pause: () => void;
    paused: boolean;
    resetSession: () => void;
    resume: () => void;
    togglePause: () => void;
};

const initialSessionState = {
    onboardingDismissed: false,
    paused: false,
};

export const useGameplaySessionStore = create<GameplaySessionState>()((set) => ({
    ...initialSessionState,
    dismissOnboarding: () => set({ onboardingDismissed: true }),
    pause: () => set({ paused: true }),
    resetSession: () => set(initialSessionState),
    resume: () => set({ paused: false }),
    togglePause: () =>
        set((state) => ({
            paused: !state.paused,
        })),
}));

export const resetGameplaySessionStore = () => {
    useGameplaySessionStore.setState(initialSessionState);
};
