let currentSimulationNowMs = 0;

export const getSimulationNowMs = () => currentSimulationNowMs;

export const setSimulationNowMs = (nowMs: number) => {
    currentSimulationNowMs = nowMs;
};

export const resetSimulationNowMs = () => {
    currentSimulationNowMs = 0;
};
