import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadForm } from './UploadForm';

// Mock components that we don't need to deeply render
vi.mock('@/components/GeminiCameraModal', () => ({
  AICameraModal: () => <div data-testid="ai-camera-modal" />
}));

describe('UploadForm', () => {
  const mockOnBarcodeDetected = vi.fn();
  const mockOnOpenCamera = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(
      <UploadForm 
        onBarcodeDetected={mockOnBarcodeDetected} 
        isLoading={false} 
        onOpenCamera={mockOnOpenCamera} 
      />
    );
    
    expect(screen.getByText('Scan Product')).toBeInTheDocument();
    expect(screen.getByText('Live Scan')).toBeInTheDocument();
    expect(screen.getByText('AI Food Scan')).toBeInTheDocument();
    expect(screen.getByLabelText('Enter barcode manually')).toBeInTheDocument();
  });

  it('handles manual barcode submission correctly', async () => {
    render(
      <UploadForm 
        onBarcodeDetected={mockOnBarcodeDetected} 
        isLoading={false} 
        onOpenCamera={mockOnOpenCamera} 
      />
    );

    const input = screen.getByLabelText('Enter barcode manually');
    const submitBtn = screen.getByRole('button', { name: 'Scan' });

    await userEvent.type(input, '123456789');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnBarcodeDetected).toHaveBeenCalledWith('123456789');
    });
  });

  it('disables inputs when isLoading is true', () => {
    render(
      <UploadForm 
        onBarcodeDetected={mockOnBarcodeDetected} 
        isLoading={true} 
        onOpenCamera={mockOnOpenCamera} 
      />
    );

    const input = screen.getByLabelText('Enter barcode manually');
    expect(input).toBeDisabled();
    
    const liveScanBtn = screen.getByText('Live Scan').closest('button');
    expect(liveScanBtn).toBeDisabled();
  });
});
