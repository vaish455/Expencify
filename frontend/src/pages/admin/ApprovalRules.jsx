import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, CheckSquare, Users } from 'lucide-react';

const ApprovalRules = () => {
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SEQUENTIAL',
    percentageRequired: 50,
    specificApproverId: '',
    priority: 0,
    requiresManagerFirst: false,
    steps: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, usersRes] = await Promise.all([
        api.get('/approvals/rules'),
        api.get('/users') // Fetch all users instead of just managers
      ]);
      setRules(rulesRes.data.rules);
      // Filter to get managers and executive roles
      setUsers(usersRes.data.users.filter(u => 
        ['MANAGER', 'ADMIN', 'CEO', 'CFO', 'CTO', 'DIRECTOR'].includes(u.role)
      ));
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingRule) {
        await api.put(`/approvals/rules/${editingRule.id}`, formData);
        toast.success('Approval rule updated successfully');
      } else {
        await api.post('/approvals/rules', formData);
        toast.success('Approval rule created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this approval rule?')) return;

    try {
      await api.delete(`/approvals/rules/${ruleId}`);
      toast.success('Approval rule deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete approval rule');
    }
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type,
      percentageRequired: rule.percentageRequired || 50,
      specificApproverId: rule.specificApproverId || '',
      priority: rule.priority || 0,
      requiresManagerFirst: rule.requiresManagerFirst || false,
      steps: rule.steps.map(s => ({ approverId: s.approverId }))
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      type: 'SEQUENTIAL',
      percentageRequired: 50,
      specificApproverId: '',
      priority: 0,
      requiresManagerFirst: false,
      steps: []
    });
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { approverId: '' }]
    });
  };

  const removeStep = (index) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index)
    });
  };

  const updateStep = (index, approverId) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { approverId };
    setFormData({ ...formData, steps: newSteps });
  };

  if (loading && !showModal) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 loading-spinner"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Approval Rules</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary flex items-center space-x-2 rounded-xl shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Approval Rule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="card p-6 hover:shadow-xl">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckSquare className="w-6 h-6" style={{ color: '#714B67' }} />
                  <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Type: {rule.type}</p>
                
                <div className="space-y-2 text-sm">
                  {rule.requiresManagerFirst && (
                    <p className="text-purple-600 font-medium">⚡ Requires Manager Approval First</p>
                  )}
                  
                  <p className="text-gray-600">Priority: {rule.priority}</p>

                  {rule.type === 'PERCENTAGE' && (
                    <p className="text-gray-600">Required: {rule.percentageRequired}% approval</p>
                  )}
                  
                  {rule.type === 'SPECIFIC_APPROVER' && rule.specificApprover && (
                    <p className="text-gray-600">Specific Approver: {rule.specificApprover.name} ({rule.specificApprover.role})</p>
                  )}
                  
                  {rule.type === 'HYBRID' && (
                    <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #E6F7F8 0%, #B3E5E8 50%)' }}>
                      <p className="font-medium" style={{ color: '#017E84' }}>Hybrid Rule:</p>
                      <p style={{ color: '#016369' }}>• {rule.percentageRequired}% of approvers OR</p>
                      <p style={{ color: '#016369' }}>• {rule.specificApprover?.name} approves</p>
                    </div>
                  )}
                  
                  {rule.steps.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {rule.type === 'SEQUENTIAL' ? 'Approval Sequence:' : 'Approvers:'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {rule.steps.map((step, index) => (
                          <div key={step.id} className="flex items-center space-x-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#f5f3f4' }}>
                            {rule.type === 'SEQUENTIAL' && <span className="text-xs font-semibold text-gray-600">Step {index + 1}:</span>}
                            <span className="text-xs text-gray-800">{step.approver.name}</span>
                            <span className="text-xs text-gray-500">({step.approver.role})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(rule)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#714B67' }}>
              {editingRule ? 'Edit Approval Rule' : 'Add New Approval Rule'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ring-primary focus:border-transparent transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard Approval Flow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Approval Type</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ring-primary focus:border-transparent transition-all"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="SEQUENTIAL">Sequential - One by one</option>
                  <option value="PERCENTAGE">Percentage - X% must approve</option>
                  <option value="SPECIFIC_APPROVER">Specific Approver - Auto-approve by one person</option>
                  <option value="HYBRID">Hybrid - Percentage OR Specific Approver</option>
                </select>
              </div>

              {(formData.type === 'PERCENTAGE' || formData.type === 'HYBRID') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Percentage
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ring-primary focus:border-transparent transition-all"
                    value={formData.percentageRequired}
                    onChange={(e) => setFormData({ ...formData, percentageRequired: parseInt(e.target.value) })}
                  />
                </div>
              )}

              {(formData.type === 'SPECIFIC_APPROVER' || formData.type === 'HYBRID') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Approver
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ring-primary focus:border-transparent transition-all"
                    value={formData.specificApproverId}
                    onChange={(e) => setFormData({ ...formData, specificApproverId: e.target.value })}
                  >
                    <option value="">Select an approver</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ring-primary focus:border-transparent transition-all"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500 mt-1">Higher priority rules are evaluated first</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiresManagerFirst"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  checked={formData.requiresManagerFirst}
                  onChange={(e) => setFormData({ ...formData, requiresManagerFirst: e.target.checked })}
                />
                <label htmlFor="requiresManagerFirst" className="ml-2 block text-sm text-gray-700">
                  Require manager approval before this rule applies
                </label>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Approval Steps</label>
                  <button
                    type="button"
                    onClick={addStep}
                    className="text-primary hover:text-primary text-sm font-medium"
                  >
                    + Add Step
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600 w-16">Step {index + 1}</span>
                      <select
                        required
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ring-primary focus:border-transparent transition-all"
                        value={step.approverId}
                        onChange={(e) => updateStep(index, e.target.value)}
                      >
                        <option value="">Select approver</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {formData.steps.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No approval steps added yet</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-5 py-2.5 rounded-xl shadow-lg"
                >
                  {loading ? 'Saving...' : editingRule ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalRules;
