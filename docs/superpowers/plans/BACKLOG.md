# Dealer/Customer App — Integration Backlog

Items deferred from the 2026-04-25 backend integration session. Each is independently scoped and can be picked up in any order.

---

## 1. Service hook gaps (~30 min, 3 tasks)

Service screens already exist and call most endpoints, but a few API hooks are defined in `api.constant.ts` without React Query wrappers.

- **`useJob(id)`** — `GET /service/jobs/:id`
  - Use in `BookingDetailScreen` and `PartsApprovalScreen` to read live job state (status, parts list, diagnosis).

- **`useRecordBookingPayment`** — `POST /service/bookings/:id/payment`
  - Wire into the service-side `PaymentScreen` flow (when `bookingId` is set on route params).

- **`useApprovePart(jobId, partId)`** — `PUT /service/jobs/:id/parts/:partId/approve`
  - Per-part approval. Currently `PartsApprovalScreen` uses bulk-approve only. Add per-row approve buttons.

**Files:** `src/services/services/services.query.ts`, `src/screens/app/services/BookingDetailScreen.tsx`, `src/screens/app/services/PartsApprovalScreen.tsx`, `src/screens/app/payment/PaymentScreen.tsx`.

---

## 2. Quote PDF download (~30 min, 2 tasks)

Backend exposes `GET /quotes/:id/pdf` — endpoint constant exists in `api.constant.ts`, no consumer.

- **`useDownloadQuotePdf`** — fetches the PDF blob, saves to local storage, opens with system viewer.
  - Library: `react-native-blob-util` (preferred) or `react-native-fs` + `Share`.
  - Path: `Documents/quote-{id}.pdf`.

- **Add download button** to `QuotationDetailScreen` — show a Download icon in the header next to existing actions; trigger the hook + open the saved file.

**Files:** `src/services/quotations/quotations.query.ts`, `src/screens/app/quotations/QuotationDetailScreen.tsx`. Likely needs a new dep (`npm install react-native-blob-util` + `cd ios && pod install`).

---

## 3. Notification preferences (~45 min, 3 tasks)

Backend supports `GET/PUT /notifications/preferences` (e.g., toggle email/SMS/push per category). No frontend yet.

- Add endpoint constants under `NOTIFICATIONS.PREFERENCES` and types `NotificationPreferences`, `UpdateNotificationPreferencesRequest`.
- Add `useNotificationPreferences()` and `useUpdateNotificationPreferences()` to `notifications.query.ts`.
- New `NotificationPreferencesScreen` under Profile stack with toggles for each channel/category. Wire into ProfileStack route + Profile menu entry.

---

## 4. FCM push token registration (~30 min, 2 tasks)

Backend uses Firebase Cloud Messaging for push notifications. Need to confirm device tokens are registered server-side.

- **Audit current FCM setup**: check `App.tsx` / any auth hook for `messaging().getToken()` and where it's sent.
- **Send token to backend on login** — likely via existing `PUT /auth/me` (add a `fcmToken` field) or a dedicated endpoint (confirm with backend team). Refresh on `messaging().onTokenRefresh()`.

---

## 5. Pro app role (deferred — out of current product scope)

Backend has full pro lifecycle (registration, accept/reject bookings, OTP verify, jobs, earnings). The RN app's `UserRole` type already includes `'pro'` but no screens/services exist for that role.

If/when pros are added to this app:
- Pro registration screen → `POST /service/pros/register`
- Separate tab navigator gated on `user.role === 'pro'`
- Booking actions: accept, reject, verify-OTP
- Jobs flow: list, detail, mark enroute, start, complete
- Diagnoses + parts management
- Earnings screen → `GET /service/earnings`

Estimated effort: a separate sub-project, ~1–2 days.

---

## Notes for whoever picks these up

- **Type-only imports**: `verbatimModuleSyntax` is on — always `import type { ... }` for types.
- **Path alias**: always `@/` for `src/` imports.
- **Toast on every mutation** (success + error) per `CLAUDE.md` rules.
- **Pre-existing TS errors** to be aware of (not caused by current backlog work):
  - `src/screens/app/HomeScreen.tsx:60` — navigate string vs object
  - `src/screens/app/services/BookServiceScreen.tsx:52` — string vs number
  - `src/services/auth/auth.query.ts:21,89` — unused `AuthResponse` and `variables`

Pick any of these up; type-check (`npm run build`) and lint (`npm run lint`) before considering done. Manual device testing required — I can't run the RN app from CI.
