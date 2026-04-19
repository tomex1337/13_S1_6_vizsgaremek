// Swagger UI oldal - API dokumentáció megjelenítése
// Standalone HTML-t használunk a swagger-ui-react helyett, hogy elkerüljük a React strict mode figyelmeztetéseket
export default function ApiDocPage() {
  return (
    <div className="min-h-screen bg-white">
      <iframe
        src="/api/swagger/ui"
        className="w-full min-h-screen border-0"
        title="API Dokumentáció"
      />
    </div>
  )
}
