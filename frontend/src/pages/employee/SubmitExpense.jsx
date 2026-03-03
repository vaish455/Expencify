import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Upload, Camera, DollarSign, Calendar, FileText, Tag, ArrowLeft } from 'lucide-react';

const SubmitExpense = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currencies] = useState(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD']);
  const [receipt, setReceipt] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: user?.company?.currency || 'USD',
    expenseDate: new Date().toISOString().split('T')[0],
    paidBy: 'Personal',
    categoryId: '',
    remarks: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
      if (data.categories.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: data.categories[0].id }));
      }
    } catch {
      toast.error('Failed to load categories');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceipt(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleOCRScan = async () => {
    if (!receipt) {
      toast.error('Please upload a receipt first');
      return;
    }

    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', receipt);

      const { data } = await api.post('/expenses/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Receipt scanned successfully!');
      
      setFormData(prev => ({
        ...prev,
        description: data.data.merchantName || prev.description,
        amount: data.data.extractedAmount || prev.amount,
        expenseDate: data.data.extractedDate 
          ? new Date(data.data.extractedDate).toISOString().split('T')[0]
          : prev.expenseDate
      }));
    } catch {
      toast.error('Failed to parse receipt. Please fill details manually.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      if (receipt) {
        submitData.append('receipt', receipt);
      }

      await api.post('/expenses', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Expense submitted successfully!');
      navigate('/my-expenses');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Submit Expense</h1>
          <p className="text-sm text-slate-500 mt-1">Upload receipt and enter details for reimbursement.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-premium p-6 sm:p-8 space-y-8">
        {/* Receipt Upload */}
        <div>
          <label className="label-text">
            Receipt Upload <span className="text-slate-400 font-normal">(Optional but recommended)</span>
          </label>
          <div className="mt-2 border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-50 transition-colors bg-white group">
            {previewUrl ? (
              <div className="space-y-6">
                <img src={previewUrl} alt="Receipt" className="max-h-64 mx-auto rounded-lg shadow-sm" />
                <div className="flex justify-center flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={handleOCRScan}
                    disabled={ocrLoading}
                    className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {ocrLoading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <span>{ocrLoading ? 'Scanning receipt...' : 'Auto-fill with AI scan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReceipt(null);
                      setPreviewUrl(null);
                    }}
                    className="btn-secondary"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center">
                <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-indigo-600 mb-1">Click to upload</span>
                <span className="text-xs text-slate-500">PDF, PNG, JPG (max 5MB)</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Details Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
          <div className="md:col-span-2">
            <label className="label-text">
              Description *
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                className="input-field !pl-10"
                placeholder="e.g., Client dinner at Italian restaurant"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label-text">Amount *</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                className="input-field !pl-10 font-medium"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label-text">Currency *</label>
            <select
              required
              className="input-field mt-1"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text">Date incurred *</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="date"
                required
                className="input-field !pl-10"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label-text">Category *</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="w-5 h-5 text-slate-400" />
              </div>
              <select
                required
                className="input-field !pl-10"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-text">Payment Method *</label>
            <select
              required
              className="input-field mt-1"
              value={formData.paidBy}
              onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
            >
              <option value="Personal">Personal Card/Cash (Reimbursable)</option>
              <option value="Corporate Card">Corporate Card (Non-reimbursable)</option>
              <option value="Cash">Petty Cash</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="label-text">Additional Remarks</label>
            <textarea
              rows={3}
              className="input-field mt-1 resize-none"
              placeholder="Any context the approver should know..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/my-expenses')}
            className="btn-secondary"
          >
            Cancel
          </button>
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
              'Submit Expense'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitExpense;
