'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import type { AmcVisitDto } from '@lift-saas/shared-types';
import { useUpdateAmcVisit } from '@/hooks/queries/use-amc-visits';
import { useChecklistItems, useCreateChecklistItem, useDeleteChecklistItem, useToggleChecklistItem } from '@/hooks/queries/use-checklist-items';
import { useStatuses } from '@/hooks/queries/use-master-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';
import { LogVisitDialog } from './log-visit-dialog';

export function VisitRow({ visit }: { visit: AmcVisitDto }) {
  const [expanded, setExpanded] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');

  const { data: statuses } = useStatuses('AMC_VISIT');
  const updateVisit = useUpdateAmcVisit();

  // Checklist here reuses the exact same module built for Installation Tasks in
  // Module 10 — only the entityType differs. See checklist.validation.ts on the
  // backend for why this was designed to be reusable from the start.
  const { data: checklist } = useChecklistItems({ entityType: 'AMC_VISIT', entityId: visit.id });
  const createItem = useCreateChecklistItem('AMC_VISIT', visit.id);
  const toggleItem = useToggleChecklistItem();
  const deleteItem = useDeleteChecklistItem();

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button onClick={() => setExpanded((v) => !v)} className="text-muted-foreground hover:text-foreground" aria-label="Toggle checklist">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <div className="flex-1">
          <p className="text-sm font-medium">
            {new Date(visit.visitDate).toLocaleDateString()} · {visit.serviceType.name}
          </p>
          {visit.technician && (
            <p className="text-xs text-muted-foreground">
              {visit.technician.firstName} {visit.technician.lastName}
            </p>
          )}
        </div>

        <StatusBadge status={visit.status} />

        <Select
          value={String(visit.status.id)}
          onValueChange={(v) => updateVisit.mutate({ id: visit.id, input: { statusId: Number(v) } })}
        >
          <SelectTrigger className="h-8 w-36 text-xs">
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

        <LogVisitDialog visit={visit} />
      </div>

      {(visit.findings || visit.actionsTaken) && (
        <div className="ml-9 mb-2 flex flex-col gap-1 pr-3 text-xs text-muted-foreground">
          {visit.findings && (
            <p>
              <span className="font-medium text-foreground">Findings:</span> {visit.findings}
            </p>
          )}
          {visit.actionsTaken && (
            <p>
              <span className="font-medium text-foreground">Actions:</span> {visit.actionsTaken}
            </p>
          )}
        </div>
      )}

      {expanded && (
        <div className="ml-9 flex flex-col gap-1.5 border-l border-border pb-3 pl-4 pr-3">
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
