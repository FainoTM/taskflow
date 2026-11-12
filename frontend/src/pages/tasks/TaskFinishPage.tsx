import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  getApiErrorMessage,
  getTask,
  submitTaskForValidation,
} from '../../services/taskService';

export function TaskFinishPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [opsCode, setOpsCode] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [oldCode, setOldCode] = useState<File>();
  const [newCode, setNewCode] = useState<File>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => getTask(id!),
    enabled: Boolean(id),
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!id) return;

    setError('');
    setIsSubmitting(true);

    try {
      await submitTaskForValidation(id, {
        description: description.trim(),
        ops_code: opsCode.trim(),
        project_code: projectCode.trim(),
        old_code: oldCode,
        new_code: newCode,
      });
      navigate(`/tasks/${id}`, { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <p>Carregando task...</p>;
  if (!task) return <p>Task não encontrada.</p>;
  if (task.status !== 'DEVELOPMENT') return <Navigate to={`/tasks/${task.id}`} replace />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Enviar para validação</h1>
        <p className="mt-1 text-sm text-slate-500">
          #{task.id} - {task.title}. Registre a solução e o versionamento; o Suporte fará a decisão final.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="solution-description" className="mb-1 block text-sm font-medium">
            Descrição da solução *
          </label>
          <textarea
            id="solution-description"
            required
            rows={6}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="Explique o que foi alterado e como validar a correção."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ops-code" className="mb-1 block text-sm font-medium">Código OPS</label>
            <input
              id="ops-code"
              value={opsCode}
              onChange={(event) => setOpsCode(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="project-code" className="mb-1 block text-sm font-medium">Código do projeto</label>
            <input
              id="project-code"
              value={projectCode}
              onChange={(event) => setProjectCode(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="old-code" className="mb-1 block text-sm font-medium">Versão anterior</label>
            <input
              id="old-code"
              type="file"
              onChange={(event) => setOldCode(event.target.files?.[0])}
              className="block w-full rounded-lg border border-slate-300 p-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="new-code" className="mb-1 block text-sm font-medium">Nova versão</label>
            <input
              id="new-code"
              type="file"
              onChange={(event) => setNewCode(event.target.files?.[0])}
              className="block w-full rounded-lg border border-slate-300 p-2 text-sm"
            />
          </div>
        </div>

        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Link to={`/tasks/${task.id}`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !description.trim()}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar para validação'}
          </button>
        </div>
      </form>
    </div>
  );
}
