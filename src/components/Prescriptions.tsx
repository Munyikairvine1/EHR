import { useState, useEffect } from 'react';
import { supabase, Prescription, Patient, MedicalRecord } from '../lib/supabase';
import { Plus, X, Pill } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PrescriptionWithDetails extends Prescription {
  patients?: Patient;
}

export default function Prescriptions() {
  const { staff: currentStaff } = useAuth();
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patients (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAddPrescriptions = currentStaff?.role === 'doctor' || currentStaff?.role === 'admin';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Prescriptions</h2>
        {canAddPrescriptions && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Prescription
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="text-center py-8">Loading prescriptions...</div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No prescriptions found</div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Pill className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{prescription.medication_name}</h3>
                        {prescription.patients && (
                          <p className="text-sm text-gray-600">
                            Patient: {prescription.patients.first_name} {prescription.patients.last_name}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(prescription.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Dosage:</span>
                        <p className="text-gray-600">{prescription.dosage}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Frequency:</span>
                        <p className="text-gray-600">{prescription.frequency}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <p className="text-gray-600">{prescription.duration}</p>
                      </div>
                    </div>
                    {prescription.instructions && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-gray-700">Instructions:</span>
                        <p className="text-gray-600">{prescription.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddPrescriptionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadPrescriptions();
            setShowAddModal(false);
          }}
          currentStaffId={currentStaff?.id || ''}
        />
      )}
    </div>
  );
}

function AddPrescriptionModal({
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
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [formData, setFormData] = useState({
    medical_record_id: '',
    patient_id: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });

  useEffect(() => {
    loadMedicalRecords();
  }, []);

  const loadMedicalRecords = async () => {
    const { data } = await supabase
      .from('medical_records')
      .select('*, patients (*)')
      .order('visit_date', { ascending: false })
      .limit(50);
    setMedicalRecords(data || []);
  };

  const handleRecordSelect = (recordId: string) => {
    const record = medicalRecords.find((r) => r.id === recordId);
    if (record) {
      setFormData({
        ...formData,
        medical_record_id: recordId,
        patient_id: record.patient_id,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.from('prescriptions').insert([
        {
          ...formData,
          doctor_id: currentStaffId,
        },
      ]);
      if (error) throw error;
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Add Prescription</h3>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Medical Record</label>
            <select
              required
              value={formData.medical_record_id}
              onChange={(e) => handleRecordSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a medical record</option>
              {medicalRecords.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.patients?.first_name} {record.patients?.last_name} -{' '}
                  {new Date(record.visit_date).toLocaleDateString()} - {record.diagnosis}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Medication Name</label>
            <input
              type="text"
              required
              value={formData.medication_name}
              onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Amoxicillin"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
              <input
                type="text"
                required
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 500mg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
              <input
                type="text"
                required
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 3 times daily"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <input
              type="text"
              required
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 7 days"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instructions (Optional)</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="e.g., Take with food"
            />
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
              {loading ? 'Saving...' : 'Add Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
