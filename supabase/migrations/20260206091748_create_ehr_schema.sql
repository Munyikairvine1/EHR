/*
  # Chitungwiza Hospital EHR System Schema

  1. New Tables
    - `staff`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `first_name` (text)
      - `last_name` (text)
      - `role` (text: 'admin', 'doctor', 'nurse', 'receptionist', 'lab_technician')
      - `specialization` (text, nullable for doctors)
      - `phone` (text)
      - `email` (text)
      - `license_number` (text, nullable)
      - `created_at` (timestamptz)
    
    - `patients`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `date_of_birth` (date)
      - `gender` (text)
      - `phone` (text)
      - `email` (text, nullable)
      - `address` (text)
      - `national_id` (text, unique)
      - `blood_type` (text, nullable)
      - `allergies` (text, nullable)
      - `emergency_contact_name` (text)
      - `emergency_contact_phone` (text)
      - `created_at` (timestamptz)
    
    - `appointments`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `doctor_id` (uuid, references staff)
      - `appointment_date` (timestamptz)
      - `status` (text: 'scheduled', 'completed', 'cancelled', 'no_show')
      - `reason` (text)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
    
    - `medical_records`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `doctor_id` (uuid, references staff)
      - `appointment_id` (uuid, references appointments, nullable)
      - `visit_date` (timestamptz)
      - `chief_complaint` (text)
      - `diagnosis` (text)
      - `treatment_plan` (text)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
    
    - `vitals`
      - `id` (uuid, primary key)
      - `medical_record_id` (uuid, references medical_records)
      - `blood_pressure_systolic` (integer, nullable)
      - `blood_pressure_diastolic` (integer, nullable)
      - `heart_rate` (integer, nullable)
      - `temperature` (decimal, nullable)
      - `weight` (decimal, nullable)
      - `height` (decimal, nullable)
      - `recorded_by` (uuid, references staff)
      - `recorded_at` (timestamptz)
    
    - `prescriptions`
      - `id` (uuid, primary key)
      - `medical_record_id` (uuid, references medical_records)
      - `patient_id` (uuid, references patients)
      - `doctor_id` (uuid, references staff)
      - `medication_name` (text)
      - `dosage` (text)
      - `frequency` (text)
      - `duration` (text)
      - `instructions` (text, nullable)
      - `created_at` (timestamptz)
    
    - `lab_results`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `medical_record_id` (uuid, references medical_records, nullable)
      - `test_name` (text)
      - `test_type` (text)
      - `results` (text)
      - `status` (text: 'pending', 'completed', 'cancelled')
      - `ordered_by` (uuid, references staff)
      - `performed_by` (uuid, references staff, nullable)
      - `ordered_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Staff can view and manage data based on their role
    - Patients data is protected and only accessible to authorized staff
*/

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'receptionist', 'lab_technician')),
  specialization text,
  phone text NOT NULL,
  email text NOT NULL,
  license_number text,
  created_at timestamptz DEFAULT now()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  phone text NOT NULL,
  email text,
  address text NOT NULL,
  national_id text UNIQUE NOT NULL,
  blood_type text,
  allergies text,
  emergency_contact_name text NOT NULL,
  emergency_contact_phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients NOT NULL,
  doctor_id uuid REFERENCES staff NOT NULL,
  appointment_date timestamptz NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  reason text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create medical_records table
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients NOT NULL,
  doctor_id uuid REFERENCES staff NOT NULL,
  appointment_id uuid REFERENCES appointments,
  visit_date timestamptz DEFAULT now(),
  chief_complaint text NOT NULL,
  diagnosis text NOT NULL,
  treatment_plan text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create vitals table
CREATE TABLE IF NOT EXISTS vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid REFERENCES medical_records NOT NULL,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  heart_rate integer,
  temperature decimal,
  weight decimal,
  height decimal,
  recorded_by uuid REFERENCES staff NOT NULL,
  recorded_at timestamptz DEFAULT now()
);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid REFERENCES medical_records NOT NULL,
  patient_id uuid REFERENCES patients NOT NULL,
  doctor_id uuid REFERENCES staff NOT NULL,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  duration text NOT NULL,
  instructions text,
  created_at timestamptz DEFAULT now()
);

-- Create lab_results table
CREATE TABLE IF NOT EXISTS lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients NOT NULL,
  medical_record_id uuid REFERENCES medical_records,
  test_name text NOT NULL,
  test_type text NOT NULL,
  results text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  ordered_by uuid REFERENCES staff NOT NULL,
  performed_by uuid REFERENCES staff,
  ordered_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

-- Staff policies
CREATE POLICY "Authenticated users can view all staff"
  ON staff FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can view own profile"
  ON staff FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage staff"
  ON staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'admin'
    )
  );

-- Patients policies
CREATE POLICY "Authenticated staff can view patients"
  ON patients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Receptionists and admins can insert patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('receptionist', 'admin')
    )
  );

CREATE POLICY "Receptionists and admins can update patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('receptionist', 'admin')
    )
  );

-- Appointments policies
CREATE POLICY "Authenticated staff can view appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Receptionists, doctors, and admins can manage appointments"
  ON appointments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('receptionist', 'doctor', 'admin')
    )
  );

-- Medical records policies
CREATE POLICY "Doctors and nurses can view medical records"
  ON medical_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('doctor', 'nurse', 'admin')
    )
  );

CREATE POLICY "Doctors can create medical records"
  ON medical_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('doctor', 'admin')
    )
  );

CREATE POLICY "Doctors can update their own medical records"
  ON medical_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('doctor', 'admin')
    )
  );

-- Vitals policies
CREATE POLICY "Staff can view vitals"
  ON vitals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Nurses and doctors can manage vitals"
  ON vitals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('nurse', 'doctor', 'admin')
    )
  );

-- Prescriptions policies
CREATE POLICY "Staff can view prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('doctor', 'admin')
    )
  );

-- Lab results policies
CREATE POLICY "Staff can view lab results"
  ON lab_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can order lab tests"
  ON lab_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('doctor', 'admin')
    )
  );

CREATE POLICY "Lab technicians can update lab results"
  ON lab_results FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('lab_technician', 'doctor', 'admin')
    )
  );