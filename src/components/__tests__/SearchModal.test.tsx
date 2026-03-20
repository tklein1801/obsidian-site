import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchModal from '../SearchModal';
import type { SearchEntry } from '../../lib/vault';

const sampleData: SearchEntry[] = [
  { slug: 'react-hooks', title: 'React Hooks', tags: ['react', 'javascript'], content: 'useState useEffect', excerpt: '' },
  { slug: 'python-basics', title: 'Python Basics', tags: ['python'], content: 'variables functions', excerpt: '' },
  { slug: 'typescript-guide', title: 'TypeScript Guide', tags: ['typescript'], content: 'interfaces generics', excerpt: '' },
];

async function openModal() {
  await act(async () => {
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
  });
}

describe('SearchModal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('does not render when closed', () => {
    render(<SearchModal searchData={sampleData} />);
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('opens on Cmd+K', async () => {
    render(<SearchModal searchData={sampleData} />);
    await openModal();
    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument());
  });

  it('opens on Ctrl+K', async () => {
    render(<SearchModal searchData={sampleData} />);
    await act(async () => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument());
  });

  it('closes on Escape', async () => {
    render(<SearchModal searchData={sampleData} />);
    await openModal();
    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument());
    await act(async () => { fireEvent.keyDown(document, { key: 'Escape' }); });
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
  });

  it('opens when open-search custom event is dispatched', async () => {
    render(<SearchModal searchData={sampleData} />);
    await act(async () => {
      document.dispatchEvent(new CustomEvent('open-search', { detail: {} }));
    });
    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument());
  });

  it('pre-fills query from open-search event detail', async () => {
    render(<SearchModal searchData={sampleData} />);
    await act(async () => {
      document.dispatchEvent(new CustomEvent('open-search', { detail: { query: '#react' } }));
    });
    await waitFor(() => {
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('#react');
    });
  });

  it('shows results when typing a query', async () => {
    const user = userEvent.setup();
    render(<SearchModal searchData={sampleData} />);
    await openModal();
    await user.type(screen.getByRole('textbox'), 'react');
    // title may be split by <mark> highlight tags — use regex on container text
    await waitFor(() =>
      expect(screen.getByText((_, el) => !!el && el.textContent === 'React Hooks')).toBeInTheDocument()
    );
  });

  it('shows no-results message when no matches', async () => {
    const user = userEvent.setup();
    render(<SearchModal searchData={sampleData} />);
    await openModal();
    await user.type(screen.getByRole('textbox'), 'xyznotfound');
    await waitFor(() => expect(screen.getByText(/no results/i)).toBeInTheDocument());
  });

  it('clears query with ✕ button', async () => {
    const user = userEvent.setup();
    render(<SearchModal searchData={sampleData} />);
    await openModal();
    await user.type(screen.getByRole('textbox'), 'react');
    await waitFor(() => expect(screen.getByText('✕')).toBeInTheDocument());
    await user.click(screen.getByText('✕'));
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
  });

  it('shows total indexed notes count in footer', async () => {
    render(<SearchModal searchData={sampleData} />);
    await openModal();
    await waitFor(() =>
      expect(screen.getByText(`${sampleData.length} notes indexed`)).toBeInTheDocument()
    );
  });

  it('shows tag chips for tag: query', async () => {
    const user = userEvent.setup();
    render(<SearchModal searchData={sampleData} />);
    await openModal();
    await user.type(screen.getByRole('textbox'), 'tag:react');
    // The chip label inside the input area (span, not inside a result row)
    await waitFor(() => {
      const chips = screen.getAllByText('#react');
      expect(chips.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows search hint in empty state', async () => {
    render(<SearchModal searchData={sampleData} />);
    await openModal();
    await waitFor(() => expect(screen.getByText(/tag:name/)).toBeInTheDocument());
  });

  it('filters results by tag: operator', async () => {
    const user = userEvent.setup();
    render(<SearchModal searchData={sampleData} />);
    await openModal();
    await user.type(screen.getByRole('textbox'), 'tag:python');
    await waitFor(() => expect(screen.getByText('Python Basics')).toBeInTheDocument());
    expect(screen.queryByText('React Hooks')).toBeNull();
  });
});
