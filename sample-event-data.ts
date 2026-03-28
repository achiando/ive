// Sample event data matching enhanced schema
const sampleEventData = {
  name: "Medical Device Innovation Summer Program",
  description: "Join us this summer for an immersive experience in medical device innovation.",
  startDate: "2026-06-15T09:00:00.000Z",
  endDate: "2026-08-15T17:00:00.000Z",
  venue: "Innovation Lab, Main Campus",
  maxParticipants: 50,
  createdById: "user_id_here",
  
  // Enhanced fields
  tag: "Summer Program",
  subtitle: "Medical Device Innovation Experience",
  
  cta: {
    label: "Apply Now",
    href: "https://forms.gle/YuRDkTCB4SQwpu1C9"
  },
  
  contact: "innovation@university.edu",
  tagColor: "blue",
  meetingLink: "https://forms.gle/YuRDkTCB4SQwpu1C9",
  imageUrl: "/images/medical-device-program.jpg",
  
  dates: [
    {
      label: "Application Deadline",
      value: "2026-05-31T23:59:00.000Z"
    },
    {
      label: "Program Start",
      value: "2026-06-15T09:00:00.000Z"
    },
    {
      label: "Mid-Program Review",
      value: "2026-07-15T14:00:00.000Z"
    },
    {
      label: "Final Presentations",
      value: "2026-08-10T13:00:00.000Z"
    },
    {
      label: "Program End",
      value: "2026-08-15T17:00:00.000Z"
    }
  ]
};

export default sampleEventData;
