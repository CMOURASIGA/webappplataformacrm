import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Building2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('master@crm.com');
  const [password, setPassword] = useState('master123');
  const login = useStore(state => state.login);
  const currentUser = useStore(state => state.currentUser);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser && localStorage.getItem('token')) {
      if (currentUser.role === 'master') {
        navigate('/master/tenants');
      } else {
        navigate('/dashboard');
      }
    }
  }, [currentUser, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-indigo-600">
          <div className="w-16 h-16 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-indigo-500/30">
            C
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          CRM Flow <span className="text-xl font-normal opacity-50">MVP</span>
        </h2>
        <div className="mt-4 text-sm text-slate-600 bg-indigo-50 p-4 rounded-lg border border-indigo-100 mx-4">
          <p className="font-bold text-indigo-800 mb-2">Credenciais de Acesso:</p>
          <ul className="list-disc pl-4 space-y-1 text-left text-xs text-indigo-700">
            <li><strong>Master:</strong> master@crm.com / master123</li>
            <li><strong>Admin Cliente:</strong> Acesse como Master e crie um Tenant.</li>
            <li><strong>Atendente:</strong> (O Admin Cliente criará futuramente)</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-slate-200 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700">
                Email address
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="master@crm.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700">
                Password
              </label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full h-11 text-base">
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
