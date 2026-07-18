'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ClipboardList, Trash2 } from 'lucide-react';
import type { InstallationTaskDto } from '@lift-saas/shared-types';
import { useUpdateInstallationTask, useDeleteInstallationTask } from '@/hooks/queries/use-installation-tasks';
import { useChecklistItems, useCreateChecklistItem, useDeleteChecklistItem, useToggleChecklistItem } from '@/hooks/queries/use-checklist-items';
import { useChecklistTemplates, useApplyChecklistTemplate } from '@/hooks/queries/use-checklist-templates';
import { useStatuses } from '@/hooks/queries/use-master-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function TaskRow({ task }: { task: InstallationTaskDto }) {
  const [expanded, setExpanded] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');

  const { data: statuses } = useStatuses('INSTALLATION_TASK');
  const updateTask = useUpdateInstallationTask();
  const deleteTask = useDeleteInstallationTask();

  const { data: checklist } = useChecklistItems({ entityType: 'INSTALLATION_TASK', entityId: task.id });
  const createItem = useCreateChecklistItem('INSTALLATION_TASK', task.id);
  const toggleItem = useToggleChecklistItem();
  const deleteItem = useDeleteChecklistItem();

  // QA checklist runner: apply a named template (e.g. "Safety Audit") instead
  // of typing every item by hand — mirrors the spec's checklist-driven audit step.
  const { data: templates } = useChecklistTemplates({ entityType: 'INSTALLATION_TASK', limit: 20 });
  const applyTemplate = useApplyChecklistTemplate();

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button onClick={() => setExpanded((v) => !v)} className="text-muted-foreground hover:text-foreground" aria-label="Toggle checklist">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <div className="flex-1">
          <p className="text-sm font-medium">{task.title}</p>
          {task.assignedTo && (
            <p className="text-xs text-muted-foreground">
              {task.assignedTo.firstName} {task.assignedTo.lastName}
            </p>
          )}
        </div>

        <Select
          value={String(task.status.id)}
          onValueChange={(v) => updateTask.mutate({ id: task.id, input: { statusId: Number(v) } })}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses?.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteTask.mutate(task.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {expanded && (
        <div className="ml-9 flex flex-col gap-1.5 border-l border-border pb-3 pl-4 pr-3">
          {templates && templates.items.length > 0 && (
            <Select onValueChange={(v) => applyTemplate.mutate({ id: Number(v), entityType: 'INSTALLATION_TASK', entityId: task.id })}>
              <SelectTrigger className="h-7 w-fit gap-1.5 text-xs">
                <ClipboardList className="h-3 w-3" />
                <SelectValue placeholder="Apply checklist template…" />
              </SelectTrigger>
              <SelectContent>
                {templates.items.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name} ({t.items.length} items)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {checklist?.items.map((item) => (
            <div key={item.id} className="group flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.isChecked}
                onChange={(e) => toggleItem.mutate({ id: item.id, isChecked: e.target.checked })}
                className="h-3.5 w-3.5 rounded-sm accent-primary"
              />
              <span className={item.isChecked ? 'flex-1 text-muted-foreground line-through' : 'flex-1'}>{item.label}</span>
              <button
                onClick={() => deleteItem.mutate(item.id)}
                className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}

          <form
            className="mt-1 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newItemLabel.trim()) return;
              createItem.mutate(newItemLabel.trim());
              setNewItemLabel('');
            }}
          >
            <Input
              value={newItemLabel}
              onChange={(e) => setNewItemLabel(e.target.value)}
              placeholder="Add checklist item…"
              className="h-7 text-xs"
            />
          </form>
        </div>
      )}
    </div>
  );
}
