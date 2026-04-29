import { supabase } from '@/lib/supabase/client';

type ToolType = 'sku' | 'asin';
type RunStatus = 'completed' | 'failed' | 'warning';

interface LogToolRunInput {
  toolType: ToolType;
  status: RunStatus;
  title: string;
  description?: string;
  totalCount?: number;
  successCount?: number;
  issueCount?: number;
  filename?: string;
  metadata?: Record<string, unknown>;
}

export async function logToolRun(input: LogToolRunInput) {
  const { error } = await supabase.from('tool_runs').insert({
    tool_type: input.toolType,
    status: input.status,
    title: input.title,
    description: input.description ?? null,
    total_count: input.totalCount ?? 0,
    success_count: input.successCount ?? 0,
    issue_count: input.issueCount ?? 0,
    filename: input.filename ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error('Failed to log tool run:', error);
  }
}