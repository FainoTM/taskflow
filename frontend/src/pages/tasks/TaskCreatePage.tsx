import {type FormEvent, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {FileText, X} from 'lucide-react';

import type {AssignmentType, TaskPriority, TaskType} from '../../types/task';
import {
  createTask,
  getApiErrorMessage,
  uploadTaskAttachments,
} from '../../services/taskService';
import {getProjects} from '../../services/projectService';
import {getUsers} from '../../services/userService';
import {AttachmentDropzone} from '../../components/tasks/AttachmentDropzone';
import {
  attachmentKey,
  formatFileSize,
} from '../../components/tasks/attachmentValidation';


export function TaskCreatePage() {
  const navigate = useNavigate();

  const {data: projects = []} = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const {data: users = []} = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('SUPPORT');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [project, setProject] = useState('');
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('ALL');
  const [assignedTo, setAssignedTo] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [createdTaskId, setCreatedTaskId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'warning';
    message: string;
  } | null>(null);

  const taskWasCreated = createdTaskId !== null;

  function addAttachments(files: File[]) {
    setAttachments((current) => {
      const existingKeys = new Set(current.map(attachmentKey));
      return [
        ...current,
        ...files.filter((file) => !existingKeys.has(attachmentKey(file))),
      ];
    });
  }

  function removeAttachment(fileToRemove: File) {
    const keyToRemove = attachmentKey(fileToRemove);
    setAttachments((current) =>
      current.filter((file) => attachmentKey(file) !== keyToRemove),
    );
  }

  async function sendAttachments(taskId: number) {
    if (attachments.length === 0) {
      navigate(`/tasks/${taskId}`);
      return;
    }

    const total = attachments.length;
    const result = await uploadTaskAttachments(taskId, attachments);

    if (result.failed.length === 0) {
      navigate(`/tasks/${taskId}`);
      return;
    }

    setAttachments(result.failed.map((failure) => failure.file));
    const failedDetails = result.failed
      .map((failure) => `${failure.file.name}: ${failure.message}`)
      .join(' | ');

    setFeedback({
      type: 'warning',
      message:
        `A task #${taskId} foi criada e ${result.uploaded.length} de ${total} `
        + `anexo(s) foram enviados. Falharam: ${failedDetails}`,
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);

    if (createdTaskId !== null) {
      setIsSubmitting(true);
      try {
        await sendAttachments(createdTaskId);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!project) {
      setFeedback({type: 'error', message: 'Selecione um projeto.'});
      return;
    }

    if (assignmentType === 'USER' && !assignedTo) {
      setFeedback({type: 'error', message: 'Selecione um usuário.'});
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createTask({
        title,
        description,
        task_type: taskType,
        priority,
        project: Number(project),
        assignment_type: assignmentType,
        assigned_to: assignmentType === 'USER' ? Number(assignedTo) : null,
      });

      setCreatedTaskId(created.id);
      await sendAttachments(created.id);
    } catch (error) {
      setFeedback({type: 'error', message: getApiErrorMessage(error)});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Nova Task</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl space-y-5 rounded-xl bg-white p-6 shadow-sm"
      >
        {feedback && (
          <div
            role="alert"
            className={`rounded-lg border p-4 text-sm ${
              feedback.type === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <p>{feedback.message}</p>
            {taskWasCreated && (
              <button
                type="button"
                onClick={() => navigate(`/tasks/${createdTaskId}`)}
                className="mt-2 font-semibold underline"
              >
                Abrir a task sem reenviar os anexos
              </button>
            )}
          </div>
        )}

        <fieldset disabled={taskWasCreated || isSubmitting} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="task-title">Título</label>
            <input
              id="task-title"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 disabled:bg-slate-100"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex: Erro no relatório de matrícula"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="task-project">Projeto</label>
            <select
              id="task-project"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 disabled:bg-slate-100"
              value={project}
              onChange={(event) => setProject(event.target.value)}
            >
              <option value="">Selecione</option>
              {projects.filter((item) => item.is_active).map((item) => (
                <option key={item.id} value={item.id}>{item.code} - {item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="task-assignee">Destinar task para</label>
            <select
              id="task-assignee"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 disabled:bg-slate-100"
              value={assignmentType === 'ALL' ? 'ALL' : assignedTo}
              onChange={(event) => {
                const value = event.target.value;
                if (value === 'ALL') {
                  setAssignmentType('ALL');
                  setAssignedTo('');
                } else {
                  setAssignmentType('USER');
                  setAssignedTo(value);
                }
              }}
            >
              <option value="ALL">Todos os usuários</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullname}{user.email ? ` - ${user.email}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="task-type">Tipo</label>
              <select
                id="task-type"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 disabled:bg-slate-100"
                value={taskType}
                onChange={(event) => setTaskType(event.target.value as TaskType)}
              >
                <option value="BUG">Bug</option>
                <option value="FEATURE">Melhoria</option>
                <option value="SUPPORT">Suporte</option>
                <option value="DATABASE">Banco de dados</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="task-priority">Prioridade</label>
              <select
                id="task-priority"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 disabled:bg-slate-100"
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="task-description">Descrição</label>
            <textarea
              id="task-description"
              required
              className="min-h-40 w-full rounded-lg border border-slate-300 px-4 py-2 disabled:bg-slate-100"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva o problema ou solicitação"
            />
          </div>
        </fieldset>

        <div>
          <h2 className="mb-2 text-sm font-medium text-slate-800">Anexos</h2>
          <AttachmentDropzone
            disabled={isSubmitting}
            isUploading={isSubmitting && attachments.length > 0}
            onFilesSelected={addAttachments}
          />

          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((file) => (
                <div
                  key={attachmentKey(file)}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="shrink-0 text-blue-600" size={18}/>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    aria-label={`Remover ${file.name}`}
                    onClick={() => removeAttachment(file)}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <X size={18}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(taskWasCreated ? `/tasks/${createdTaskId}` : '/kanban')}
            className="rounded-lg border border-slate-300 px-4 py-2"
          >
            {taskWasCreated ? 'Abrir task' : 'Cancelar'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting
              ? taskWasCreated ? 'Reenviando...' : 'Criando...'
              : taskWasCreated ? 'Tentar anexos novamente' : 'Criar Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
