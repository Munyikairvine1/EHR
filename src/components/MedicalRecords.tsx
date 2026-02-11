import { useState, useEffect } from 'react';
import { supabase, MedicalRecord, Patient, Staff, Vital } from '../lib/supabase';
import { Plus, X, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MedicalRecordWithDetails extends MedicalRecord {
  patients: Patient;
  staff: Staff;
  vitals?: Vital[];
}

export default function MedicalRecords() {
  const { staff: currentStaff } = useAuth();
  const [records, setRecords] = useState<MedicalRecordWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          patients (*),
          staff (*)
        `)
        .order('visit_date', { ascending: false });

      if (error) throw error;

      const recordsWithVitals = await Promise.all(
        (data || []).map(async (record) => {
          const { data: vitals } = await supabase
            .from('vitals')
            .select('*')
            .eq('medical_record_id', record.id);
          return { ...record, vitals: vitals || [] };
        })
      );

      setRecords(recordsWithVitals);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAddRecords = currentStaff?.role === 'doctor' || currentStaff?.role === 'admin';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Medical Records</h2>
        {canAddRecords && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Medical Record
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="text-center py-8">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No medical records found</div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {record.patients.first_name} {record.patients.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(record.visit_date).toLocaleString()} • Dr. {record.staff.first_name} {record.staff.last_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRecord(selectedRecord === record.id ? null : record.id)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {selectedRecord === record.id ? 'Hide Details' : 'View Details'}
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Chief Complaint:</span>{' '}
                    <span className="text-gray-600">{record.chief_complaint}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Diagnosis:</span>{' '}
                    <span className="text-gray-600">{record.diagnosis}</span>
                  </div>

                  {selectedRecord === record.id && (
                    <>
                      <div>
                        <span className="font-medium text-gray-700">Treatment Plan:</span>{' '}
                        <span className="text-gray-600">{record.treatment_plan}</span>
                      </div>
                      {record.notes && (
                        <div>
                          <span className="font-medium text-gray-700">Notes:</span>{' '}
                          <span className="text-gray-600">{record.notes}</span>
                        </div>
                      )}

                      {record.vitals && record.vitals.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-4 h-4 text-blue-600" />
                            <h4 className="font-medium text-gray-900">Vital Signs</h4>
                          </div>
                          {record.vitals.map((vital) => (
                            <div key={vital.id} className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-3 rounded">
                              {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                                <div>
                                  <p className="text-xs text-gray-500">Blood Pressure</p>
                                  <p className="font-medium">{vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic} mmHg</p>
                                </div>
                              )}
                              {vital.heart_rate && (
                                <div>
                                  <p className="text-xs text-gray-500">Heart Rate</p>
                                  <p className="font-medium">{vital.heart_rate} bpm</p>
                                </div>
                              )}
                              {vital.temperature && (
                                <div>
                                  <p className="text-xs text-gray-500">Temperature</p>
                                  <p className="font-medium">{vital.temperature}°C</p>
                                </div>
                              )}
                              {vital.weight && (
                                <div>
                                  <p className="text-xs text-gray-500">Weight</p>
                                  <p className="font-medium">{vital.weight} kg</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddMedicalRecordModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadRecords();
            setShowAddModal(false);
          }}
          currentStaffId={currentStaff?.id || ''}
        />
      )}
    </div>
  );
}

function AddMedicalRecordModal({
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
    chief_complaint: '',
    diagnosis: '',
    treatment_plan: '',
    notes: '',
  });
  const [vitals, setVitals] = useState({
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    temperature: '',
    weight: '',
    height: '',
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
      const { data: recordData, error: recordError } = await supabase
        .from('medical_records')
        .insert([
          {
            ...formData,
            doctor_id: currentStaffId,
          },
        ])
        .select()
        .single();

      if (recordError) throw recordError;

      const hasVitals = Object.values(vitals).some((v) => v !== '');
      if (hasVitals && recordData) {
        const vitalsData = {
          medical_record_id: recordData.id,
          blood_pressure_systolic: vitals.blood_pressure_systolic ? parseInt(vitals.blood_pressure_systolic) : null,
          blood_pressure_diastolic: vitals.blood_pressure_diastolic ? parseInt(vitals.blood_pressure_diastolic) : null,
          heart_rate: vitals.heart_rate ? parseInt(vitals.heart_rate) : null,
          temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
          weight: vitals.weight ? parseFloat(vitals.weight) : null,
          height: vitals.height ? parseFloat(vitals.height) : null,
          recorded_by: currentStaffId,
        };

        const { error: vitalsError } = await supabase.from('vitals').insert([vitalsData]);
        if (vitalsError) throw vitalsError;
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating medical record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Add Medical Record</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Chief Complaint</label>
            <textarea
              required
              value={formData.chief_complaint}
              onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
            <textarea
              required
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Plan</label>
            <textarea
              required
              value={formData.treatment_plan}
              onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Vital Signs (Optional)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">BP Systolic (mmHg)</label>
                <input
                  type="number"
                  value={vitals.blood_pressure_systolic}
                  onChange={(e) => setVitals({ ...vitals, blood_pressure_systolic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">BP Diastolic (mmHg)</label>
                <input
                  type="number"
                  value={vitals.blood_pressure_diastolic}
                  onChange={(e) => setVitals({ ...vitals, blood_pressure_diastolic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={vitals.heart_rate}
                  onChange={(e) => setVitals({ ...vitals, heart_rate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.weight}
                  onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.height}
                  onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
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
              {loading ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
