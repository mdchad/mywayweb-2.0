import { Outlet, createFileRoute } from '@tanstack/react-router'
import Navbar from '@/components/header'
import SearchBar from '@/components/SearchBar'
import { Footer } from '@/components/footer'

// Port of app/(app)/(main)/layout.tsx. QueryProvider/Toaster/TopLoader come
// back when the pages that need them are ported.
export const Route = createFileRoute('/_main')({
  component: MainLayout,
})

function MainLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar>
        <SearchBar />
      </Navbar>
      <Outlet />
      <Footer />
    </div>
  )
}
