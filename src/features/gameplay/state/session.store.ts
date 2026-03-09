import { create } from 'zustand';

export type GameplaySessionState = {
    pause: () => void;
    paused: boolean;
    resetSession: () => void;
    resume: () => void;
    togglePause: () => void;
};

const initialSessionState = {
    paused: false,
};

export const useGameplaySessionStore = create<GameplaySessionState>()((set) => ({
    ...initialSessionState,
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
