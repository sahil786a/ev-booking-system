import React from 'react';
import { Building2, Mail, Phone, Shield, User, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/common/Badge';

const ProfileRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon, label, value,
}) => (
  <div className="flex items-center gap-4 py-3.5 border-b border-slate-50 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
    </div>
  </div>
);

const Profile: React.FC = () => {
  const { vendor } = useAuth();

  if (!vendor) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Your vendor account information</p>
      </div>

      {/* Profile card */}
      <div className="card overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-br from-emerald-600 to-teal-500 relative">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        {/* Avatar + name */}
        <div className="px-6 pb-6">
          <div className="-mt-8 mb-4 flex items-end gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500">
              <span className="text-white text-2xl font-bold">
                {vendor.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="mb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{vendor.name}</h2>
                <Badge variant="active">
                  <Shield size={10} />
                  Verified
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{vendor.business_name}</p>
            </div>
          </div>

          {/* Info rows */}
          <ProfileRow icon={<User size={15} />}     label="Full Name"     value={vendor.name} />
          <ProfileRow icon={<Building2 size={15} />} label="Business Name" value={vendor.business_name} />
          <ProfileRow icon={<Mail size={15} />}     label="Email Address" value={vendor.email} />
          <ProfileRow icon={<Phone size={15} />}    label="Phone Number"  value={vendor.phone} />
          <ProfileRow icon={<Zap size={15} />}      label="Role"          value="Vendor" />
          <ProfileRow icon={<Shield size={15} />}   label="Vendor ID"     value={`#${vendor.id}`} />
        </div>
      </div>

      {/* Account actions info */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Account Management</h3>
        <div className="space-y-2">
          {['Update profile', 'Change password', 'Notification preferences', 'Delete account'].map((action) => (
            <div
              key={action}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-50 cursor-not-allowed"
            >
              <span className="text-sm text-slate-400">{action}</span>
              <span className="text-[10px] font-semibold bg-slate-200 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
                Coming Soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
