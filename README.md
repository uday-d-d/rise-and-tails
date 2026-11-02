# Rise and Tails

Build a clean, responsive, and compassionate website for an Animal Rescue and Adoption organization using React, Tailwind CSS, and standard UI components.

Key Features & Pages:

Header & Navigation:

Clean navbar with tabs: Home, Adopt, Urgent Rescue, and an NGO Login button at the top right.

Adoption Page / Section:

Strictly limit species selection to only 2 options: "Dogs" or "Cats" (use toggle buttons or simple filtering).

Show pet card preview grids for available dogs and cats with image, age, name, and an "Adopt Me" button.

Clicking "Adopt Me" opens an Adoption Application Form with the following required fields:

Full Name

Email Address

Phone Number

Home Address & City

Housing Type (e.g., House with yard, Apartment, Rented)

Previous Pet Ownership Experience (Yes/No text area)

Submit Application Button

Urgent Rescue Tab (Minimal & Fast Procedure):

Designed for immediate action since animals need urgent help.

Keep form fields to a absolute minimum (no login or registration required to submit):

Live Location / Pin GPS Location button or Address input (Required)

Photo upload or brief status description (Required)

Reporter Contact Number (Required)

Large, high-visibility "SEND URGENT RESCUE ALERT" CTA button.

Add a quick-dial "Emergency Call" button at the top.

NGO Admin Login & Dashboard:

Provide a lightweight page for NGO Admin Login (Username/Password).

Once logged in, display an NGO Management Dashboard showing two main tabs:

Adoption Requests: Lists all submitted adoption application forms with full applicant details and an "Approve / Reject" action toggle.

Rescue Alerts: Displays real-time rescue requests.

25 km Radius Constraint System:

Set the NGO's primary fixed coordinates/location (e.g., Default to City Center or editable in NGO Settings).

When a user submits an Urgent Rescue request or Adoption request, calculate the distance using Haversine formula (or a mock 25 km distance validator).

If the request location is within 25 km, accept the request, notify the user with a confirmation screen, and push the record to the NGO Dashboard.

If the location exceeds 25 km, display a polite notice: "Location out of 25 km service radius. Request redirected to partner shelter network."

Design & Vibe:

Warm, urgent yet hopeful color scheme (soft greens, warm orange accents for alerts, clean white background). Responsive across mobile and desktop devices.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/13e29d8d-766e-5076-a0cb-699390ccf8f0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```


## NGO Admin Panel (login)

Open **NGO Login** in the top-right of the site (or go to `/ngo`).

- Default username: `admin`
- Default password: `riseandtails@123`

Change them in `src/lib/admin-auth.server.ts`, or set `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables on the server.

The login is checked on the server and kept in a secure, HTTP-only cookie (8 hours). The panel reads adoption requests and rescue alerts through server functions, so the server needs `SUPABASE_SERVICE_ROLE_KEY` set (Lovable Cloud provides it automatically; if you run locally, add it to your `.env`). Never commit the real key or expose it in browser code. Optionally set `ADMIN_SESSION_SECRET` to a long random string.
