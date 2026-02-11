import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  LogOut,
  Building2,
  Menu,
  X
} from 'lucide-react';
import Patients from './Patients';
import Appointments from './Appointments';
import MedicalRecords from './MedicalRecords';
import Prescriptions from './Prescriptions';
import LabResults from './LabResults';

type View = 'patients' | 'appointments' | 'records' | 'prescriptions' | 'lab';

export default function Dashboard() {
  const { staff, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('patients');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'patients', label: 'Patients', icon: Users, roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
    { id: 'appointments', label: 'Appointments', icon: Calendar, roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
    { id: 'records', label: 'Medical Records', icon: FileText, roles: ['admin', 'doctor', 'nurse'] },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill, roles: ['admin', 'doctor', 'nurse'] },
    { id: 'lab', label: 'Lab Results', icon: FlaskConical, roles: ['admin', 'doctor', 'nurse', 'lab_technician'] },
  ];

  const availableMenuItems = menuItems.filter(item =>
    staff && item.roles.includes(staff.role)
  );

  const renderView = () => {
    switch (currentView) {
      case 'patients':
        return <Patients />;
      case 'appointments':
        return <Appointments />;
      case 'records':
        return <MedicalRecords />;
      case 'prescriptions':
        return <Prescriptions />;
      case 'lab':
        return <LabResults />;
      default:
        return <Patients />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-blue-900 text-white transition-all duration-300 overflow-hidden`}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Chitungwiza Hospital</h1>
              <p className="text-blue-200 text-sm">EHR System</p>
            </div>
          </div>

          <nav className="space-y-2">
            {availableMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-blue-800">
          <div className="mb-4">
            <p className="text-sm text-blue-200">Logged in as</p>
            <p className="font-medium">{staff?.first_name} {staff?.last_name}</p>
            <p className="text-sm text-blue-200 capitalize">{staff?.role}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome back,</p>
              <p className="font-semibold text-gray-900">{staff?.first_name} {staff?.last_name}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
