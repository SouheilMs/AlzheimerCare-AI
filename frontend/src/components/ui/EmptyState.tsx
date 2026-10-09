interface EmptyStateProps {
  title: string
  description: string
}

export const EmptyState = ({ title, description }: EmptyStateProps) => (
  <div className="rounded-lg border border-dashed bg-surface-soft p-6 text-center">
    <p className="text-sm font-semibold text-text">{title}</p>
    <p className="mt-1 text-sm text-text-muted">{description}</p>
  </div>
)
