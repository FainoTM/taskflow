import {CSS} from '@dnd-kit/utilities';
import {useDraggable} from '@dnd-kit/core';
import {Link} from 'react-router-dom';

import type {Task} from '../../types/task';

interface Props {
    task: Task;
    isOverlay?: boolean;
}

const priorityLabels = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    URGENT: 'Urgente',
};

const priorityClasses = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-blue-50 text-blue-700',
    HIGH: 'bg-orange-50 text-orange-700',
    URGENT: 'bg-red-50 text-red-700',
};

export function TaskCard({task, isOverlay = false}: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: `task-${task.id}`,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={isDragging ? 'opacity-40' : ''}
            {...attributes}
            {...listeners}
        >
            <Link
                to={`/tasks/${task.id}`}
                onClick={(event) => {
                    if (isDragging || isOverlay) {
                        event.preventDefault();
                    }
                }}
                className={`block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md ${
                    isOverlay ? 'rotate-2 shadow-xl' : ''
                }`}
            >
                <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-600">
            #{task.id}
          </span>

                    <span
                        className={`rounded-full px-2 py-1 text-[11px] ${
                            priorityClasses[task.priority]
                        }`}
                    >
            {priorityLabels[task.priority]}
          </span>
                </div>

                <h3 className="font-semibold text-slate-900">{task.title}</h3>

                <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                    {task.description}
                </p>

                <div className="mt-3 text-xs text-slate-400">
                    {task.project_code} - {task.project_name}
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-400">
                        Responsável
                    </p>

                    <p className="text-xs font-medium text-slate-700">
                        {task.assignment_type === 'ALL'
                            ? 'Todos os usuários'
                            : task.assigned_to_name || 'Não definido'}
                    </p>
                </div>
            </Link>
        </div>
    );
}