"use server";

import { joinProjectWithToken } from "@/lib/actions/project";
import { redirect } from "next/navigation";

export async function handleJoinProjectInvite(token: string, userId: string, projectId: string) {
  await joinProjectWithToken(token, userId);
  redirect(`/projects/${projectId}/view`);
}
