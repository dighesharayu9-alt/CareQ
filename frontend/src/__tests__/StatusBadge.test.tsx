import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/StatusBadge';

describe('CareQ Frontend Component Tests', () => {
  it('renders Waiting status badge correctly', () => {
    const { container } = render(<StatusBadge status="WAITING" />);
    expect(container.textContent).toContain('Waiting');
  });

  it('renders Called status badge correctly', () => {
    const { container } = render(<StatusBadge status="CALLED" />);
    expect(container.textContent).toContain('Called Now');
  });

  it('renders Emergency priority badge correctly', () => {
    const { container } = render(<StatusBadge status="CALLED" isEmergency={true} />);
    expect(container.textContent).toContain('Emergency Priority');
  });

  it('renders In Consultation badge correctly', () => {
    const { container } = render(<StatusBadge status="IN_CONSULTATION" />);
    expect(container.textContent).toContain('In Consultation');
  });

  it('renders Completed badge correctly', () => {
    const { container } = render(<StatusBadge status="COMPLETED" />);
    expect(container.textContent).toContain('Completed');
  });
});
