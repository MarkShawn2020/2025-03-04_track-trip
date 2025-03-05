# VTrip

<h1 align="center">VTrip - Visualize Your Trip</h1>

<p align="center">
  A modern web application for visualizing your travel trajectories with style
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#development"><strong>Development</strong></a> ·
  <a href="#structure"><strong>Structure</strong></a>
</p>

## Features

- 🗺️ Interactive Map Visualization
  - Beautiful map rendering with AMap (Gaode Maps)
  - Travel route path visualization
  - City markers with information windows
  - Transportation mode indicators

- 🎨 Modern UI/UX
  - Clean and intuitive interface
  - Responsive design
  - Dark mode support
  - Timeline visualization

- 📝 Travel Input
  - Easy city list input
  - Date selection
  - Transportation mode selection
  - Notes and descriptions

- 🛠️ Technical Stack
  - Next.js 14 App Router
  - Tailwind CSS
  - Shadcn/UI
  - AMap (Gaode Maps) for visualization
  - TypeScript

## Development

1. Clone the repository
```bash
git clone https://github.com/markshawn2020/vtrip.git
cd vtrip
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
# Create a .env.local file with your AMap API key
echo "NEXT_PUBLIC_AMAP_API_KEY=your_amap_key_here" > .env.local
```

4. Start development server
```bash
pnpm dev
```

## Project Structure

```
.
├── app/                # Next.js App Router
│   ├── api/           # API routes
│   │   └── geocode/   # Geocoding API endpoint
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Main page with map and timeline
├── components/        
│   ├── travel/       # Travel related components
│   │   ├── MapPlaceholder.tsx  # AMap visualization
│   │   ├── TravelInput.tsx     # Input form for travel points
│   │   ├── TravelList.tsx      # Timeline visualization
│   │   └── types.ts            # Type definitions
│   └── ui/           # Shared UI components
├── utils/            # Utility functions
│   └── amap.ts       # AMap helper functions
└── public/           # Static assets
```

## License

MIT License © 2025 [VTrip](https://github.com/markshawn2020)
