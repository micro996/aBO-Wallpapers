/* ============================================================
   Wallpaper App — Terms & Conditions Content Module
   ============================================================
   Contains static/modular Terms & Conditions HTML text.
   ============================================================ */

'use strict';

const TermsConditionsContent = (() => {
  const TERMS_TEXT = `
    <h2>1. Acceptance of Terms</h2>
    <p>By downloading, installing, or using the Wallpaper Gallery application ("Application"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the Application.</p>

    <h2>2. Use of the Application</h2>
    <p>You are granted a non-exclusive, non-transferable, revocable license to use the Application for personal, non-commercial purposes in accordance with these Terms.</p>

    <h2>3. Wallpaper Usage</h2>
    <p>All wallpapers provided in the Application are sourced from free-to-use photography repositories or public domains:</p>
    <ul>
      <li>Wallpapers are for personal use only (e.g., setting as device background).</li>
      <li>You may not redistribute, resell, or lease any wallpapers commercially.</li>
      <li>If attribution is provided, you must respect the author's copyright.</li>
    </ul>

    <h2>4. Intellectual Property</h2>
    <p>All brand names, logos, design files, icons, and code in the Application are the intellectual property of Wallpaper Gallery. Third-party content (wallpapers) belongs to their respective owners.</p>

    <h2>5. User Responsibilities</h2>
    <p>You agree not to use the Application for any unlawful purpose, or to upload/distribute malicious software or content that interferes with the app's services or operations.</p>

    <h2>6. Downloads & Storage</h2>
    <p>The Application allows downloading wallpapers to local device storage. You are responsible for ensuring your device has sufficient storage space and permissions to save these files.</p>

    <h2>7. Third-Party Services</h2>
    <p>The Application may link to external APIs or services (e.g., image hosts, stores). We do not control or assume responsibility for the content, privacy policies, or practices of any third-party services.</p>

    <h2>8. Privacy</h2>
    <p>Your privacy is important to us. Please review our Privacy Policy, which explains how we handle preference settings and storage data locally on your device.</p>

    <h2>9. Disclaimer of Warranties</h2>
    <p>The Application is provided "AS IS" and "AS AVAILABLE" without any warranties of any kind. We do not guarantee that the Application will be error-free, uninterrupted, or free of bugs.</p>

    <h2>10. Limitation of Liability</h2>
    <p>To the maximum extent permitted by law, Wallpaper Gallery shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Application.</p>

    <h2>11. Changes to These Terms</h2>
    <p>We reserve the right to modify these Terms at any time. Any changes will be posted here with an updated "Last Updated" date. Your continued use of the Application constitutes acceptance of the new terms.</p>

    <h2>12. Contact Information</h2>
    <p>For any questions regarding these Terms & Conditions, please visit our website at <strong><a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a></strong>.</p>
  `;

  function getHTML() {
    return TERMS_TEXT;
  }

  return {
    getHTML
  };
})();
