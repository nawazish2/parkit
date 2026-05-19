import { Slot } from '../models/Slot';

export const generateSlots = async (lotId: number, numSlots: number): Promise<void> => {
  const slotsToCreate = [];
  const prefix = ['A', 'B', 'C', 'D']; // Simulate floors or zones

  for (let i = 0; i < numSlots; i++) {
    const zone = prefix[Math.floor(i / 10) % prefix.length];
    const number = (i % 10) + 1;
    slotsToCreate.push({
      lotId,
      slotNumber: `${zone}${number}`,
      isAvailable: true,
    });
  }

  await Slot.bulkCreate(slotsToCreate);
};
