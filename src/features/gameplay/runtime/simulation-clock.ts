// Mirrors the authoritative simulation time advanced by GameLoop so presentation-only code
// can sample a stable gameplay clock without reaching back into React or the simulation runner.
let currentSimulationNowMs = 0;

export const getSimulationNowMs = () => currentSimulationNowMs;

export const setSimulationNowMs = (nowMs: number) => {
    currentSimulationNowMs = nowMs;
};

export const resetSimulationNowMs = () => {
    currentSimulationNowMs = 0;
};
