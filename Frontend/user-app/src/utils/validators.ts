import { z } from 'zod';

import { combineDateAndTimeUtcLocal } from './dateFormat';

export const loginSchema = z.object({
  email: z
    .string()
    .min(3, 'Email looks too short')
    .email('Enter a valid email address'),
  password: z.string().min(6, 'Use at least 6 characters'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Please enter your name'),
    email: z
      .string()
      .min(3, 'Email looks too short')
      .email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((vals) => vals.password === vals.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const scheduledBookingSchema = z
  .object({
    stationId: z.number().int().positive(),
    bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
    startTime: z.string().regex(/^([01]?\d|2[0-3]):([0-5]\d)$/, 'Use HH:mm (24-hour)'),
    endTime: z.string().regex(/^([01]?\d|2[0-3]):([0-5]\d)$/, 'Use HH:mm (24-hour)'),
  })
  .superRefine((val, ctx) => {
    const s = combineDateAndTimeUtcLocal(val.bookingDate, val.startTime);
    const e = combineDateAndTimeUtcLocal(val.bookingDate, val.endTime);
    if (!s || !e) {
      ctx.addIssue({ code: 'custom', message: 'Invalid booking date/time', path: ['bookingDate'] });
      return;
    }
    if (e.getTime() <= s.getTime()) {
      ctx.addIssue({
        code: 'custom',
        message: 'End time must be after start time',
        path: ['endTime'],
      });
    }
  });

export const immediateBookingSchema = z.object({
  stationId: z.number().int().positive(),
});
