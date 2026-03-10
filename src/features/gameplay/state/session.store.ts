import { create } from 'zustand';

export type SessionEncounterFeedback = {
    detail: string;
    expiresAtMs: number;
    title: string;
    tone: 'accent' | 'danger' | 'warning';
};

export type SessionDefeatState = {
    detail: string;
    title: string;
};

export type GameplaySessionState = {
    clearDefeat: () => void;
    clearEncounterFeedback: () => void;
    defeat: SessionDefeatState | null;
    dismissOnboarding: () => void;
    encounterFeedback: SessionEncounterFeedback | null;
    onboardingDismissed: boolean;
    pause: () => void;
    paused: boolean;
    showDefeat: (defeat: SessionDefeatState) => void;
    showEncounterFeedback: (feedback: {
        detail: string;
        durationMs: number;
        title: string;
        tone: 'accent' | 'danger' | 'warning';
    }) => void;
    resetSession: () => void;
    resume: () => void;
    togglePause: () => void;
};

const initialSessionState = {
    defeat: null as SessionDefeatState | null,
    encounterFeedback: null as SessionEncounterFeedback | null,
    onboardingDismissed: false,
    paused: false,
};

export const useGameplaySessionStore = create<GameplaySessionState>()((set) => ({
    ...initialSessionState,
    clearDefeat: () => set({ defeat: null }),
    clearEncounterFeedback: () => set({ encounterFeedback: null }),
    dismissOnboarding: () => set({ onboardingDismissed: true }),
    pause: () => set({ paused: true }),
    resetSession: () => set(initialSessionState),
    resume: () => set({ paused: false }),
    showDefeat: (defeat) =>
        set({
            defeat,
            paused: true,
        }),
    showEncounterFeedback: (feedback) =>
        set({
            encounterFeedback: {
                detail: feedback.detail,
                expiresAtMs: performance.now() + feedback.durationMs,
                title: feedback.title,
                tone: feedback.tone,
            },
        }),
    togglePause: () =>
        set((state) => ({
            paused: !state.paused,
        })),
}));

export const resetGameplaySessionStore = () => {
    useGameplaySessionStore.setState(initialSessionState);
};
