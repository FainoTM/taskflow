
import { useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Project, ProjectPayload } from '../../types/project';

interface Props {
  project: Project | null;
  onClose: () => void;
  onSave: (data: ProjectPayload) => Promise<void>;
  saving: boolean;
}

export function ProjectModal({
  project,
  onClose,
  onSave,
  saving,
}: Props) {
  const [name, setName] = useState(project?.name ?? '');
  const [code, setCode] = useState(project?.code ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!name.trim() || !code.trim()) {
      setError('Preencha o nome e o código.');
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        is_active: project?.is_active ?? true,
      });
    } catch {
      setError('Não foi possível salvar. Verifique os dados e se o código já existe.');
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="project-modal-title" className="text-xl font-semibold text-slate-900">
            {project ? 'Editar projeto' : 'Novo projeto'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="project-name" className="mb-1 block text-sm font-medium">
              Nome do projeto *
            </label>
            <input
              id="project-name"
              required
              maxLength={120}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Sistema Acadêmico"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="project-code" className="mb-1 block text-sm font-medium">
              Código *
            </label>
            <input
              id="project-code"
              required
              maxLength={30}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: ACAD"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="project-description" className="mb-1 block text-sm font-medium">
              Descrição
            </label>
            <textarea
              id="project-description"
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva a finalidade do projeto..."
              className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : project ? 'Salvar alterações' : 'Criar projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
