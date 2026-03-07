import { motion } from 'framer-motion';

import { CHARACTER_CONFIGS, type CharacterType } from '@/lib/constants';

type CharacterSelectProps = {
    value: CharacterType;
    onChange: (value: CharacterType) => void;
};

export const CharacterSelect = ({ value, onChange }: CharacterSelectProps) => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.values(CHARACTER_CONFIGS).map((character) => {
            const selected = character.id === value;
            return (
                <motion.button
                    key={character.id}
                    type="button"
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onChange(character.id)}
                    className={`rounded-[1.75rem] border p-5 text-left transition ${
                        selected
                            ? 'border-gold-400/70 bg-gold-400/10 shadow-[0_0_0_1px_rgba(233,196,106,0.35)]'
                            : 'border-white/10 bg-white/5 hover:border-white/25'
                    }`}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="font-display text-xl text-sand-50">{character.name}</p>
                            <p className="mt-1 text-sm uppercase tracking-[0.25em] text-sand-100/55">
                                {character.title}
                            </p>
                        </div>
                        <span
                            className="inline-flex h-11 w-11 rounded-full border border-white/10"
                            style={{
                                background: `linear-gradient(135deg, ${character.robeColor}, ${character.accentColor})`,
                            }}
                        />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-sand-100/75">{character.description}</p>
                    <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-gold-400">{character.statLabel}</p>
                </motion.button>
            );
        })}
    </div>
);
