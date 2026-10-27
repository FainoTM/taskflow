import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Pencil,
  FolderKanban,
  Power,
  PowerOff,
} from 'lucide-react';

import {
  getProjects,
  createProject,
  updateProject,
  toggleProjectStatus,
} from '../../services/projectService';

import type { Project, ProjectPayload } from '../../types/project';
import { ProjectModal } from '../../components/projects/ProjectModal';

export function ProjectsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [actionError, setActionError] = useState('');

  const {
    data: projects = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<ProjectPayload>;
    }) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: toggleProjectStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const filteredProjects = projects.filter(project =>
    `${project.name} ${project.code} ${project.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const activeCount = projects.filter(p => p.is_active).length;
  const inactiveCount = projects.length - activeCount;

  function openCreate() {
    setEditingProject(null);
    setModalOpen(true);
  }

  function openEdit(project: Project) {
    setEditingProject(project);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProject(null);
  }

  async function handleSave(data: ProjectPayload) {
    if (editingProject) {
      await updateMutation.mutateAsync({
        id: editingProject.id,
        data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }

    closeModal();
  }

  async function handleToggleStatus(project: Project) {
    const action = project.is_active ? 'desativar' : 'ativar';

    if (!window.confirm(`Deseja ${action} o projeto "${project.name}"?`)) {
      return;
    }

    setActionError('');

    try {
      await statusMutation.mutateAsync(project);
    } catch {
      setActionError(`Não foi possível ${action} o projeto.`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Projetos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie os projetos vinculados às tasks.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Novo projeto
        </button>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard title="Total de projetos" value={projects.length} />
        <SummaryCard title="Projetos ativos" value={activeCount} />
        <SummaryCard title="Projetos inativos" value={inactiveCount} />
      </div>

      {/* Listagem */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">
            Projetos cadastrados
          </h2>

          <div className="relative w-full sm:w-72">
            <Search
              size={17}
              className="absolute left-3 top-3 text-slate-400"
            />

            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar projeto..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {actionError && (
          <p role="alert" className="m-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {actionError}
          </p>
        )}

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">
            Carregando projetos...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-600">
            Não foi possível carregar os projetos.
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <FolderKanban size={36} className="text-slate-300" />
            <p className="text-slate-600">
              Nenhum projeto encontrado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Projeto</th>
                  <th className="px-6 py-4">Tasks</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map(project => (
                  <tr key={project.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                        {project.code}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {project.name}
                      </p>
                      <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                        {project.description || 'Sem descrição'}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {project.tasks_count ?? 0}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        project.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {project.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(project)}
                          title="Editar projeto"
                          aria-label={`Editar ${project.name}`}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(project)}
                          disabled={statusMutation.isPending}
                          title={project.is_active ? 'Desativar' : 'Ativar'}
                          aria-label={`${project.is_active ? 'Desativar' : 'Ativar'} ${project.name}`}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          {project.is_active
                            ? <PowerOff size={17} />
                            : <Power size={17} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ProjectModal
          project={editingProject}
          onClose={closeModal}
          onSave={handleSave}
          saving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
