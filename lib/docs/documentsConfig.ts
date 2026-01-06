interface DocumentConfig {
  id: string;
  title: string;
  description: string;
  google_doc_url: string;
  embed_url: string;
  category?: string;
  display_order?: number;
}

export const DOCUMENTS_CONFIG: DocumentConfig[] = [
  {
    id: "sop-1756322438538",
    title: "Soldier Iron Stands",
    description: "Standard Operating Procedure and Safety Manual for Soldier Iron Station",
    google_doc_url: "https://docs.google.com/document/d/e/2PACX-1vRMTKG7fib7HXe2oM8QLy7UN40UQeRp1TpZ6XnJIXFkVFRD7ApcegOIjEfuPktafA_-jBN8tRC0QhXI/pub",
    embed_url: "https://docs.google.com/document/d/e/2PACX-1vRMTKG7fib7HXe2oM8QLy7UN40UQeRp1TpZ6XnJIXFkVFRD7ApcegOIjEfuPktafA_-jBN8tRC0QhXI/pub?embedded=true",
    category: "SOP Manuals",
    display_order: 1
  },
  {
    id: "sop-1756322515152",
    title: "3D Printer (Ender 3)",
    description: "Standard Operating Procedure and Safety Manual for #D Printer (Prusa)",
    google_doc_url: "https://docs.google.com/document/d/e/2PACX-1vS08OUkb-MEEhv17PLkr6NjXoKedw6HfkK15IxBgIfslpmXGQmhSr7hu_Y5wejIR4jdGleUzZnoouos/pub",
    embed_url: "https://docs.google.com/document/d/e/2PACX-1vS08OUkb-MEEhv17PLkr6NjXoKedw6HfkK15IxBgIfslpmXGQmhSr7hu_Y5wejIR4jdGleUzZnoouos/pub?embedded=true",
    category: "SOP Manuals",
    display_order: 1
  },
  {
    id: "sop-1756721338369",
    title: "3D Printer Prusa",
    description: "Standard Operating Procedure and Safety Manual for 3D Printer (Prusa)",
    google_doc_url: "https://docs.google.com/document/d/e/2PACX-1vRhpK7wENeGANOZ0ubHy-lO8gIrIyCCYbIV8o269FulJ4e1oJvkmCW56Ixc86F4Yg/pub?authuser=1",
    embed_url: "https://docs.google.com/document/d/e/2PACX-1vRhpK7wENeGANOZ0ubHy-lO8gIrIyCCYbIV8o269FulJ4e1oJvkmCW56Ixc86F4Yg/pub?embedded=true&authuser=1",
    category: "SOP Manuals",
    display_order: 1
  },
  {
    id: "sop-1756819829791",
    title: "Lab SOP & Safety Practices",
    description: "CDIE Laboratory Safety Standard Operating Procedures (SOP) Manual",
    google_doc_url: "https://docs.google.com/document/d/e/2PACX-1vRYjkzUIiWNYZQ6FpNYQH5G0o_-1M4aVDaFTp75YQSqNn19lMy-N1hD4V6IY1hiSh9GOTz5vz1ICXAJ/pub",
    embed_url: "https://docs.google.com/document/d/e/2PACX-1vRYjkzUIiWNYZQ6FpNYQH5G0o_-1M4aVDaFTp75YQSqNn19lMy-N1hD4V6IY1hiSh9GOTz5vz1ICXAJ/pub?embedded=true",
    category: "SOP Manuals",
    display_order: 1
  }
];

// Helper function to get documents by category
export const getDocumentsByCategory = (category: string): DocumentConfig[] => {
  return DOCUMENTS_CONFIG
    .filter(doc => doc.category === category)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
};

// Helper function to get document by ID
export const getDocumentById = (id: string): DocumentConfig | undefined => {
  return DOCUMENTS_CONFIG.find(doc => doc.id === id);
};

// Helper function to get all SOP manuals
export const getSOPManuals = (): DocumentConfig[] => {
  return getDocumentsByCategory("SOP Manuals");
};
