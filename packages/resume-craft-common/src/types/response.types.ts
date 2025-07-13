import { Response } from 'express';

export type ServerTimingService = {
    startTime: (metricKey: string, description: string) => void;
    endTime: (metricKey: string) => void;
    setMetric: (metricKey: string, timeInMs: number, description: string) => void;
};

export type ResumeCraftResponse = Response & ServerTimingService;
