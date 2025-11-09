import { UserAuthentication } from "@concepts/concepts.ts";

export async function verifyTokens(
  input: { token: string },
): Promise<{ userId: string }[]> {
  

const result = await UserAuthentication.verifyToken(input);

  
  return [result];
}