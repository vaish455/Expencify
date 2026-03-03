import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Upload, Camera, DollarSign, Calendar, FileText, Tag } from 'lucide-react';

const SubmitExpense = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD']);
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
    } catch (error) {
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
    } catch (error) {
      toast.error('Failed to scan receipt');
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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit Expense</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Receipt Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Receipt Upload
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {previewUrl ? (
              <div className="space-y-4">
                <img src={previewUrl} alt="Receipt" className="max-h-64 mx-auto rounded" />
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={handleOCRScan}
                    disabled={ocrLoading}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Camera className="w-5 h-5" />
                    <span>{ocrLoading ? 'Scanning...' : 'Scan with OCR'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReceipt(null);
                      setPreviewUrl(null);
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer block text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <span className="text-sm text-gray-600">Click to upload receipt</span>
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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ring-primary focus:border-transparent"
              placeholder="e.g., Team lunch at restaurant"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                required
                step="0.01"
                min="0"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ring-primary focus:border-transparent"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency *
            </label>
            <select
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ring-primary focus:border-transparent"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expense Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expense Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ring-primary focus:border-transparent"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ring-primary focus:border-transparent"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Paid By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paid By *
          </label>
          <select
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ring-primary focus:border-transparent"
            value={formData.paidBy}
            onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
          >
            <option value="Personal">Personal</option>
            <option value="Corporate Card">Corporate Card</option>
            <option value="Cash">Cash</option>
          </select>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remarks
          </label>
          <textarea
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ring-primary focus:border-transparent"
            placeholder="Additional notes or comments..."
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/my-expenses')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-2 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitExpense;
