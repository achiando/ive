"use client";

import { Button } from "@/components/ui/button";
import { DocumentDisplay } from "@/components/ui/DocumentDisplay";
import type { Invoice, Item, Client, Project } from "@prisma/client"; // Import Client and Project types
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { InvoicePdfDocument } from "./InvoicePdfDocument";
import dynamic from "next/dynamic";

// Dynamically import PDFDownloadLink to ensure it's only rendered on the client-side
const DynamicPDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface InvoiceViewProps {
  invoiceData: Invoice & { items: Item[]; clientRel: Client | null; projectRel: Project | null; };
}

export function InvoiceView({ invoiceData }: InvoiceViewProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice-${invoiceData.id}`,
  });

  // Prepare data for the generic display component
  const documentData = {
    ...invoiceData,
    type: "Invoice" as const,
    client: invoiceData.clientRel?.name || "N/A", // Use client name from relation
    project: invoiceData.projectRel?.name || invoiceData.project, // Use project name from relation or fallback
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold">View Invoice</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            Print
          </Button>
          <DynamicPDFDownloadLink
            document={<InvoicePdfDocument data={documentData} />}
            fileName={`Invoice-${invoiceData.id}.pdf`}
          >
            {({ loading }) => (
              <Button disabled={loading}>
                {loading ? "Generating PDF..." : "Download PDF"}
              </Button>
            )}
          </DynamicPDFDownloadLink>
        </div>
      </div>
      {/* The component to be printed */}
      <DocumentDisplay ref={componentRef} data={documentData} />
    </div>
  );
}