import Sidebar from './Sidebar'

export default function AppLayout({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-52 flex flex-col min-h-screen">
        <header className="bg-white border-b border-brand-100 px-6 py-4 sticky top-0 z-30 md:top-0 mt-12 md:mt-0">
          <h2 className="font-serif text-2xl font-medium">{title}</h2>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
