import { BulkUploadClient } from "./_components/BulkUploadClient";

export default function ConsumableBulkUploadPage() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BulkUploadClient />
      </div>
    </div>
  );
}
