import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';

export function Header() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      <h2 className="text-lg font-semibold text-slate-800">
        Sistema de Tasks
      </h2>

      <button
        onClick={handleLogout}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
      >
        Sair
      </button>
    </header>
  );
}