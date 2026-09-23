export default function DocsPage() {
  return (
    <div className="flex gap-12 max-w-6xl mx-auto">
      <aside className="w-64 flex-shrink-0 hidden md:block">
        <h3 className="font-semibold text-lg mb-4">Documentation</h3>
        <ul className="space-y-3 text-gray-600">
          <li><a href="#" className="hover:text-blue-600">Getting Started</a></li>
          <li><a href="#" className="hover:text-blue-600">Installation</a></li>
          <li><a href="#" className="hover:text-blue-600">Quick Start</a></li>
          <li className="pt-4 pb-2 font-medium text-gray-900">API</li>
          <li><a href="#" className="hover:text-blue-600">Core</a></li>
          <li><a href="#" className="hover:text-blue-600">React</a></li>
          <li><a href="#" className="hover:text-blue-600">Node</a></li>
          <li className="pt-4 pb-2 font-medium text-gray-900">Configuration</li>
          <li><a href="#" className="hover:text-blue-600">Schema</a></li>
          <li><a href="#" className="hover:text-blue-600">API Reference</a></li>
        </ul>
      </aside>
      <main className="flex-1">
        <h1 className="text-4xl font-bold mb-6">Documentation</h1>
        <p className="text-gray-600 text-lg">
          Welcome to the IngestX documentation. This is a shell prepared for future Markdown/MDX content.
        </p>
        <div className="mt-8 p-8 border border-dashed border-gray-300 rounded-xl bg-gray-50">
          <p className="text-gray-500 text-center">Documentation content will be rendered here.</p>
        </div>
      </main>
    </div>
  );
}
