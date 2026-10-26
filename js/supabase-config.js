/*
 * Haramain Collection backend connection
 * --------------------------------------
 * 1. Create a Supabase project.
 * 2. Open Project Settings > API.
 * 3. Paste the Project URL and anon public key below.
 *
 * The anon key is designed to be used in browser code. Never put the
 * service-role key in this file or anywhere in the public website.
 */
window.HARAMAIN_BACKEND = {
  url: "https://joqcufukgrzxshtmiphd.supabase.co",
  anonKey: "sb_publishable_YW6clJrpIwIJNU93UDy5fQ_8j8HV8sR",
  isConfigured() {
    return this.url.startsWith("https://") &&
      !this.url.includes("PASTE_") &&
      this.anonKey.length > 40 &&
      !this.anonKey.includes("PASTE_");
  }
};
