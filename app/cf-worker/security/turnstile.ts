export async function verifyTurnstileToken(secretKey: string, token: string, remoteIp?: string): Promise<boolean> {
  if (!token) return false;
  // Allow bypass in local test/dev if dummy key is present
  if (token === 'TEST_PASS_TOKEN' && (!secretKey || secretKey === 'dummy_secret')) return true;

  const formData = new FormData();
  formData.append('secret', secretKey);
  formData.append('response', token);
  if (remoteIp) formData.append('remoteip', remoteIp);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData
  });
  const outcome = await res.json() as { success: boolean };
  return outcome.success;
}
