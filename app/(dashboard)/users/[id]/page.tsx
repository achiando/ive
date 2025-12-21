
import { createUser, getUserById, updateUser } from "@/lib/actions/user";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { UserForm, UserFormValues } from "../_components/UserForm";

interface UserPageProps {
  params: {
    id: string;
  };
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params;
  

  const isNewUser = id === 'new';
  const userData = isNewUser ? null : await getUserById(id);

  if (!isNewUser && !userData) {
    return <div>User not found.</div>;
  }

  const handleSubmit = async (data: UserFormValues) => {
    "use server";
    
    const dataToSave = { ...data };

    if (isNewUser) {
        if(!data.password) {
            throw new Error("Password is required for new users.");
        }
      const hashedPassword = await hash(data.password, 10);
      // @ts-ignore
      await createUser({ ...dataToSave, password: hashedPassword });
    } else {
      if (userData) {
        const updateData: Partial<UserFormValues> = { ...dataToSave };
        delete updateData.password; 
        await updateUser(userData.id, updateData);
      }
    }
    redirect(`/users?reload=true`);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        {isNewUser ? "Create New User" : "Edit User"}
      </h1>
      <UserForm initialData={userData || undefined} onSubmit={handleSubmit} />
    </div>
  );
}
