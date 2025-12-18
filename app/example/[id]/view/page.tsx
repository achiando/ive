// app/invoices/[id]/view/page.tsx
import { Button } from "@/components/ui/button";
import { getInvoiceById } from "@/lib/actions/invoice";
import Link from "next/link";
import { InvoiceView } from "./_components/InvoiceView";
import type { Invoice, Item, Client, Project } from "@prisma/client"; // Import necessary types

export default async function InvoiceViewPage({
  params,
}: {
  params: { id: string };
}) {
  // Make sure params.id exists before making the call
  const resolvedParams = await params;

  if (!resolvedParams?.id) {
    return (
      <div className="text-center">
        <p className="text-lg font-semibold">Invalid invoice ID</p>
        <Button asChild variant="link">
          <Link href="/invoices">Go back to all invoices</Link>
        </Button>
      </div>
    );
  }

  try {
    // Fetch invoice data including client and project relations
    const invoiceData = await getInvoiceById(resolvedParams.id) as (Invoice & { items: Item[]; clientRel: Client | null; projectRel: Project | null; }) | null;

    if (!invoiceData) {
      return (
        <div className="text-center">
          <p className="text-lg font-semibold">Invoice not found</p>
          <Button asChild variant="link">
            <Link href="/invoices">Go back to all invoices</Link>
          </Button>
        </div>
      );
    }

    return <InvoiceView invoiceData={invoiceData} />;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return (
      <div className="text-center">
        <p className="text-lg font-semibold">Error loading invoice</p>
        <Button asChild variant="link">
          <Link href="/invoices">Go back to all invoices</Link>
        </Button>
      </div>
    );
  }
}
