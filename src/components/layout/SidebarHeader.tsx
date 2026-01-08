export function SidebarHeader() {
  return (
    <div className="p-6 border-b border-gray-700">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-lg">R</span>
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">Resend Mail</h2>
          <p className="text-gray-400 text-xs">v0.1.0</p>
        </div>
      </div>
    </div>
  );
}
