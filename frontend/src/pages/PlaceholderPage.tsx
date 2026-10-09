import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui'

export const PlaceholderPage = ({ title }: { title: string }) => (
  <AppShell>
    <Card title={title}>
      <p className="text-sm text-text-muted">Cette section sera bientôt disponible.</p>
    </Card>
  </AppShell>
)
