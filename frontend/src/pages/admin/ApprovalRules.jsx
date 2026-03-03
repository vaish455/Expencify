import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, ShieldCheck, Filter, AlertCircle } from 'lucide-react';

const ApprovalRules = () => {
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SEQUENTIAL',
    percentageRequired: 50,
    specificApproverId: '',
    categoryId: '',
    minAmount: '',
    maxAmount: '',
    priority: 0,
    requiresManagerFirst: false,
    steps: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, usersRes, categoriesRes] = await Promise.all([
        api.get('/approvals/rules'),
        api.get('/users'),
        api.get('/categories')
      ]);
      setRules(rulesRes.data.rules);
      setUsers(usersRes.data.users.filter(u => 
        ['MANAGER', 'ADMIN', 'CEO', 'CFO', 'CTO', 'DIRECTOR'].includes(u.role)
      ));
      setCategories(categoriesRes.data.categories || []);
    } catch {
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
    if (!confirm('Are you sure you want to delete this approval rule? This might affect incoming expense processing.')) return;

    try {
      await api.delete(`/approvals/rules/${ruleId}`);
      toast.success('Approval rule deleted successfully');
      fetchData();
    } catch {
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
      categoryId: rule.categoryId || '',
      minAmount: rule.minAmount != null ? rule.minAmount : '',
      maxAmount: rule.maxAmount != null ? rule.maxAmount : '',
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
      categoryId: '',
      minAmount: '',
      maxAmount: '',
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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-slide-up pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Approval Engine</h1>
          <p className="text-sm text-slate-500 mt-1">Configure company-wide rules for expense approvals.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Rule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.length === 0 ? (
           <div className="col-span-full card-premium p-12 text-center">
             <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-slate-900 mb-1">No Active Rules</h3>
             <p className="text-slate-500">Create an approval rule to automate how expenses get reviewed.</p>
           </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="card-premium flex flex-col hover:border-indigo-200 transition-colors">
              <div className="p-6 border-b border-slate-100 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold shrink-0">
                      {rule.priority}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">{rule.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                          rule.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200">
                          {rule.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(rule)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded bg-white border border-slate-200 shadow-sm transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(rule.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded bg-white border border-slate-200 shadow-sm transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 mt-5">
                  {(rule.category || rule.minAmount != null || rule.maxAmount != null) ? (
                    <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <Filter className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="text-sm font-medium text-slate-700">
                        {rule.category ? <span className="block mb-0.5">Category: <span className="font-bold">{rule.category.name}</span></span> : null}
                        {(rule.minAmount != null || rule.maxAmount != null) && (
                          <span className="block text-xs uppercase tracking-wider text-slate-500 font-bold">
                            Amount: 
                            {rule.minAmount != null ? ` ≥${rule.minAmount.toLocaleString()}` : ''}
                            {rule.minAmount != null && rule.maxAmount != null ? ' AND ' : ''}
                            {rule.maxAmount != null ? ` ≤${rule.maxAmount.toLocaleString()}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic bg-slate-50 p-2.5 rounded border border-slate-100">
                      Applies globally to all expenses
                    </div>
                  )}

                  {rule.requiresManagerFirst && (
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-purple-700 bg-purple-50 px-3 py-2 rounded-lg border border-purple-100">
                      <AlertCircle className="w-4 h-4" />
                      Requires Direct Manager Review First
                    </div>
                  )}
                  
                  {rule.type === 'PERCENTAGE' && (
                    <div className="text-sm border border-slate-100 rounded-lg p-3 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 bg-blue-50" style={{ width: `${rule.percentageRequired}%` }}></div>
                      <span className="relative font-semibold text-slate-900">{rule.percentageRequired}% Quorum Required</span>
                    </div>
                  )}
                  
                  {rule.type === 'SPECIFIC_APPROVER' && rule.specificApprover && (
                    <div className="text-sm border border-slate-100 rounded-lg p-3 bg-slate-50 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                         {rule.specificApprover.name.charAt(0)}
                       </div>
                       <span className="font-semibold text-slate-900">{rule.specificApprover.name} ({rule.specificApprover.role})</span>
                    </div>
                  )}
                  
                  {rule.type === 'HYBRID' && (
                    <div className="text-sm border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                      <p className="font-bold text-slate-900 mb-1">Either condition met:</p>
                      <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                        <li><span className="font-semibold">{rule.percentageRequired}%</span> of total approvers</li>
                        <li>Explicit approval by <span className="font-semibold">{rule.specificApprover?.name}</span></li>
                      </ul>
                    </div>
                  )}
                  
                  {rule.steps.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        {rule.type === 'SEQUENTIAL' ? 'Approval Walkthrough' : 'Eligible Approvers'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {rule.steps.map((step, index) => (
                          <div key={step.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-sm">
                            {rule.type === 'SEQUENTIAL' && <span className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold">{index + 1}</span>}
                            <span className="text-xs font-bold text-slate-800">{step.approver.name}</span>
                            <span className="text-[10px] font-medium text-slate-500 uppercase">{step.approver.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !loading && setShowModal(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-slide-up overflow-hidden border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
               <h2 className="text-xl font-bold text-slate-900">
                 {editingRule ? 'Edit Approval Rule' : 'New Approval Rule'}
               </h2>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="rule-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="label-text">Rule Name</label>
                    <input
                      type="text"
                      required
                      className="input-field mt-1"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Enterprise Software Approval"
                    />
                  </div>

                  <div>
                    <label className="label-text">Approval Type</label>
                    <select
                      className="input-field mt-1 font-medium text-indigo-900"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="SEQUENTIAL">Sequential (Step 1 → Step 2)</option>
                      <option value="PERCENTAGE">Percentage (Any X%)</option>
                      <option value="SPECIFIC_APPROVER">Specific Override</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-text">Priority Index</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field mt-1"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-slate-500 mt-1.5 font-medium">Rules evaluate in descending priority order (10 before 1)</p>
                  </div>

                  {(formData.type === 'PERCENTAGE' || formData.type === 'HYBRID') && (
                    <div>
                      <label className="label-text">
                        Required Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="input-field mt-1"
                        value={formData.percentageRequired}
                        onChange={(e) => setFormData({ ...formData, percentageRequired: parseInt(e.target.value) })}
                      />
                    </div>
                  )}

                  {(formData.type === 'SPECIFIC_APPROVER' || formData.type === 'HYBRID') && (
                    <div className={formData.type === 'SPECIFIC_APPROVER' ? "md:col-span-2" : ""}>
                      <label className="label-text">
                        Specific Approver
                      </label>
                      <select
                        className="input-field mt-1"
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
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Rule Triggers (Optional)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="label-text">Category</label>
                      <select
                        className="input-field mt-1"
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-1">
                      <label className="label-text">Min Amount</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Any"
                        className="input-field mt-1 font-mono"
                        value={formData.minAmount}
                        onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="label-text">Max Amount</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Any"
                        className="input-field mt-1 font-mono"
                        value={formData.maxAmount}
                        onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-600"
                          checked={formData.requiresManagerFirst}
                          onChange={(e) => setFormData({ ...formData, requiresManagerFirst: e.target.checked })}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-900">Require Direct Manager Approval First</span>
                    </label>
                    <p className="text-xs text-slate-500 ml-7 mt-1 font-medium">If checked, the user's direct manager must approve before this rule triggers.</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                      {formData.type === 'SEQUENTIAL' ? 'Approval Steps' : 'Eligible Approver Pool'}
                    </label>
                    <button
                      type="button"
                      onClick={addStep}
                      className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded"
                    >
                      + Add Participant
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
                        {formData.type === 'SEQUENTIAL' && (
                          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-slate-500">{index + 1}</span>
                          </div>
                        )}
                        <select
                          required
                          className="input-field flex-1 py-1.5"
                          value={step.approverId}
                          onChange={(e) => updateStep(index, e.target.value)}
                        >
                          <option value="">Select an orchestrator</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formData.steps.length === 0 && (
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                        <p className="text-sm font-semibold text-slate-500">No participants defined.</p>
                        <p className="text-xs text-slate-400 mt-1">Add users who are authorized to act in this rule.</p>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="rule-form"
                disabled={loading}
                className="btn-primary min-w-[120px]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving
                  </span>
                ) : (
                  editingRule ? 'Update Rule' : 'Save Rule'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApprovalRules;
