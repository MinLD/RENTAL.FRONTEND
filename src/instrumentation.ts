export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getDefaultAutoSelectFamilyAttemptTimeout, setDefaultAutoSelectFamilyAttemptTimeout } = await import("node:net");
    // The default 250 ms can abandon reachable IPv4 addresses before they
    // connect on slower networks, especially when IPv6 is unavailable.
    setDefaultAutoSelectFamilyAttemptTimeout(
      Math.max(getDefaultAutoSelectFamilyAttemptTimeout(), 2000),
    );
  }
}
