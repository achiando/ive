import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { getInvoices, getMonthlyInvoiceAmounts } from "@/lib/actions/invoice";
import Link from "next/link";
import { columns } from "./_components/columns";
import { MonthlyInvoiceChart } from "./_components/MonthlyInvoiceChart";

export default async function InvoicesPage() {
  const invoices = await getInvoices();
  const monthlyInvoiceAmounts = await getMonthlyInvoiceAmounts();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Invoices
        </h1>
        <Button asChild>
          <Link href="/invoices/new">New Invoice</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="font-medium">Monthly Invoice Amounts</h3>
        <div className="mt-4">
          <MonthlyInvoiceChart data={monthlyInvoiceAmounts} />
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={invoices}
        filterColumnId="clientId"
        filterColumnPlaceholder="Filter by client..."
      />
    </div>
  );
}
