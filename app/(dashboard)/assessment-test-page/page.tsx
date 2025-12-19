"use client";

import { ManualType } from "@prisma/client";
import { useState } from "react";

export default function AssessmentTestPage() {
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [safetyTestId, setSafetyTestId] = useState("clt00000000000000000000000"); // Dummy ID
  const [equipmentId, setEquipmentId] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [documentTitle, setDocumentTitle] = useState("Test SOP Manual");
  const [manualType, setManualType] = useState<ManualType | "">("");

  const handleBotClose = (eqId?: string) => {
    setIsBotOpen(false);
    console.log("Assessment Bot closed. Equipment ID:", eqId);
    // You might want to refresh data or show a success message here
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Assessment Bot Test Page</h1>
{/* 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <Label htmlFor="safetyTestId">Safety Test ID</Label>
          <Input
            id="safetyTestId"
            value={safetyTestId}
            onChange={(e) => setSafetyTestId(e.target.value)}
            placeholder="e.g., clt00000000000000000000000"
          />
        </div>
        <div>
          <Label htmlFor="equipmentId">Equipment ID (Optional)</Label>
          <Input
            id="equipmentId"
            value={equipmentId}
            onChange={(e) => setEquipmentId(e.target.value)}
            placeholder="e.g., clt11111111111111111111111"
          />
        </div>
        <div>
          <Label htmlFor="manualUrl">Manual URL (Optional)</Label>
          <Input
            id="manualUrl"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="e.g., https://docs.google.com/document/d/..."
          />
        </div>
        <div>
          <Label htmlFor="manualType">Manual Type (Optional, if URL provided)</Label>
          <Select value={manualType} onValueChange={(value: ManualType | "") => setManualType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select manual type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {Object.values(ManualType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="documentTitle">Document Title</Label>
          <Input
            id="documentTitle"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            placeholder="e.g., Test SOP Manual"
          />
        </div>
      </div>

      <Button onClick={() => setIsBotOpen(true)}>Open Assessment Bot</Button>

      {isBotOpen && (
        <AssessmentBot
          open={isBotOpen}
          onClose={handleBotClose}
          safetyTestId={safetyTestId}
          equipmentId={equipmentId || undefined}
          manualUrl={manualUrl || undefined}
          documentTitle={documentTitle}
          isFirstLoginFlow={false} // Set to true to test first login flow
        />
      )} */}
    </div>
  );
}
