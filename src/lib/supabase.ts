import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Staff {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'lab_technician';
  specialization?: string;
  phone: string;
  email: string;
  license_number?: string;
  created_at: string;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address: string;
  national_id: string;
  blood_type?: string;
  allergies?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  reason: string;
  notes?: string;
  created_at: string;
  patients?: Patient;
  staff?: Staff;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  visit_date: string;
  chief_complaint: string;
  diagnosis: string;
  treatment_plan: string;
  notes?: string;
  created_at: string;
  patients?: Patient;
  staff?: Staff;
}

export interface Vital {
  id: string;
  medical_record_id: string;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  recorded_by: string;
  recorded_at: string;
}

export interface Prescription {
  id: string;
  medical_record_id: string;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  created_at: string;
}

export interface LabResult {
  id: string;
  patient_id: string;
  medical_record_id?: string;
  test_name: string;
  test_type: string;
  results?: string;
  status: 'pending' | 'completed' | 'cancelled';
  ordered_by: string;
  performed_by?: string;
  ordered_at: string;
  completed_at?: string;
}
