import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Building2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@client.com');
  const login = useStore(state => state.login);
  const currentUser = useStore(state => state.currentUser);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'master') {
        navigate('/master/tenants');
      } else {
        navigate('/dashboard');
      }
    }
  }, [currentUser, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
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
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Sign in to your account
        </p>
        <p className="mt-1 text-center text-xs text-slate-400">
          Try: master@crm.com, admin@client.com, john@client.com
        </p>
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
                  placeholder="admin@client.com"
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
