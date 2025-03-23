import { z } from 'zod';

export const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
	message: 'Invalid time format. Use HH:mm format'
});

export const dayScheduleSchema = z
	.object({
		day: z.string(),
		isOpen: z.boolean(),
		openingTime: timeSchema,
		closingTime: timeSchema
	})
	.refine(
		(data) => {
			if (!data.isOpen) return true;
			const [openHour, openMin] = data.openingTime.split(':').map(Number);
			const [closeHour, closeMin] = data.closingTime.split(':').map(Number);
			const openingMinutes = openHour * 60 + openMin;
			const closingMinutes = closeHour * 60 + closeMin;
			return closingMinutes > openingMinutes;
		},
		{
			message: 'Closing time must be after opening time',
			path: ['closingTime']
		}
	);
