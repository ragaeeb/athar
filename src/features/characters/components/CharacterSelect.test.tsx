import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CHARACTER_CONFIGS } from '@/content/characters/characters';
import { CharacterSelect } from '@/features/characters/components/CharacterSelect';

describe('CharacterSelect', () => {
    it('renders all scholar options and marks the selected one as pressed', () => {
        render(<CharacterSelect value="bukhari" onChange={vi.fn()} />);

        const optionButtons = screen.getAllByRole('button');
        expect(optionButtons).toHaveLength(Object.keys(CHARACTER_CONFIGS).length);
        expect(screen.getByRole('button', { name: /al-bukhari/i })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: /muslim b\. al-hajjaj/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /abu dawud al-sijistani/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /abu isa al-tirmidhi/i })).toBeInTheDocument();
    });

    it('emits the selected scholar id', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<CharacterSelect value="bukhari" onChange={onChange} />);

        await user.click(screen.getByRole('button', { name: /abu dawud al-sijistani/i }));

        expect(onChange).toHaveBeenCalledWith('abu-dawud');
    });

    it('does not emit a change when the already-selected scholar is clicked', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<CharacterSelect value="bukhari" onChange={onChange} />);

        await user.click(screen.getByRole('button', { name: /al-bukhari/i }));

        expect(onChange).not.toHaveBeenCalled();
    });
});
