import { MaintenanceReportClient } from "./_components/MaintenanceReportClient";

export default function MaintenanceReportPage() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <MaintenanceReportClient />
      </div>
    </div>
  );
}
