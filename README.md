# Wardrobe 3D Designer

A powerful web application for designing custom wardrobes in 3D. This tool allows users to create, customize, and visualize wardrobe designs before purchasing.

## Features

- **3D Visualization**: Real-time 3D rendering of your wardrobe design
- **Customizable Dimensions**: Adjust width, height, and depth to fit your space
- **Multiple Wardrobe Types**: Standard, corner, sliding, and walk-in options
- **Component Library**: Add shelves, drawers, rails, dividers, and specialized storage
- **Material Selection**: Choose from various materials and finishes
- **Price Calculation**: Get instant price estimates as you design
- **Wardrobe Templates**: Start with pre-designed templates for quick inspiration
- **Save & Load Designs**: Export your designs as JSON files and import them later

## Wardrobe Templates

The application currently offers one carefully designed wardrobe template to help users get started quickly:

- **Minimalist Wardrobe**: A clean, simple design with essential storage for a minimalist lifestyle. Features a hanging rail, multiple shelves, drawers, and a center divider for optimal organization.

To use the template:
1. Click the "Browse Wardrobe Templates" button at the top of the control panel
2. Select the Minimalist Wardrobe template
3. Click "Apply Template" to load it into the designer
4. Customize the template further to suit your specific requirements

More templates will be added in future updates.

## Save and Load Designs

The application allows you to save your designs and load them later:

### Saving a Design
1. Create your wardrobe design using the available tools
2. Click the "Save Design" button in the Price Summary section
3. The design will be downloaded as a JSON file to your device
4. The filename will include a unique identifier for easy reference

### Loading a Design
1. Click the "Load Design" button in the Price Summary section
2. Select the previously saved JSON file from your device
3. The saved design will be loaded into the designer
4. You can continue editing the loaded design as needed

## Getting Started

1. Choose a wardrobe type (standard, corner, sliding, or walk-in)
2. Set the dimensions to fit your space
3. Select materials for the body, doors, and handles
4. Add components like shelves, drawers, and rails
5. Adjust the position and size of components as needed
6. View the price estimate and make adjustments as necessary
7. Save your design for future reference

## Technical Details

This application is built with:
- Next.js for the frontend framework
- Three.js for 3D rendering
- Zustand for state management
- Tailwind CSS for styling

## Development

To run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
wardrobe-3d-designer/
├── app/
│   ├── components/
│   │   ├── wardrobe/
│   │   │   ├── WardrobeModel.tsx
│   │   │   └── WardrobeScene.tsx
│   │   ├── ui/
│   │   │   ├── WardrobeTypeSelector.tsx
│   │   │   ├── DimensionsControl.tsx
│   │   │   ├── MaterialSelector.tsx
│   │   │   ├── ComponentsManager.tsx
│   │   │   ├── PriceSummary.tsx
│   │   │   └── TemplateSelector.tsx
│   │   └── WardrobeDesigner.tsx
│   ├── store/
│   │   └── wardrobeStore.ts
│   ├── types/
│   │   └── wardrobe.ts
│   ├── data/
│   │   └── wardrobeTemplates.ts
│   ├── layout.tsx
│   └── page.tsx
├── public/
│   └── images/
│       └── templates/
├── package.json
└── README.md
```

## Future Enhancements

- Additional wardrobe templates
- Export designs as 3D models or blueprints
- Share designs with others
- More wardrobe types and components
- Advanced material options with textures
- Mobile-friendly controls

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Three.js](https://threejs.org/)
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Headless UI](https://headlessui.com/)
