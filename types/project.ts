import { Project, ProjectMember, User, ProjectDocument } from "@prisma/client";

export type ProjectWithDetails = Project & {
  creator: User;
  members: (ProjectMember & {
    user: User | null;
  })[];
  documents: ProjectDocument[];
};
