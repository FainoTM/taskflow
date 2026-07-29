import {type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { TaskPriority, TaskType } from '../../types/task';
import { createTask } from '../../services/taskService';
import { getProjects } from '../../services/projectService';

export function TaskCreatePage() {
  const navigate = useNavigate();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('SUPPORT');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [project, setProject] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!project) {
      alert('Selecione um projeto.');
      return;
    }

    const created = await createTask({
      title,
      description,
      tasktype: taskType,
      priority,
      project: Number(project),
    });

    navigate(`/tasks/${created.id}`);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Nova Task</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl space-y-5 rounded-xl bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Título</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Erro no relatório de matrícula"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Projeto</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-4 py-2"
            value={project}
            onChange={(e) => setProject(e.target.value)}
          >
            <option value="">Selecione</option>
            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} - {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-4 py-2"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as TaskType)}
            >
              <option value="BUG">Bug</option>
              <option value="FEATURE">Melhoria</option>
              <option value="SUPPORT">Suporte</option>
              <option value="DATABASE">Banco de dados</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Prioridade</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-4 py-2"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descrição</label>
          <textarea
            className="min-h-40 w-full rounded-lg border border-slate-300 px-4 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o problema ou solicitação"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/kanban')}
            className="rounded-lg border border-slate-300 px-4 py-2"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Criar Task
          </button>
        </div>
      </form>
    </div>
  );
}