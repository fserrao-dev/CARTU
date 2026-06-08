import Sidebar from './Sidebar'

interface Props {
  children: React.ReactNode
  title: string
  actions?: React.ReactNode
}

export default function AppLayout({ children, title, actions }: Props) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <header className="border-b px-6 py-4 sticky top-0 z-30 mt-12 md:mt-0 flex items-center justify-between"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="page-title">{title}</h2>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
