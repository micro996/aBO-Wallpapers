/* ============================================================
   Wallpaper App — Privacy Policy Content Module
   ============================================================
   Contains static/modular Privacy Policy text.
   ============================================================ */

'use strict';

const PrivacyPolicyContent = (() => {
  const POLICY_TEXT = `
    <h2>1. Introduction</h2>
    <p>Welcome to our Wallpaper Gallery app. We respect your privacy and are committed to protecting any information we collect or access. This Privacy Policy details how we handle information in our application.</p>

    <h2>2. Data Collection</h2>
    <p>Our wallpaper gallery mobile app functions primarily as a client-side gallery viewer:</p>
    <ul>
      <li><strong>No Personal Data Collection:</strong> We do not require account registration, and we do not collect or request names, email addresses, phone numbers, or any other personal identifiers.</li>
      <li><strong>No Tracking:</strong> We do not implement third-party tracking, analytics, or profiling software that monitors your web browsing or app interaction outside the scope of this application.</li>
    </ul>

    <h2>3. Device Storage and Cache</h2>
    <p>To provide a smooth visual experience and conserve network bandwidth, this app accesses your local storage:</p>
    <ul>
      <li><strong>Wallpaper Cache:</strong> Preview images are temporarily cached on your device to reduce loading times. You can clear this cache at any time through the Settings screen.</li>
      <li><strong>Preferences:</strong> Settings such as your Theme (Light/Dark mode) and Download Quality selection are saved locally in your browser/device's <code>localStorage</code>.</li>
      <li><strong>Favorites:</strong> Wallpaper cards that you mark as "Favorite" are stored locally so you can browse them offline. They are never synchronized to any remote database.</li>
    </ul>

    <h2>4. External Connections and Media Downloads</h2>
    <p>When you download a wallpaper, the app makes an HTTPS request to our secure image delivery network. Downloaded wallpapers are saved directly to your device storage. We do not track what specific images you choose to download.</p>

    <h2>5. Updates to this Policy</h2>
    <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal obligations. We recommend reviewing this section periodically for updates.</p>
  `;

  function getHTML() {
    return POLICY_TEXT;
  }

  return {
    getHTML
  };
})();
