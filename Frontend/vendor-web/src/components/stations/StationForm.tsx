import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import type { Station, StationPayload } from '@/types';

const latLngRegex = /^-?\d{1,3}(\.\d+)?$/;

const stationSchema = z.object({
  name:        z.string().min(3, 'Name must be at least 3 characters'),
  latitude:    z
    .string()
    .min(1, 'Latitude is required')
    .refine((v) => latLngRegex.test(v), 'Use decimal format, e.g. 28.6139')
    .refine((v) => Math.abs(Number(v)) <= 90, 'Latitude must be between -90 and 90')
    .transform(Number),
  longitude:   z
    .string()
    .min(1, 'Longitude is required')
    .refine((v) => latLngRegex.test(v), 'Use decimal format, e.g. 77.2090')
    .refine((v) => Math.abs(Number(v)) <= 180, 'Longitude must be between -180 and 180')
    .transform(Number),
  contact:     z.string().min(7, 'Enter a valid contact number').max(15),
  total_slots: z.coerce.number().int().min(1, 'At least 1 slot required').max(100),
});

type StationFormData = z.infer<typeof stationSchema>;

interface StationFormProps {
  defaultValues?: Station | null;
  onSubmit: (payload: StationPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const StationForm: React.FC<StationFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StationFormData>({
    resolver: zodResolver(stationSchema),
    defaultValues: defaultValues
      ? {
          name:        defaultValues.name,
          latitude:    String(defaultValues.latitude),
          longitude:   String(defaultValues.longitude),
          contact:     defaultValues.contact,
          total_slots: defaultValues.total_slots,
        }
      : {
          name:        '',
          latitude:    '',
          longitude:   '',
          contact:     '',
          total_slots: 3,
        },
  });

  // Reset when switching between edit targets
  useEffect(() => {
    if (defaultValues) {
      reset({
        name:        defaultValues.name,
        latitude:    String(defaultValues.latitude),
        longitude:   String(defaultValues.longitude),
        contact:     defaultValues.contact,
        total_slots: defaultValues.total_slots,
      });
    } else {
      reset({ name: '', latitude: '', longitude: '', contact: '', total_slots: 3 });
    }
  }, [defaultValues, reset]);

  const handleFormSubmit = async (data: StationFormData) => {
    await onSubmit(data as StationPayload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Station Name"
        placeholder="e.g. Downtown EV Hub"
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Latitude"
          type="text"
          inputMode="decimal"
          placeholder="e.g. 28.6139"
          error={errors.latitude?.message}
          {...register('latitude')}
        />
        <Input
          label="Longitude"
          type="text"
          inputMode="decimal"
          placeholder="e.g. 77.2090"
          error={errors.longitude?.message}
          {...register('longitude')}
        />
      </div>

      <Input
        label="Contact Number"
        placeholder="e.g. 9876543210"
        error={errors.contact?.message}
        {...register('contact')}
      />

      <Input
        label="Total Slots"
        type="number"
        min={1}
        max={100}
        step={1}
        placeholder="e.g. 3"
        hint="Number of charging slots available at this station (1–100)"
        error={errors.total_slots?.message}
        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        {...register('total_slots')}
      />

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="flex-1"
        >
          {defaultValues ? 'Update Station' : 'Add Station'}
        </Button>
      </div>
    </form>
  );
};
