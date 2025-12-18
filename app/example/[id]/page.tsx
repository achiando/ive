import { getClients } from "@/lib/actions/client";
import { createInvoice, getInvoiceById, updateInvoice } from "@/lib/actions/invoice";
import { getProjects } from "@/lib/actions/project";
import { redirect } from "next/navigation";
import { InvoiceForm, InvoiceFormValues } from "../_components/InvoiceForm";

interface InvoicePageProps {
  params: {
    id: string;
  };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const resolvedParams = await params;

  const invoiceData = await getInvoiceById(resolvedParams.id);
  const clients = await getClients();
  const projects = await getProjects();

  if (!invoiceData && resolvedParams.id !== 'new') {
    return <div>Invoice not found.</div>;
  }

  // Transform the Prisma model to the form's expected shape
  const formattedInitialData: InvoiceFormValues | undefined = invoiceData
    ? {
        ...invoiceData,
        clientId: invoiceData.clientId || undefined,
        projectId: invoiceData.projectId || undefined,
        status: invoiceData.status as "paid" | "unpaid", // Add type assertion
        items: invoiceData.items.map(item => ({
          description: item.description,
          amount: item.amount,
        })),
      }
    : undefined;

  const handleSubmit = async (data: InvoiceFormValues) => {
    "use server";
    if (invoiceData) {
      await updateInvoice(invoiceData.id, data);
    } else {
      await createInvoice(data);
    }
    redirect("/invoices");
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        {invoiceData ? "Edit Invoice" : "Create New Invoice"}
      </h1>
      <InvoiceForm initialData={formattedInitialData} onSubmit={handleSubmit} />
    </div>
  );
}