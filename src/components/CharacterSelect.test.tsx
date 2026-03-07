import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CharacterSelect } from '@/components/CharacterSelect';

describe('CharacterSelect', () => {
    it('emits the selected scholar id', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<CharacterSelect value="bukhari" onChange={onChange} />);

        await user.click(screen.getByRole('button', { name: /abu dawud al-sijistani/i }));

        expect(onChange).toHaveBeenCalledWith('abu-dawud');
    });
});
