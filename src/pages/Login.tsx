import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const CONSULT_SERVICES_LOGO_URL = 'https://i.imgur.com/gxXnYsA.png';

export default function Login() {
  const [email, setEmail] = useState('admin@cliente.com');
  const [password, setPassword] = useState('admin123');
  const [submitting, setSubmitting] = useState(false);
  const login = useStore(state => state.login);
  const loginError = useStore(state => state.loginError);
  const currentUser = useStore(state => state.currentUser);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser && localStorage.getItem('token')) {
      if (currentUser.role === 'master') navigate('/master/tenants');
      else navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      // O store publica a mensagem de erro para a interface.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src={CONSULT_SERVICES_LOGO_URL} alt="Consult Services" className="h-20 w-48 object-contain" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">CRM Flow</h2>
        <div className="mt-4 text-sm text-slate-600 bg-primary-50 p-4 rounded-lg border border-primary-100 mx-4">
          <p className="font-bold text-primary-800 mb-2">Credenciais de validação:</p>
          <ul className="list-disc pl-4 space-y-1 text-left text-xs text-primary-700">
            <li><strong>Master:</strong> master@crm.com / master123</li>
            <li><strong>Admin Cliente:</strong> admin@cliente.com / admin123</li>
            <li><strong>Atendente:</strong> atendente@cliente.com / atendente123</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-slate-200 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {loginError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                {loginError}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700">E-mail</label>
              <div className="mt-1">
                <Input id="email" name="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@cliente.com" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700">Senha</label>
              <div className="mt-1">
                <Input id="password" name="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" />
              </div>
            </div>
            <div>
              <Button type="submit" className="w-full h-11 text-base" disabled={submitting}>
                {submitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
