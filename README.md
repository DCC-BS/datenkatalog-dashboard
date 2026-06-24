# Datenkatalog Dashboard

Dashboard for the data catalog (Datenkatalog), built with [Nuxt 4](https://nuxt.com/).

## Prerequisites

- [Bun](https://bun.sh/) `1.2.20` (see the `packageManager` field in `package.json`)
- Node.js `24` (only required for Docker; the runtime image uses it)

## Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `NUXT_PUBLIC_BS_API_KEY` | API key for the data.bs.ch open data portal |
| `NUXT_FEEDBACK_GITHUB_TOKEN` | GitHub token used by the feedback feature |

## Running without Docker

Install dependencies and start the dev server with hot reload:

```bash
bun install
bun run dev
```

The app is available at <http://localhost:3000/datenkatalog-dashboard/>.

To build and run a production preview locally:

```bash
bun run build
bun run preview
```

Optionally pre-download the open data portal datasets into `public/data` (otherwise
the server APIs fetch and cache them on demand):

```bash
bun run data:download
```

## Running with Docker

The `Dockerfile` builds the app and serves it with the Nitro production server on
port `8031`.

Build the image:

```bash
docker build -t datenkatalog-dashboard .
```

Run the container, passing your environment variables and mapping the port:

```bash
docker run --rm -p 8031:8031 --env-file .env datenkatalog-dashboard
```

The app is then available at <http://localhost:8031/datenkatalog-dashboard/>.

> The same image is built and pushed to GitHub Container Registry by the
> `.github/workflows/docker.yml` workflow on pushes to `main` and on tags.
