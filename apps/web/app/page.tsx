export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <h1 className="text-5xl font-bold">IngestX</h1>
      <p className="text-xl text-gray-600 max-w-2xl">
        Headless CSV & Excel ingestion for TypeScript.
      </p>
      <div className="flex gap-4 mt-8">
        <a href="/demo" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Interactive Demo</a>
        <a href="/docs" className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">Read the Docs</a>
      </div>
    </div>
  );
}
