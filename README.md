# GTL Fleet Manager v8

Responsive PWA for Garuda Transports & Logistics.

## v8 cloud architecture

The live app stores each customer and trip as an individual Supabase row in `customers`, `own_trips`, and `commission_trips`. This replaces the older whole-app `app_state` JSON save model and prevents unrelated records from being overwritten when two devices save at nearly the same time.

Trip IDs are assigned by PostgreSQL sequences/triggers (`GTL-OWN-####` and `GTL-COM-####`). Commission values are database-generated: VAHINI gets 10% of positive margin; all other customers get zero commission. POD `NA` forces Invoice Applicable and Invoice Generated to `NA`.

Supabase Realtime refreshes other signed-in devices when customers or trips change. Local storage is now a cache/backup convenience, not the authoritative database.

The app retains all six tabs: Dashboard, Own Vehicle, Commission, Invoices, Customers, and Backup.
