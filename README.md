# Spotify Analytics

A web application that analyzes your Spotify listening history by identifying your annual "Your Top Songs" playlists and calculating which songs were most popular across multiple years based on frequency of appearance and ranking position.

## Features

- 🔐 **Spotify OAuth Integration** - Secure authentication with Spotify
- 📊 **Smart Analysis** - Advanced scoring algorithm considering frequency and ranking
- 📱 **Mobile-First Design** - Optimized for mobile and tablet use
- 🎵 **Cross-Year Comparison** - Find songs that appear in multiple years
- ⚡ **Fast Performance** - Built with Next.js 14 and optimized for speed

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Authentication**: NextAuth.js with Spotify provider
- **Spotify API**: Official Spotify Web API SDK
- **State Management**: Zustand (lightweight)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Spotify Developer Account

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd spotify-analytics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Spotify Developer App**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Add `http://localhost:3000/api/auth/callback/spotify` to Redirect URIs
   - Copy your Client ID and Client Secret

4. **Environment Variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your Spotify credentials:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-random-secret-key
   SPOTIFY_CLIENT_ID=your-spotify-client-id
   SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How It Works

1. **Authentication**: Users connect their Spotify account via OAuth
2. **Playlist Discovery**: The app searches for "Your Top Songs" playlists from different years
3. **Data Analysis**: For each song found, it calculates a popularity score based on:
   - Number of years the song appeared
   - Average ranking position across years
   - Consistency bonus for multiple appearances
4. **Results Display**: Songs are ranked by popularity score with detailed statistics

## Algorithm

The popularity score is calculated using this formula:
```
score = (number of years appeared) * weight1 + (sum of (max_rank - rank_in_year)) * weight2
```

Where:
- `weight1 = 100` (importance of appearing in multiple years)
- `weight2 = 1` (importance of ranking position)

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components
├── lib/                  # Utility libraries
│   ├── analysis.ts       # Analysis algorithms
│   ├── auth.ts           # NextAuth configuration
│   ├── spotify.ts        # Spotify API client
│   └── utils.ts          # Utility functions
└── docs/                 # Documentation
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Cloudflare Pages
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

If you encounter any issues or have questions, please open an issue on GitHub. 