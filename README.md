## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

to create a user run this in the terminal:

```bash
curl -i -X POST "http://localhost:4000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"StrongPass123"}'

```

## What This Boilerplate Does NOT Include (Yet)

Refresh tokens

OAuth / social login

CSRF protection

Chat persistence

Streaming responses

Rate limiting
