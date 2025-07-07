# Dashboard Kartódromo - Sistema Completo

This is a kart rental management system built with [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/) using [Vite](https://vitejs.dev/) as the frontend build tool and [Convex](https://convex.dev) as its backend.

This project is connected to the Convex deployment named [`small-goat-605`](https://dashboard.convex.dev/d/small-goat-605).

## Project Structure

- **Frontend**: The code is in the `src` directory and is built with [Vite](https://vitejs.dev/)
- **Backend**: The code is in the `convex` directory
- **Path Aliases**: `@` is configured as an alias for the `src` directory

## Running the Application

```bash
# Install dependencies
npm install

# Start development servers (frontend and backend)
npm run dev
```

This will start both the Vite development server for the frontend and the Convex backend server.

## Features

The kart rental system includes management for:
- Bookings
- Karts
- Pilots
- Race sessions
- Lap times
- Categories
- Time slots
- Transactions
- Check-ins
- Rankings

## App Authentication

The application uses [Convex Auth](https://auth.convex.dev/) for authentication.

## Development and Deployment

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex:
* [Overview](https://docs.convex.dev/understanding/) for beginners
* [Hosting and Deployment](https://docs.convex.dev/production/) for deployment instructions
* [Best Practices](https://docs.convex.dev/understanding/best-practices/) for optimization tips

## HTTP API

User-defined HTTP routes are defined in the `convex/router.ts` file.
