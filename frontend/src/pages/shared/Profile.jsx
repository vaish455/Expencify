import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { User, Lock, Mail, Building, Shield, Save } from 'lucide-react';

const Profile = () => {
  const { user, setAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.put('/auth/update-profile', profileData);
      setAuth(data.user, localStorage.getItem('token'));
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'company', label: 'Company Details', icon: Building },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up pb-12">
      {/* Header Profile Card */}
      <div className="card-premium overflow-hidden bg-white">
        <div className="relative h-32 bg-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-slate-900"></div>
          {/* Decorative pattern could go here */}
        </div>
        
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end gap-6 space-x-1">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-sm">
                  <div className="w-full h-full bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100/50">
                    <span className="text-3xl font-bold text-indigo-700">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user?.name}</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">{user?.email}</p>
              </div>
            </div>
            <div className="pb-1 hidden sm:block">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Shield className="w-3.5 h-3.5" />
                {user?.role}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-100">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all focus:outline-none flex items-center gap-2 ${
                      isActive
                        ? 'text-indigo-600 border-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-8">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="label-text">
                        Full Name
                      </label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          required
                          className="input-field !pl-10"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label-text">
                        Email Address
                      </label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                          type="email"
                          disabled
                          className="input-field !pl-10 bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed"
                          value={user?.email}
                        />
                      </div>
                      <p className="text-xs font-medium text-slate-400 mt-1.5">Email address cannot be changed</p>
                    </div>

                    <div>
                      <label className="label-text">
                        System Role
                      </label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Shield className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          disabled
                          className="input-field !pl-10 bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed"
                          value={user?.role}
                        />
                      </div>
                      <p className="text-xs font-medium text-slate-400 mt-1.5">Role is assigned by your administrator</p>
                    </div>

                    {user?.manager && (
                      <div className="md:col-span-2">
                        <label className="label-text">
                          Reporting Manager
                        </label>
                        <div className="relative mt-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="w-5 h-5 text-slate-400" />
                          </div>
                          <input
                            type="text"
                            disabled
                            className="input-field !pl-10 bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed"
                            value={user.manager.name}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary min-w-[140px]"
                  >
                    {loading ? (
                       <span className="flex items-center gap-2">
                         <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                         Saving...
                       </span>
                    ) : (
                       <span className="flex items-center gap-2">
                         <Save className="w-4 h-4" />
                         Save Changes
                       </span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Change Password</h3>
                  <div className="space-y-5 max-w-md">
                    <div>
                      <label className="label-text">
                        Current Password
                      </label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                          type="password"
                          required
                          className="input-field !pl-10"
                          placeholder="••••••••"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label-text">
                        New Password
                      </label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                          type="password"
                          required
                          minLength={6}
                          className="input-field !pl-10"
                          placeholder="••••••••"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label-text">
                        Confirm New Password
                      </label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                          type="password"
                          required
                          minLength={6}
                          className="input-field !pl-10"
                          placeholder="••••••••"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mt-6">
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">
                        Password Requirements
                      </p>
                      <ul className="text-sm space-y-1 text-slate-600 list-disc list-inside">
                        <li>At least 6 characters long</li>
                        <li>You will receive an email notification after changing password</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-start pt-6 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Changing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Change Password
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'company' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="label-text">
                        Company Name
                      </label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          disabled
                          className="input-field !pl-10 bg-slate-50 text-slate-600 border-slate-200 cursor-not-allowed font-medium"
                          value={user?.company?.name || 'N/A'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label-text">
                        Country
                      </label>
                      <div className="relative mt-1">
                        <input
                          type="text"
                          disabled
                          className="input-field bg-slate-50 text-slate-600 border-slate-200 cursor-not-allowed font-medium"
                          value={user?.company?.country || 'N/A'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label-text">
                        Primary Currency
                      </label>
                      <div className="relative mt-1">
                        <input
                          type="text"
                          disabled
                          className="input-field bg-slate-50 text-slate-600 border-slate-200 cursor-not-allowed font-medium"
                          value={user?.company?.currency || 'N/A'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
