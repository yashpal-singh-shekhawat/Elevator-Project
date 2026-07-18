// Unused: the platform shell lives in super-admin/layout.tsx (pathname-aware so
// the login route stays unguarded). This route group is intentionally empty.
export default function Noop({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
