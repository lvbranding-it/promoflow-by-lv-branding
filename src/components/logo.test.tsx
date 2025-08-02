import { render, screen } from '@testing-library/react';
import { Logo } from './logo';
import React from 'react';

describe('Logo', () => {
  it('renders the SVG logo', () => {
    render(<Logo aria-label="Company Logo" />);
    const logoElement = screen.getByLabelText('Company Logo');
    expect(logoElement).toBeInTheDocument();
    expect(logoElement.tagName).toBe('svg');
  });
});