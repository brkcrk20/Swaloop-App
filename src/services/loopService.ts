import { Loop, LoopParticipant } from '../types';
import { INITIAL_LOOPS } from '../data/mockData';

let loopsStore: Loop[] = [...INITIAL_LOOPS];

export const loopService = {
  getLoops(): Loop[] {
    return [...loopsStore];
  },

  getLoopById(id: string): Loop | undefined {
    return loopsStore.find((l) => l.id === id);
  },

  confirmParticipantStep(loopId: string, userId: string): Loop | undefined {
    const loop = loopsStore.find((l) => l.id === loopId);
    if (!loop) return undefined;

    const participant = loop.participants.find((p) => p.userId === userId);
    if (participant) {
      participant.hasConfirmed = true;
      participant.status = 'confirmed';
    }

    const allConfirmed = loop.participants.every((p) => p.hasConfirmed);
    if (allConfirmed) {
      loop.status = 'in_delivery';
    }

    return loop;
  },

  completeLoop(loopId: string): Loop | undefined {
    const loop = loopsStore.find((l) => l.id === loopId);
    if (!loop) return undefined;

    loop.status = 'completed';
    loop.completedAt = new Date().toISOString();
    loop.participants.forEach((p) => {
      p.status = 'completed';
    });

    return loop;
  },
};
