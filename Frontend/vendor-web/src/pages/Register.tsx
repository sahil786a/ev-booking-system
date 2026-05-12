import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, Phone, User } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  name:          z.string().min(2, 'Name must be at least 2 characters'),
  business_name: z.string().min(3, 'Business name must be at least 3 characters'),
  email:         z.string().email('Enter a valid email address'),
  phone:         z.string().min(7, 'Enter a valid phone number').max(15),
  password:      z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const Register: React.FC = () => {
  const { register: registerVendor } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword: _, ...payload } = data;
      await registerVendor(payload);
      toast.success('Account created! Welcome aboard.');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create vendor account" subtitle="Get started managing your EV stations">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <Input
          label="Full Name"
          placeholder="Jane Doe"
          autoComplete="name"
          error={errors.name?.message}
          leftIcon={<User size={15} />}
          {...register('name')}
        />
        <Input
          label="Business Name"
          placeholder="My EV Charging Co."
          error={errors.business_name?.message}
          leftIcon={<Building2 size={15} />}
          {...register('business_name')}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="vendor@example.com"
          autoComplete="email"
          error={errors.email?.message}
          leftIcon={<Mail size={15} />}
          {...register('email')}
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="9876543210"
          error={errors.phone?.message}
          leftIcon={<Phone size={15} />}
          {...register('phone')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          leftIcon={<Lock size={15} />}
          {...register('password')}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          leftIcon={<Lock size={15} />}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full mt-1"
        >
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
