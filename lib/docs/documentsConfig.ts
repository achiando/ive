interface DocumentConfig {
  id: string;
  title: string;
  description: string;

  // Docs (optional)
  google_doc_url?: string;
  embed_url?: string;

  // Videos (optional)
  video_urls?: string[];

  category?: string;
  display_order?: number;

  // NEW
  equipments?: string[]; // machines/tools covered
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
  },
  // --------------------
  // VIDEO TUTORIALS
  // --------------------

  {
    id: "video-metalwork-arc-welding",
    title: "Arc Welding Basics",
    description: "Arc welding safety and operation tutorials",
    category: "Video Tutorials",
    display_order: 1,
    equipments: ["Arc Welding Machine"],
    video_urls: [
      "https://www.youtube.com/watch?v=TBeiyQlNCpQ",
      "https://www.youtube.com/watch?v=Dybrlx-BTXk&t=370s"
    ]
  },

  {
    id: "video-metalwork-mig-welding",
    title: "MIG Welding",
    description: "MIG welding machine operation",
    category: "Video Tutorials",
    display_order: 2,
    equipments: ["MIG Welding Machine"],
    video_urls: [
      "https://www.youtube.com/watch?v=NlOihxByeus"
    ]
  },

  {
    id: "video-metalwork-drill-press",
    title: "Drill Press",
    description: "How to safely operate a drill press",
    category: "Video Tutorials",
    display_order: 3,
    equipments: ["Drill Press"],
    video_urls: [
      "https://www.youtube.com/watch?v=3QAcfk27jXI"
    ]
  },

  {
    id: "video-woodwork-saws",
    title: "Woodworking Saws",
    description: "Operation of common woodworking saws",
    category: "Video Tutorials",
    display_order: 4,
    equipments: [
      "Miter Saw",
      "Circular Saw",
      "Jig Saw",
      "Table Saw",
      "Band Saw"
    ],
    video_urls: [
      "https://www.youtube.com/watch?v=-egiw1730m8",
      "https://www.youtube.com/watch?v=4jpOYxRyTFY",
      "https://www.youtube.com/watch?v=_ztM_Y_PlAo",
      "https://www.youtube.com/watch?v=tKtE0sTFi8g",
      "https://www.youtube.com/watch?v=B7T71I-YQZk"
    ]
  },

  {
    id: "video-laser-cutting",
    title: "Laser Cutting & Engraving",
    description: "CO2 laser cutter and engraver tutorials",
    category: "Video Tutorials",
    display_order: 5,
    equipments: ["CO2 Laser Cutter", "Laser Engraver"],
    video_urls: [
      "https://www.youtube.com/watch?v=t4BfQGhhbOQ",
      "https://www.youtube.com/watch?v=oJukNTgHns4"
    ]
  },

  {
    id: "video-3d-printing",
    title: "3D Printing & Scanning",
    description: "3D printer and scanner operation guides",
    category: "Video Tutorials",
    display_order: 6,
    equipments: ["3D Printer", "3D Scanner"],
    video_urls: [
      "https://www.youtube.com/watch?v=2vFdwz4U1VQ",
      "https://www.youtube.com/watch?v=1KEu3RkuzVc"
    ]
  },

  {
    id: "video-textile-machines",
    title: "Textile Machines",
    description: "Mini and industrial sewing machine tutorials",
    category: "Video Tutorials",
    display_order: 7,
    equipments: [
      "Mini Sewing Machine",
      "Industrial Sewing Machine (Juki DDL 8700)"
    ],
    video_urls: [
      "https://www.youtube.com/watch?v=Qps9woUGkvI" // replace with exact sewing links if needed
    ]
  },

  {
    id: "video-electronics",
    title: "Electronics Lab Equipment",
    description: "Electronics tools operation",
    category: "Video Tutorials",
    display_order: 8,
    equipments: ["Soldering Station", "Oscilloscope"],
    video_urls: [
      "https://www.youtube.com/watch?v=Qps9woUGkvI",
      "https://www.youtube.com/watch?v=lSHAE_Y6snc"
    ]
  },

  {
    id: "video-cnc-router",
    title: "CNC Router",
    description: "CNC router operation and safety",
    category: "Video Tutorials",
    display_order: 9,
    equipments: ["CNC Router", "CNC"],
    video_urls: [
      "https://www.youtube.com/watch?v=lQ-MYnyxh7M"
    ]
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
