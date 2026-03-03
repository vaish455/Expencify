import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, DollarSign, User, Tag, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currencyUtils';

const ExpenseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    fetchExpenseDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchExpenseDetails = async () => {
    try {
      const { data } = await api.get(`/expenses/${id}`);
      setExpense(data.expense);
    } catch {
      toast.error('Failed to load expense details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!expense) return null;

  const statusConfig = {
    PENDING: { style: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock, label: 'Pending' },
    IN_PROGRESS: { style: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock, label: 'In Review' },
    APPROVED: { style: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle, label: 'Approved' },
    REJECTED: { style: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircle, label: 'Rejected' },
  };

  const currentStatus = statusConfig[expense.status] || statusConfig.PENDING;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up pb-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="card-premium overflow-hidden">
        {/* Header Block */}
        <div className="p-8 border-b border-slate-100 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${currentStatus.style}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {currentStatus.label}
                </span>
                <span className="text-sm font-medium text-slate-400">ID: #{expense.id.slice(0, 8)}</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{expense.description}</h1>
              <p className="text-slate-500 mt-2 font-medium">
                Submitted by <span className="text-slate-900 font-semibold">{expense.user.name}</span> on {format(new Date(expense.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
            
            <div className="sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-100 w-full sm:w-auto">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
                {formatCurrency(expense.amount, expense.currency)}
              </p>
              {expense.amountInCompanyCurrency && expense.company?.currency && expense.currency !== expense.company.currency && (
                <p className="text-xs font-semibold text-indigo-600 mt-1">
                  ≈ {formatCurrency(expense.amountInCompanyCurrency, expense.company.currency)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* Details Column */}
          <div className="p-8 md:col-span-3 space-y-8 bg-white">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Expense Details</h3>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {format(new Date(expense.expenseDate), 'MMMM dd, yyyy')}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{expense.category.name}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid Method</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{expense.paidBy}</p>
              </div>
            </div>

            {expense.remarks && (
              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks</p>
                </div>
                <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                  {expense.remarks}
                </p>
              </div>
            )}

            {expense.ocrData && (
              <div className="pt-6 border-t border-slate-100 mt-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Scan Results</p>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {expense.ocrData.merchantName && (
                      <div>
                        <span className="text-indigo-900/60 block text-xs font-bold uppercase mb-0.5">Merchant</span>
                        <span className="font-semibold text-indigo-900">{expense.ocrData.merchantName}</span>
                      </div>
                    )}
                    {expense.ocrData.extractedAmount && (
                      <div>
                        <span className="text-indigo-900/60 block text-xs font-bold uppercase mb-0.5">Amount detected</span>
                        <span className="font-semibold text-indigo-900 font-mono tracking-tight">{formatCurrency(expense.ocrData.extractedAmount, expense.currency)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {expense.receiptUrl && (
              <div className="pt-6 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Attached Receipt</p>
                <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="block relative group rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={expense.receiptUrl}
                    alt="Receipt"
                    className="w-full h-auto object-cover opacity-90 transition-opacity group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); setIsLightboxOpen(true); }}
                      className="opacity-0 group-hover:opacity-100 bg-white shadow-lg text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-all transform scale-95 group-hover:scale-100"
                    >
                      View Full Size
                    </button>
                  </div>
                </a>
              </div>
            )}
          </div>

          {/* Workflow Column */}
          <div className="p-8 md:col-span-2 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Approval Timeline</h3>
            
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
              {/* Submission Step */}
              <div className="relative">
                <div className="absolute -left-[9px] top-1 bg-white border-2 border-slate-300 w-4 h-4 rounded-full"></div>
                <div className="pl-6">
                  <p className="text-sm font-semibold text-slate-900">Submitted</p>
                  <p className="text-xs text-slate-500 mt-0.5">{format(new Date(expense.createdAt), 'MMM dd, HH:mm')}</p>
                  <p className="text-xs text-slate-600 mt-1">{expense.user.name}</p>
                </div>
              </div>

              {expense.user?.isManagerApprover && (
                <div className="relative">
                  {(() => {
                    const managerAction = expense.approvalActions?.find(a => a.stepIndex === -1);
                    const manager = expense.user?.manager;
                    
                    if (managerAction) {
                      return (
                        <>
                          <div className={`absolute -left-[9px] top-1 border-2 w-4 h-4 rounded-full bg-white z-10 ${managerAction.status === 'APPROVED' ? 'border-emerald-500' : 'border-rose-500'}`}></div>
                          <div className="pl-6">
                            <p className="text-sm font-semibold text-slate-900">Manager Review</p>
                            <p className="text-xs text-slate-500 mt-0.5">{format(new Date(managerAction.createdAt), 'MMM dd, HH:mm')}</p>
                            <div className="mt-2 text-xs">
                              <span className={`font-bold inline-flex px-1.5 py-0.5 rounded ${managerAction.status === 'APPROVED' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                                {managerAction.status}
                              </span>
                              <span className="text-slate-600 ml-2">by {managerAction.approver.name}</span>
                            </div>
                            {managerAction.comments && (
                              <div className="mt-2 bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700 relative">
                                <div className="absolute -left-1.5 top-3 w-3 h-3 bg-white border-l border-b border-slate-200 transform rotate-45"></div>
                                "{managerAction.comments}"
                              </div>
                            )}
                          </div>
                        </>
                      );
                    } else if (manager) {
                      return (
                        <>
                          <div className="absolute -left-[9px] top-1 border-2 border-amber-500 w-4 h-4 rounded-full bg-amber-100 z-10 animate-pulse"></div>
                          <div className="pl-6">
                            <p className="text-sm font-semibold text-slate-900">Manager Review</p>
                            <span className="mt-1 inline-flex px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded border border-amber-200">Pending</span>
                            <p className="text-xs text-slate-500 mt-1">Waiting on {manager.name}</p>
                          </div>
                        </>
                      );
                    }
                  })()}
                </div>
              )}

              {/* Rules-based steps */}
              {expense.approvalActions?.filter(action => action.stepIndex >= 0).map((action) => (
                <div key={action.id} className="relative">
                  <div className={`absolute -left-[9px] top-1 border-2 w-4 h-4 rounded-full bg-white z-10 ${
                    action.status === 'APPROVED' ? 'border-emerald-500' : 
                    action.status === 'REJECTED' ? 'border-rose-500' : 'border-amber-500'
                  }`}></div>
                  <div className="pl-6">
                    <p className="text-sm font-semibold text-slate-900">Final Verification</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {action.status !== 'PENDING' ? format(new Date(action.createdAt), 'MMM dd, HH:mm') : 'Currently in review'}
                    </p>
                    <div className="mt-2 text-xs">
                      <span className={`font-bold inline-flex px-1.5 py-0.5 rounded ${
                        action.status === 'APPROVED' ? 'text-emerald-700 bg-emerald-50' : 
                        action.status === 'REJECTED' ? 'text-rose-700 bg-rose-50' : 
                        'text-amber-700 bg-amber-50'
                      }`}>
                        {action.status}
                      </span>
                      <span className="text-slate-600 ml-2">by {action.approver.name} ({action.approver.role})</span>
                    </div>
                    {action.comments && (
                      <div className="mt-2 bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700 relative">
                        <div className="absolute -left-1.5 top-3 w-3 h-3 bg-white border-l border-b border-slate-200 transform rotate-45"></div>
                        "{action.comments}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Lightbox Modal */}
      {isLightboxOpen && expense.receiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm cursor-pointer" 
            onClick={() => setIsLightboxOpen(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] w-full flex flex-col animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-semibold text-slate-900">Receipt Viewer</h3>
              <button 
                onClick={() => setIsLightboxOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                title="Close Viewer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex justify-center bg-slate-100/50">
              <img 
                src={expense.receiptUrl} 
                alt="Full Receipt" 
                className="max-w-full h-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseDetails;
