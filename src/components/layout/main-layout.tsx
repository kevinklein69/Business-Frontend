// TODO: Wrapper mit Sidebar + Header implementieren
// - Layout: Sidebar links, Header oben, Content rechts
// - Responsive: Sidebar ausblenden auf Mobile

import { Sidebar } from './sidebar'
import { Header } from './header'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
