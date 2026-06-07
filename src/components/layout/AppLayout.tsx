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
      <div className="flex-1 md:ml-52 flex flex-col min-h-screen">
        <header className="bg-white border-b border-brand-100 px-6 py-4 sticky top-0 z-30 mt-12 md:mt-0 flex items-center justify-between">
          <h2 className="page-title">{title}</h2>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
