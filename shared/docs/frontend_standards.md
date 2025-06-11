# *Are-u-Queryous?* - Frontend Standards & Best Practices

## Introduction

This document explains the technical aspects of AUQ, a web application that helps users analyze and understand urban quality in different cities. The application uses modern web technologies to create an interactive and user-friendly experience.

## Project Structure

The project is built using Next.js, a popular React framework. Here's how we organized the code:

1. **Pages and Routes**
   - The `app` folder contains all the main pages of our application
   - Each page is a React component that shows different views
   - We use Next.js routing to move between pages

2. **Components**
   - The `components` folder holds all reusable parts of our application
   - We have two types of components:
     - UI components (in the `ui` folder): Basic elements like buttons and inputs
     - Feature components: Complex parts like maps and charts

3. **State Management**
   - We use React Context to manage global state
   - The `contexts` folder contains:
     - `auth-context.tsx`: Handles user authentication
     - `map-context.tsx`: Manages map data and settings

4. **Custom Hooks**
   - The `hooks` folder contains reusable logic
   - We have hooks for:
     - Mobile detection (`use-mobile.tsx`)
     - Toast notifications (`use-toast.ts`)

## Key Features

1. **Map Integration**
   - We use Leaflet.js for interactive maps
   - The map shows different layers of urban data
   - Users can zoom, pan, and select areas

2. **Data Visualization**
   - Charts show urban quality metrics
   - We compare different districts
   - Data is presented in an easy-to-understand way

3. **User Interface**
   - Clean and modern design
   - Responsive layout works on all devices
   - Dark and light themes

4. **Authentication**
   - Secure user login system
   - Different access levels for users
   - Protected routes for admin features

## Technical Implementation

1. **Component Structure**
   - Each component is a TypeScript file (`.tsx`)
   - Components are small and focused
   - We use props to pass data between components

2. **State Management**
   - Context API for global state
   - Local state for component-specific data
   - Clean data flow between components

3. **Styling**
   - Tailwind CSS for styling
   - Responsive design patterns
   - Consistent theme across the application

4. **Performance**
   - Optimized rendering
   - Lazy loading for heavy components
   - Efficient data fetching

## Development Tools

- TypeScript for type safety
- Next.js for routing and server-side features
- Tailwind CSS for styling
- React for building the user interface

## License & Ownership

All code and scripts in this repository are released under the [MIT License](../LICENSE).  
You are free to use, modify, and distribute them with proper attribution.
