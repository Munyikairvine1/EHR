import { useState, useEffect } from 'react';
import { supabase, LabResult, Patient } from '../lib/supabase';
import { Plus, X, FlaskConical } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LabResultWithDetails extends LabResult {
  patients?: Patient;
}

export default function LabResults() {
  const { staff: currentStaff } = useAuth();
  const [labResults, setLabResults] = useState<LabResultWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadLabResults();
  }, []);

  const loadLabResults = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_results')
        .select(`
          *,
          patients (*)
        `)
        .order('ordered_at', { ascending: false });

      if (error) throw error;
      setLabResults(data || []);
    } catch (error) {
      console.error('Error loading lab results:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLabResult = async (id: string, results: string, status: string) => {
    try {
      const { error } = await supabase
        .from('lab_results')
        .update({
          results,
          status,
          performed_by: currentStaff?.id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      loadLabResults();
    } catch (error) {
      console.error('Error updating lab result:', error);
    }
  };

  const canOrderTests = currentStaff?.role === 'doctor' || currentStaff?.role === 'admin';
  const canUpdateTests = currentStaff?.role === 'lab_technician' ||
                         currentStaff?.role === 'doctor' ||
                         currentStaff?.role === 'admin';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Lab Results</h2>
        {canOrderTests && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Order Lab Test
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="text-center py-8">Loading lab results...</div>
        ) : labResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No lab tests found</div>
        ) : (
          <div className="space-y-4">
            {labResults.map((labResult) => (
              <div
                key={labResult.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FlaskConical className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{labResult.test_name}</h3>
                        {labResult.patients && (
                          <p className="text-sm text-gray-600">
                            Patient: {labResult.patients.first_name} {labResult.patients.last_name}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(labResult.status)}`}>
                        {labResult.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                      <div>
                        <span className="font-medium text-gray-700">Test Type:</span>
                        <p className="text-gray-600">{labResult.test_type}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Ordered:</span>
                        <p className="text-gray-600">{new Date(labResult.ordered_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {labResult.results && (
                      <div className="text-sm bg-gray-50 p-3 rounded">
                        <span className="font-medium text-gray-700">Results:</span>
                        <p className="text-gray-900 mt-1">{labResult.results}</p>
                        {labResult.completed_at && (
                          <p className="text-gray-500 text-xs mt-2">
                            Completed: {new Date(labResult.completed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                    {!labResult.results && canUpdateTests && labResult.status === 'pending' && (
                      <AddResultsForm
                        labResultId={labResult.id}
                        onUpdate={updateLabResult}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddLabTestModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadLabResults();
            setShowAddModal(false);
          }}
          currentStaffId={currentStaff?.id || ''}
        />
      )}
    </div>
  );
}

function AddResultsForm({
  labResultId,
  onUpdate,
}: {
  labResultId: string;
  onUpdate: (id: string, results: string, status: string) => void;
}) {
  const [results, setResults] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onUpdate(labResultId, results, 'completed');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
      <input
        type="text"
        value={results}
        onChange={(e) => setResults(e.target.value)}
        placeholder="Enter test results..."
        required
        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Submit Results'}
      </button>
    </form>
  );
}

function AddLabTestModal({
  onClose,
  onSuccess,
  currentStaffId,
}: {
  onClose: () => void;
  onSuccess: () => void;
  currentStaffId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState({
    patient_id: '',
    test_name: '',
    test_type: '',
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    const { data } = await supabase
      .from('patients')
      .select('*')
      .order('first_name');
    setPatients(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.from('lab_results').insert([
        {
          ...formData,
          ordered_by: currentStaffId,
          status: 'pending',
        },
      ]);
      if (error) throw error;
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error ordering lab test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Order Lab Test</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
            <select
              required
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} - {patient.national_id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Name</label>
            <input
              type="text"
              required
              value={formData.test_name}
              onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Complete Blood Count"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Type</label>
            <select
              required
              value={formData.test_type}
              onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select test type</option>
              <option value="Blood">Blood Test</option>
              <option value="Urine">Urine Test</option>
              <option value="X-Ray">X-Ray</option>
              <option value="CT Scan">CT Scan</option>
              <option value="MRI">MRI</option>
              <option value="Ultrasound">Ultrasound</option>
              <option value="Culture">Culture</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Ordering...' : 'Order Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
