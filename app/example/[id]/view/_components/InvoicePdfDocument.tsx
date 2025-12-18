import { COMPANY_INFO, PAYMENT_METHODS } from "@/lib/constants"; // Import constants
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import React from 'react';

// Register a font to ensure consistent rendering
// You might need to provide a path to a font file if you want a custom font
// Font.register({ family: 'Roboto', src: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf' });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica', // Default font
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 15,
    borderBottomWidth: 4,
    borderBottomColor: '#059669', // emerald-600
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  companyInfo: {
    textAlign: 'right',
    fontSize: 10,
    color: '#4b5563', // gray-600
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937', // gray-800
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#059669', // emerald-600
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 15,
  },
  billToDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  billTo: {
    width: '50%',
  },
  billToLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#6b7280', // gray-500
    marginBottom: 5,
  },
  billToName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937', // gray-800
  },
  billToAddress: {
    fontSize: 10,
    color: '#4b5563', // gray-600
  },
  invoiceDetails: {
    width: '50%',
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#6b7280', // gray-500
    marginRight: 5,
  },
  detailValue: {
    fontSize: 10,
    fontWeight: 'medium',
    color: '#1f2937', // gray-800
  },
  projectBox: {
    backgroundColor: '#ecfdf5', // emerald-50
    borderLeftWidth: 4,
    borderLeftColor: '#059669', // emerald-600
    padding: 10,
    marginBottom: 20,
  },
  projectLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#065f46', // emerald-800
    marginBottom: 5,
  },
  projectValue: {
    fontSize: 12,
    fontWeight: 'medium',
    color: '#047857', // emerald-900
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: 'auto',
    marginBottom: 20,
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    margin: 'auto',
  },
  tableColHeader: {
    width: '15%',
    borderBottomColor: '#e5e7eb', // gray-200
    borderBottomWidth: 1,
    padding: 5,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#4b5563', // gray-600
  },
  tableColHeaderDesc: {
    width: '70%',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    padding: 5,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#4b5563',
  },
  tableColHeaderAmount: {
    width: '15%',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    padding: 5,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#4b5563',
    textAlign: 'right',
  },
  tableCol: {
    width: '15%',
    borderBottomColor: '#f3f4f6', // gray-100
    borderBottomWidth: 1,
    padding: 5,
    fontSize: 10,
    color: '#4b5563',
  },
  tableColDesc: {
    width: '70%',
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
    padding: 5,
    fontSize: 10,
    color: '#1f2937',
  },
  tableColAmount: {
    width: '15%',
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
    padding: 5,
    fontSize: 10,
    fontWeight: 'medium',
    color: '#1f2937',
    textAlign: 'right',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  totalBox: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 5,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
  },
  paymentInfo: {
    backgroundColor: '#f0fdf4', // emerald-50
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  paymentInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  paymentItem: {
    width: '48%', // Roughly two columns
    marginBottom: 10,
  },
  paymentLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#4b5563',
    marginBottom: 3,
  },
  paymentValue: {
    fontSize: 10,
    fontWeight: 'medium',
    color: '#1f2937',
  },
  thankYou: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#059669',
    marginTop: 20,
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#4b5563',
  },
  signatureBlock: {
    width: '48%',
  },
  signatureLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db', // gray-300
    width: '80%',
    marginTop: 20,
    marginBottom: 5,
  },
  signatoryName: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 5,
  },
});

// Helper to format currency
function formatCurrencyPdf(amount: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type Item = {
  description: string;
  amount: number;
};

type DocumentData = {
  id: string;
  clientRel: { name: string; address?: string | null; primaryEmail?: string | null; primaryContact?: string | null; } | null; // Use client relation
  date: Date;
  dueDate?: Date;
  status: string;
  projectRel: { name: string } | null; // Use project relation
  items: Item[];
  amount: number;
  type: "Invoice" | "Receipt";
  paymentMethod?: string;
};

interface InvoicePdfDocumentProps {
  data: DocumentData;
}

export const InvoicePdfDocument: React.FC<InvoicePdfDocumentProps> = ({ data }) => {
  const isInvoice = data.type === "Invoice";
  const clientName = data.clientRel?.name || "N/A";
  const clientAddress = data.clientRel?.address || "Nairobi, Kenya"; // Default if not provided
  const projectName = data.projectRel?.name || "N/A";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={COMPANY_INFO.logoPath} style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
            <Text>Email: {COMPANY_INFO.email}</Text>
            <Text>PIN: {COMPANY_INFO.pin}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{data.type}</Text>

        {/* Bill To and Details */}
        <View style={styles.billToDetails}>
          <View style={styles.billTo}>
            <Text style={styles.billToLabel}>Bill To:</Text>
            <Text style={styles.billToName}>{clientName}</Text>
            <Text style={styles.billToAddress}>{clientAddress}</Text>
          </View>
          <View style={styles.invoiceDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{data.type} Number:</Text>
              <Text style={styles.detailValue}>{data.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{format(data.date, "dd/MM/yyyy")}</Text>
            </View>
            {isInvoice && data.dueDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Due Date:</Text>
                <Text style={styles.detailValue}>{format(data.dueDate, "dd/MM/yyyy")}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, { color: data.status === 'paid' ? '#059669' : '#f97316' }]}>
                {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Project Description */}
        <View style={styles.projectBox}>
          <Text style={styles.projectLabel}>Project / Description</Text>
          <Text style={styles.projectValue}>{projectName}</Text>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.projectLabel}>{data.type} Details</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>#</Text>
              <Text style={styles.tableColHeaderDesc}>Description</Text>
              <Text style={styles.tableColHeaderAmount}>Amount (KES)</Text>
            </View>
            {data.items.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <Text style={styles.tableCol}>{index + 1}</Text>
                <Text style={styles.tableColDesc}>{item.description}</Text>
                <Text style={styles.tableColAmount}>{formatCurrencyPdf(item.amount)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Amount {isInvoice ? 'Due' : 'Paid'}:</Text>
            <Text style={styles.totalAmount}>{formatCurrencyPdf(data.amount)}</Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentInfoTitle}>Payment Information</Text>
          <View style={styles.paymentGrid}>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Payment Method</Text>
              <Text style={styles.paymentValue}>{PAYMENT_METHODS.bankTransfer.method}</Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Bank Name</Text>
              <Text style={styles.paymentValue}>{PAYMENT_METHODS.bankTransfer.bankName}</Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Paybill Number</Text>
              <Text style={styles.paymentValue}>{PAYMENT_METHODS.bankTransfer.paybillNumber}</Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Account Number</Text>
              <Text style={styles.paymentValue}>{PAYMENT_METHODS.bankTransfer.accountNumber}</Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Account Name</Text>
              <Text style={styles.paymentValue}>{PAYMENT_METHODS.bankTransfer.accountName}</Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Amount Due</Text>
              <Text style={styles.paymentValue}>{formatCurrencyPdf(data.amount)}</Text>
            </View>
          </View>
        </View>

        {/* Thank you */}
        <Text style={styles.thankYou}>Thank you for your business!</Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Prepared By:</Text>
            <Text>{COMPANY_INFO.name}</Text>
            <Text style={styles.signatoryName}>{COMPANY_INFO.ceo}</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Authorized By:</Text>
            <View style={styles.signatureLine} />
            <Text style={{ marginTop: 5 }}>Date:</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};