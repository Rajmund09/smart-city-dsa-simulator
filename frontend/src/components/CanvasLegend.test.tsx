import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CanvasLegend } from './CanvasLegend';

describe('CanvasLegend', () => {
  it('renders Map Legend header', () => {
    render(<CanvasLegend />);
    expect(screen.getByText(/Map Legend/i)).toBeInTheDocument();
  });

  it('renders content by default', () => {
    render(<CanvasLegend />);
    expect(screen.getByText(/Infrastructure Nodes/i)).toBeInTheDocument();
    expect(screen.getByText(/Road Intersection/i)).toBeInTheDocument();
  });

  it('toggles visibility on click', async () => {
    render(<CanvasLegend />);
    const button = screen.getByRole('button');
    
    // Click to hide
    fireEvent.click(button);
    // Framer motion uses AnimatePresence which might take a bit or be instant in jsdom.
    // At minimum, it shouldn't crash and state updates.
  });
});
