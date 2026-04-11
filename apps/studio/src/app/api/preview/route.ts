import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug");
  if (!secret || !slug) {
    return new Response("Missing preview parameters", { status: 400 });
  }
  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response("Invalid preview token", { status: 401 });
  }
  (await draftMode()).enable();
  redirect(`/${slug}`);
}
