import {type FormEvent, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  FileCode,
  Paperclip,
  Send,
  UploadCloud,
  User,
} from 'lucide-react';

import { getTask, uploadTaskAttachment } from '../../services/taskService';
import { createTaskComment } from '../../services/commentService';

const statusLabels = {
  OPEN: 'Aberto',
  ANALYSIS: 'Em análise',
  DEVELOPMENT: 'Em desenvolvimento',
  VALIDATION: 'Aguardando validação',
  FINISHED: 'Finalizado',
  CANCELED: 'Cancelado',
};

const priorityLabels = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const typeLabels = {
  BUG: 'Bug',
  FEATURE: 'Melhoria',
  SUPPORT: 'Suporte',
  DATABASE: 'Banco de dados',
  OTHER: 'Outro',
};

export function TaskDetailsPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [comment, setComment] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => getTask(id!),
    enabled: !!id,
  });

  const commentMutation = useMutation({
    mutationFn: () => createTaskComment(task!.id, comment),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['task', id] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadTaskAttachment(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
    },
  });

  function handleCommentSubmit(event: FormEvent) {
    event.preventDefault();

    if (!comment.trim()) {
      return;
    }

    commentMutation.mutate();
  }

  function handleFile(file?: File) {
    if (!file) {
      return;
    }

    uploadMutation.mutate(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  }

  if (isLoading) {
    return <p>Carregando task...</p>;
  }

  if (!task) {
    return <p>Task não encontrada.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/kanban"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            #{task.id} - {task.title}
          </h1>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {statusLabels[task.status]}
            </span>

            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              Prioridade: {priorityLabels[task.priority]}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              Tipo: {typeLabels[task.task_type]}
            </span>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {task.project_code} - {task.project_name}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-6">
        <section className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Descrição
            </h2>

            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {task.description}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Comentário do programador
            </h2>

            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <textarea
                className="min-h-32 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Descreva sua análise, o que foi encontrado, observações técnicas, dúvidas ou próximos passos..."
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={commentMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Send size={16} />
                  {commentMutation.isPending ? 'Enviando...' : 'Enviar comentário'}
                </button>
              </div>
            </form>

            <div className="mt-6 space-y-3">
              {task.comments.length === 0 && (
                <p className="text-sm text-slate-500">
                  Nenhum comentário adicionado ainda.
                </p>
              )}

              {task.comments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <strong className="text-sm text-slate-800">
                      {item.user_name || 'Usuário'}
                    </strong>

                    <span className="text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-sm text-slate-700">
                    {item.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Arquivo do código/projeto
            </h2>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <UploadCloud className="mb-3 text-slate-500" size={34} />

              <p className="text-sm font-medium text-slate-800">
                Arraste o arquivo aqui ou clique para selecionar
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Exemplo: .zip, .sql, .pas, .cs, .tsx, .py, .txt
              </p>

              {uploadMutation.isPending && (
                <p className="mt-3 text-sm text-blue-600">
                  Enviando arquivo...
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </div>

            <div className="mt-5 space-y-3">
              {task.attachments.length === 0 && (
                <p className="text-sm text-slate-500">
                  Nenhum arquivo enviado ainda.
                </p>
              )}

              {task.attachments.map((file) => (
                <a
                  key={file.id}
                  href={file.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <FileCode size={20} className="text-blue-600" />

                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {file.original_name}
                      </p>

                      <p className="text-xs text-slate-500">
                        Enviado por {file.uploaded_by_name || 'usuário'} em{' '}
                        {new Date(file.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <Paperclip size={16} className="text-slate-400" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Informações
            </h2>

            <InfoItem label="Status" value={statusLabels[task.status]} />
            <InfoItem label="Tipo" value={typeLabels[task.task_type]} />
            <InfoItem label="Prioridade" value={priorityLabels[task.priority]} />
            <InfoItem label="Projeto" value={`${task.project_code} - ${task.project_name}`} />
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Pessoas
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User size={18} className="text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Criado por</p>
                  <p className="text-sm font-medium text-slate-800">
                    {task.created_by_name || 'Usuário'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User size={18} className="text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Responsável</p>
                  <p className="text-sm font-medium text-slate-800">
                    {task.assigned_to_name || 'Não atribuído'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Datas
            </h2>

            <div className="space-y-3">
              <DateItem label="Criada em" value={task.created_at} />
              <DateItem label="Atualizada em" value={task.updated_at} />
              <DateItem label="Iniciada em" value={task.started_at} />
              <DateItem label="Finalizada em" value={task.finished_at} />
            </div>
          </div>

          <Link
            to={`/tasks/${task.id}/finalizar`}
            className="block rounded-lg bg-emerald-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-emerald-700"
          >
            Finalizar task
          </Link>
        </aside>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function DateItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <Calendar size={17} className="mt-0.5 text-slate-500" />

      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">
          {value ? new Date(value).toLocaleString('pt-BR') : '-'}
        </p>
      </div>
    </div>
  );
}