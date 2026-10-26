# Haramain Collection backend setup

The code is ready. This one-time setup connects it to a free Supabase project.

## 1. Create the Supabase project

1. Open <https://supabase.com/dashboard> and sign in.
2. Click **New project**.
3. Choose your organisation, enter **Haramain Collection**, and create a strong database password.
4. Select the closest available region to India and choose the **Free** plan.
5. Wait for the project to finish preparing.

## 2. Create the database

1. In Supabase, open **SQL Editor**.
2. Click **New query**.
3. Copy everything from `supabase/schema.sql`, paste it there, and click **Run**.

## 3. Create the private owner login

1. Open **Authentication** → **Users**.
2. Click **Add user** → **Create new user**.
3. Enter the owner's email and a strong password. Turn on **Auto Confirm User**.
4. Open that new user and copy its **User UID**.
5. Return to **SQL Editor** and run this after replacing the placeholder:

```sql
insert into public.admin_users (user_id)
values ('PASTE-OWNER-USER-UUID');
```

Only this approved user can add or edit products. Do not enable public sign-ups.

## 4. Connect the website

1. Open **Project Settings** → **API**.
2. Copy **Project URL** and the **anon public key**.
3. Paste both values into `js/supabase-config.js`.
4. Never paste the `service_role` key into the website.

## 5. Use the dashboard

Open `admin.html` and sign in. The first time, click **Import the 12 current products** so the existing catalogue moves into Supabase. After that, add and edit everything from this dashboard. For each product you can upload a photo, choose a category, enter prices and quantity, feature it on the home page, or hide it from the shop.

Quantity `0` automatically shows **Out of stock** and disables Add to cart. The **−1 stock** and **+1 stock** buttons make quick inventory corrections easy.

## 6. Publish changes

Commit and push the new files to GitHub. Netlify will redeploy automatically. The private dashboard will then be available at:

`https://haramaincollection.netlify.app/admin.html`

The dashboard page is hidden from search engines and is protected by Supabase login plus database permissions.
