# Deploy Pangames to Fly.io

Pangames uses one Node.js process for both Next.js and Socket.IO. The game engines keep active rooms in memory, so production must run **one always-on Machine** unless room state is moved to a shared datastore later.

The checked-in configuration targets the existing Fly app `xizachonline` and Singapore (`sin`), the closest Fly region for most players in Vietnam.

## 1. What the production configuration does

- Builds the Next.js application inside a multi-stage Docker image.
- Starts `server.ts`, which serves Next.js and registers all four Socket.IO engines on the same port.
- Exposes internal port `3000` through Fly Proxy with HTTPS enforced.
- Uses connection-based concurrency so WebSocket connections are measured correctly.
- Keeps one Machine running; auto-stop is disabled because stopping the process destroys in-memory rooms.
- Checks `/` every 30 seconds and only routes traffic to a healthy Machine.
- Runs the container as an unprivileged `nextjs` user.

No Fly Volume is required. A Volume would not make the in-memory room objects persistent.

## 2. Install and sign in to flyctl on Windows

```powershell
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
fly auth login
fly auth whoami
```

Run all remaining commands from the repository root:

```powershell
Set-Location D:\Xizach\xz
fly config validate
```

## 3. Choose the Fly app name

The existing remote app is `xizachonline`. The `app` field in `fly.toml` must exactly match the app shown in **Fly Dashboard → Apps**.

To keep the current app, do nothing. To change its infrastructure name and `.fly.dev` hostname to Pangames, first verify that the desired globally unique name is available, then run:

```powershell
fly apps rename pangames -a xizachonline
```

After a successful rename, change `app = 'xizachonline'` to `app = 'pangames'` in `fly.toml`. Renaming changes the default Fly hostname, so update any DNS records or external links that point to the old hostname.

## 4. Configure runtime secrets

The current app has no Fly secrets. Set the server-side credentials before deploying:

```powershell
fly secrets set `
  LIVEKIT_API_KEY="YOUR_LIVEKIT_API_KEY" `
  LIVEKIT_API_SECRET="YOUR_LIVEKIT_API_SECRET" `
  IMAGEKIT_PRIVATE_KEY="YOUR_IMAGEKIT_PRIVATE_KEY" `
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="YOUR_IMAGEKIT_PUBLIC_KEY" `
  NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/YOUR_IMAGEKIT_ID" `
  -a xizachonline
```

If voice chat is not required, the app can run without the LiveKit credentials, but the voice token endpoint will not work. If avatar upload/deletion is not required, the ImageKit credentials may be omitted, but those features will not work.

Verify only the names and digests, never secret values:

```powershell
fly secrets list -a xizachonline
```

In the website UI, the same values are entered at **Fly Dashboard → xizachonline → Secrets → Add secret**. Add one row per variable and deploy/restart when prompted.

## 5. Configure public build-time variables

Variables beginning with `NEXT_PUBLIC_` are compiled into the browser bundle during `next build`. Runtime secrets alone cannot change them after the image has been built.

Pangames serves Socket.IO from the same origin, so keep `NEXT_PUBLIC_SOCKET_URL` empty. Supply the public LiveKit and ImageKit values when deploying:

```powershell
fly deploy `
  --build-arg NEXT_PUBLIC_SOCKET_URL="" `
  --build-arg NEXT_PUBLIC_LIVEKIT_URL="wss://YOUR_PROJECT.livekit.cloud" `
  --build-arg NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="YOUR_IMAGEKIT_PUBLIC_KEY" `
  --build-arg NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/YOUR_IMAGEKIT_ID" `
  -a xizachonline
