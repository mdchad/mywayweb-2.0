import { Outlet, createFileRoute } from '@tanstack/react-router'
import Navbar from '@/components/header'
import { Footer } from '@/components/footer'

// Port of app/(app)/(main)/layout.tsx. The SearchBar (cmdk dialog) arrives
// with the search port; Navbar without children matches the old Suspense
// fallback state. QueryProvider/Toaster/TopLoader come back when the pages
// that need them are ported.
export const Route = createFileRoute('/_main')({
  component: MainLayout,
})

function MainLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  )
}
