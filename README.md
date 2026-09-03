# GTL Fleet Manager

Responsive web/PWA fleet application for Garuda Transports and Logistics.

## Included now
- Own Vehicle Tracking with fixed truck KA07AD0725
- Commission Business Tracking
- Auto Trip IDs
- Editable Invoice Number in both modules
- POD and invoice status fields
- Customer master with SUNVIK and VAHINI starter records
- Exact automatic calculations:
  - Pending = Paying to Driver - Paid So Far
  - Commission = 10% x (Customer Pays Us WO GST - Paying to Driver)
  - Net Income = Customer Pays Us WO GST - Paying to Driver - Commission
- Invoice builder based on the supplied GTL invoice structure
- CGST+SGST / IGST / No-GST choices
- Print / Save as PDF through browser print
- Local persistent storage
- JSON backup and restore
- PWA install support
- PostgreSQL/Supabase schema
- Capacitor configuration for Android/iOS packaging

## Run on a computer
Do not double-click if you want install/offline features. Serve the folder over HTTP:

    python -m http.server 8080

Then open http://localhost:8080

## Mobile use
Open the hosted HTTPS version in Chrome/Safari and choose Add to Home Screen / Install App.

## Native Android/iOS package
Install Node.js, then run:

    npm install
    npx cap add android
    npx cap add ios
    npx cap sync

Open the generated native project with Android Studio or Xcode.

## Important current limitation
This package is directly usable but stores operational data on the current browser/device. For multi-device synchronization, user login and WhatsApp automation, connect the UI to a hosted backend using `schema.sql`.

## WhatsApp integration target
Recommended flow: WhatsApp Business API webhook -> authenticated backend parser -> trip create/update by Trip ID -> database -> app refresh. API credentials are not included in this package.
