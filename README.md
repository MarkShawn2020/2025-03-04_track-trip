# Travel Trajectory Visualizer

<h1 align="center">Travel Path Visualization</h1>

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
  - Beautiful map rendering
  - Smooth path animations
  - Custom markers for cities
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
  - Map visualization libraries
  - TypeScript

## Development

1. Clone the repository
```bash
git clone https://github.com/markshawn2020/travel-trajectory.git
cd travel-trajectory
```

2. Install dependencies
```bash
pnpm install
```

3. Start development server
```bash
pnpm dev
```

## Project Structure

```
.
├── app/                # Next.js App Router
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Main page with map
├── components/        
│   ├── map/          # Map related components
│   ├── timeline/     # Timeline visualization
│   └── ui/           # Shared UI components
├── lib/              
│   ├── types/        # TypeScript definitions
│   └── utils/        # Utility functions
└── public/           # Static assets
```

## License

MIT License © 2025 [CS Magic](https://github.com/markshawn2020)