```

Public build arguments are visible in the built client and must never contain `LIVEKIT_API_SECRET` or `IMAGEKIT_PRIVATE_KEY`.

## 6. Correct the Machine layout in Fly Dashboard

The existing app currently has two stopped Machines in Amsterdam (`ams`). Pangames should use one Machine in Singapore:

```powershell
fly scale count 1 --region sin -a xizachonline
fly scale count 0 --region ams -a xizachonline
fly scale vm shared-cpu-1x --vm-memory 1024 -a xizachonline
fly status -a xizachonline
```

The two-step region change is intentional: the first command creates the Singapore Machine; the second removes the old Amsterdam Machines after Singapore exists.

In **Fly Dashboard → xizachonline → Machines**, confirm:

- Machine count: `1`
- Region: `sin` (Singapore)
- CPU: Shared CPU, 1 core
- Memory: 1 GB
- Auto stop: disabled
- Machine state after deployment: started

Do not scale to multiple Machines yet. Socket.IO rooms and game engines are process-local, so players routed to different Machines would see different room state.

## 7. First deployment and smoke checks

After setting secrets and build arguments, watch the deployment and logs:

```powershell
fly status -a xizachonline
fly checks list -a xizachonline
fly logs -a xizachonline
fly open -a xizachonline
```

Then verify the actual website:

1. Open the landing page over HTTPS.
2. Open Avalon, Deception, Weredog, and Glitcher.
3. Create a room in one browser and join it from a private window or phone.
4. Confirm lobby updates arrive immediately without polling.
5. Refresh one player and confirm secure reconnection restores the same seat.
6. Start a Glitcher game and verify the question modal and result screen in mobile landscape.
7. If LiveKit is configured, join voice chat with two clients.
8. Upload and delete an avatar if ImageKit is configured.

Useful network checks:

```powershell
curl.exe -I https://xizachonline.fly.dev/
curl.exe "https://xizachonline.fly.dev/socket.io/?EIO=4&transport=polling"
```

The first command should return a successful or redirect response over HTTPS. The Socket.IO polling endpoint should return a handshake payload rather than `404`.

## 8. Configure a custom domain in the Fly website

In **Fly Dashboard → xizachonline → Certificates**:

1. Select **Add certificate**.
2. Enter the exact hostname, for example `play.example.com`.
3. Copy the DNS target shown by Fly.
4. For a subdomain, create the shown CNAME at your DNS provider.
5. For an apex/root domain, use the A and AAAA records displayed by Fly.
6. Return to the certificate page and wait until both ownership and certificate status are valid.

The equivalent CLI flow is:

```powershell
fly certs add play.example.com -a xizachonline
fly certs setup play.example.com -a xizachonline
fly certs check play.example.com -a xizachonline
```

Keep the DNS record unproxied while issuing the first certificate if a CDN such as Cloudflare interferes with validation. Fly Proxy terminates TLS and `force_https = true` redirects HTTP traffic to HTTPS.

Because Socket.IO uses the same origin, a custom domain does not require `NEXT_PUBLIC_SOCKET_URL`. If that variable was previously set to the `.fly.dev` URL, rebuild with it empty to avoid cross-origin WebSocket connections.

## 9. Deploying updates safely

Run local validation first:

```powershell
npm ci
npm run lint
npx tsc --noEmit
npm run build
docker build -t pangames:local .
docker run --rm -p 3000:3000 pangames:local
```

Open `http://localhost:3000`, stop the local container, then deploy with the build arguments from section 5.

Any Fly deployment or secret change restarts the Machine and clears active rooms. Deploy when no match is in progress. After deployment:

```powershell
fly releases -a xizachonline
fly logs -a xizachonline
fly checks list -a xizachonline
```

If a release is unhealthy, inspect its logs before rolling back:

```powershell
fly releases rollback -a xizachonline
```

## 10. Current limitations

- Active rooms do not survive a Machine restart or deployment.
- Horizontal scaling is unsafe until room state, timers, and Socket.IO coordination use shared infrastructure such as Redis plus persistent storage.
- A Fly Volume does not solve multi-Machine synchronization and is therefore intentionally not configured.
- Secrets are runtime values; public browser variables must also be supplied at Docker build time.
