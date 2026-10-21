import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock API calls made by Main on mount so the test does not hit the network
jest.mock('./api/main', () => ({
  getTree: jest.fn(() => Promise.resolve([]),
  generate: jest.fn(() => Promise.resolve('')),
  saveTree: jest.fn(() => Promise.resolve({})),
}));

test('renders the app without crashing', () => {
  render(<App />);
  expect(screen.getByText(/Add root element/i)).toBeInTheDocument();
  expect(screen.getByText(/Generate/i)).toBeInTheDocument();
});
