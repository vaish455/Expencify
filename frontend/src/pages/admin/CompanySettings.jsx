import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Building2, Save, MapPin, DollarSign } from 'lucide-react';

const CompanySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    currency: ''
  });

  const currencies = [
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'INR', name: 'Indian Rupee (₹)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' }
  ];

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const { data } = await api.get('/company');
      setCompany(data.company);
      setFormData({
        name: data.company.name || '',
        country: data.company.country || '',
        currency: data.company.currency || 'USD'
      });
    } catch {
      toast.error('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put('/company', formData);
      toast.success('Company settings updated successfully');
      fetchCompanyData(); // Refresh data to show reflected changes
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update company settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Company Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage global settings, localization, and base currency.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Stats/Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-premium p-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100 shadow-sm">
              <Building2 className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{company?.name || 'Your Company'}</h2>
            <p className="text-sm text-slate-500 mb-6">Subscription: Enterprise Plan</p>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Users</p>
                <p className="text-2xl font-bold text-slate-900">{company?._count?.users || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-slate-900">{company?._count?.expenses || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Settings Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card-premium">
            <div className="p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6">General Information</h2>
              
              <div>
                <label className="label-text">Organization Name</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    className="input-field !pl-10"
                    placeholder="Acme Corp"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="label-text">Operating Country</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      className="input-field !pl-10"
                      placeholder="e.g. United States"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label-text">Base Currency</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="w-5 h-5 text-slate-400" />
                    </div>
                    <select
                      required
                      className="input-field !pl-10 font-medium"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    >
                      {currencies.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    This is the currency all analytics and cross-currency conversions will be rolled up to.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between rounded-b-xl">
              <p className="text-xs text-slate-500">
                Only Organization Admins can modify these settings.
              </p>
              <button
                type="submit"
                disabled={saving || loading}
                className="btn-primary min-w-[140px] shadow-sm"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
