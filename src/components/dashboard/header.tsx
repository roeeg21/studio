import { Plane } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Plane className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold">Getz Menashe - 4X-DBG Cessna 182T</h1>
      </div>
    </header>
  );
}
