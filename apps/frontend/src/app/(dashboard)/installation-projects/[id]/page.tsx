'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useInstallationProject } from '@/hooks/queries/use-installation-projects';
import { useInstallationTasks } from '@/hooks/queries/use-installation-tasks';
import { useInstallationMilestones, useSignOffInstallationMilestone } from '@/hooks/queries/use-installation-milestones';
import { useManufacturingOrders } from '@/hooks/queries/use-manufacturing-orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { WorkflowTimeline } from '@/components/shared/workflow-timeline';
import { CompleteProjectDialog } from './complete-project-dialog';
import { AddTaskDialog } from './add-task-dialog';
import { AddMilestoneDialog } from './add-milestone-dialog';
import { TaskRow } from './task-row';
import { TransitionControl } from './transition-control';
import { AssignEngineerDialog } from './assign-engineer-dialog';
import { SignOffDialog } from './sign-off-dialog';
import { SiteSurveySection } from './site-survey-section';
import { GadDesignSection } from './gad-design-section';
import { ManufacturingSection } from './manufacturing-section';
import { DispatchSection } from './dispatch-section';

export default function InstallationProjectDetailPage({ params }: { params: { id: string } }) {
  const projectId = Number(params.id);

  const { data: project, isLoading } = useInstallationProject(projectId);
  const { data: tasks } = useInstallationTasks({ installationProjectId: projectId, limit: 100 });
  const { data: milestones } = useInstallationMilestones({ installationProjectId: projectId, limit: 100 });
  const { data: manufacturingOrders } = useManufacturingOrders({ installationProjectId: projectId, limit: 10 });
  const signOffMilestone = useSignOffInstallationMilestone();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-sm text-muted-foreground">Project not found.</p>;
  }

  const readyOrder = manufacturingOrders?.items.find((o) => o.status.code === 'READY_FOR_DISPATCH' || o.status.code === 'QC_PASSED');
  const isFinalStage = project.status.code === 'TESTING_AND_COMMISSIONING_SUCCESSFUL';
  const isHandedOver = project.status.code === 'PROJECT_COMPLETED_AND_HANDED_OVER';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/installation-projects" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold tracking-tight">{project.projectCode}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {project.customer.name} · {project.site.name} · {project.liftType.name}
            </p>
          </div>
          <div className="flex gap-2">
            <AssignEngineerDialog installationProjectId={project.id} />
            {!isHandedOver && <TransitionControl installationProjectId={project.id} currentStatusCode={project.status.code} />}
            {isFinalStage && !isHandedOver && <SignOffDialog installationProjectId={project.id} />}
            {!project.lift && <CompleteProjectDialog projectId={project.id} />}
          </div>
        </div>
      </div>

      {project.lift && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="flex items-center gap-2 py-4 text-sm">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Installation complete — Lift <span className="font-mono">{project.lift.serialNumber}</span> created
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        <InfoCard label="Planned start" value={project.plannedStartDate ? new Date(project.plannedStartDate).toLocaleDateString() : '—'} />
        <InfoCard label="Planned end" value={project.plannedEndDate ? new Date(project.plannedEndDate).toLocaleDateString() : '—'} />
        <InfoCard label="Actual end" value={project.actualEndDate ? new Date(project.actualEndDate).toLocaleDateString() : '—'} />
      </div>

      {/* Phase 1: Site Survey */}
      <SiteSurveySection installationProjectId={project.id} />

      {/* Phase 2: Design */}
      <GadDesignSection installationProjectId={project.id} />

      {/* Phase 3: Manufacturing & Dispatch */}
      <div className="grid grid-cols-2 gap-4">
        <ManufacturingSection installationProjectId={project.id} />
        <DispatchSection installationProjectId={project.id} manufacturingOrderId={readyOrder?.id} />
      </div>

      {/* Phase 4: Execution (existing Task/Milestone modules) */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Tasks</CardTitle>
          <AddTaskDialog installationProjectId={project.id} />
        </CardHeader>
        <CardContent className="p-0">
          {tasks?.items.length === 0 && <p className="px-3 pb-4 text-sm text-muted-foreground">No tasks yet.</p>}
          {tasks?.items.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </CardContent>
      </Card>

      {/* Phase 5: QA / Handover */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Milestones &amp; Punch-list</CardTitle>
          <AddMilestoneDialog installationProjectId={project.id} />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {milestones?.items.length === 0 && <p className="text-sm text-muted-foreground">No milestones yet.</p>}
          {milestones?.items.map((milestone) => (
            <div key={milestone.id} className="flex items-center justify-between rounded-[var(--radius)] border border-border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">{milestone.name}</p>
                {milestone.signOffAt && (
                  <p className="text-xs text-muted-foreground">Signed off {new Date(milestone.signOffAt).toLocaleString()}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={milestone.status} />
                {!milestone.signOffAt && (
                  <Button size="sm" variant="outline" onClick={() => signOffMilestone.mutate({ id: milestone.id })}>
                    Sign off
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowTimeline entityType="INSTALLATION_PROJECT" entityId={project.id} />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}
