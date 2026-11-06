import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='w-300px h-100px text-white'>Settings</div>
}
