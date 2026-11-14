import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from '@/components/ui/Textarea'

describe('Textarea Component', () => {
  it('renders textarea field', () => {
    render(<Textarea />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Textarea label="Comments" name="comments" />)
    expect(screen.getByLabelText(/comments/i)).toBeInTheDocument()
  })

  it('shows required asterisk when required prop is true', () => {
    render(<Textarea label="Notes" name="notes" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('displays error message', () => {
    render(<Textarea label="Notes" name="notes" error="Notes are required" />)
    expect(screen.getByText('Notes are required')).toBeInTheDocument()
  })

  it('displays helper text when no error', () => {
    render(<Textarea label="Notes" name="notes" helperText="Max 500 characters" />)
    expect(screen.getByText('Max 500 characters')).toBeInTheDocument()
  })

  it('sets correct number of rows', () => {
    render(<Textarea rows={5} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5')
  })

  it('defaults to 3 rows when not specified', () => {
    render(<Textarea />)
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '3')
  })

  it('updates value on change', async () => {
    render(<Textarea name="text" />)
    const textarea = screen.getByRole('textbox')
    
    await userEvent.type(textarea, 'multi\nline\ntext')
    expect(textarea).toHaveValue('multi\nline\ntext')
  })

  it('disables textarea when disabled prop is true', () => {
    render(<Textarea disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('renders with placeholder', () => {
    render(<Textarea placeholder="Enter notes" />)
    expect(screen.getByPlaceholderText('Enter notes')).toBeInTheDocument()
  })
})
