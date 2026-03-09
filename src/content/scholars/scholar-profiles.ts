import type { TeacherConfig } from '@/content/levels/types';

export type TeacherProfile = Omit<TeacherConfig, 'coords'>;

export const TEACHER_PROFILES = {
    'abdullah-ibn-yusuf': {
        city: 'Damascus',
        hadith: 'Athar teaching paraphrase: the chain is protected by trustworthy transmitters, careful memory, and disciplined review.',
        hadithSource: 'Athar authored teaching paraphrase for the Hijaz chapter',
        historicalNote:
            'Abdullah ibn Yusuf appears in the early Bukhari teaching chain and anchors the middle leg of the Hijaz route in this build.',
        id: 'abdullah-ibn-yusuf',
        name: 'Abdullah ibn Yusuf',
        title: 'Transmitter of Damascus',
    },
    'abu-asim-al-nabil': {
        city: 'Basra',
        hadith: 'Placeholder teaching excerpt: discipline in learning lets the seeker carry wisdom across great distances.',
        hadithSource: 'Placeholder source note for development build',
        historicalNote:
            'This profile exists now so later levels can be added without changing the shared teacher model.',
        id: 'abu-asim-al-nabil',
        name: "Abu 'Asim al-Nabil",
        title: 'Scholar of Basra',
    },
    'ahmad-ibn-hanbal': {
        city: 'Baghdad',
        hadith: 'Placeholder teaching excerpt: sincerity and endurance protect knowledge when pressure surrounds the seeker.',
        hadithSource: 'Placeholder source note for development build',
        historicalNote:
            'Future Baghdad encounters use this teacher to increase narrative stakes and challenge density.',
        id: 'ahmad-ibn-hanbal',
        name: 'Ahmad ibn Hanbal',
        title: 'Scholar of Baghdad',
    },
    'ali-ibn-al-madini': {
        city: 'Madinah',
        hadith: 'Athar teaching paraphrase: the strongest collector tests narrators closely and refuses to let subtle defects pass unnoticed.',
        hadithSource: 'Athar authored teaching paraphrase for the Hijaz chapter',
        historicalNote:
            'Ali ibn al-Madini is presented here as the culminating scholar of the Hijaz chapter, emphasizing hadith criticism and transmission discipline.',
        id: 'ali-ibn-al-madini',
        name: 'Ali ibn al-Madini',
        title: 'Critical Hadith Scholar',
    },
    'ibn-abi-uways': {
        city: 'Makkah',
        hadith: 'Athar teaching paraphrase: endurance in study matters because reliable knowledge is gathered in stages, not in a single sitting.',
        hadithSource: 'Athar authored teaching paraphrase for the Hijaz chapter',
        historicalNote:
            'Ibn Abi Uways now serves as the opening teacher of the Hijaz chapter and introduces the player to repeated banking of hadith before the northern route.',
        id: 'ibn-abi-uways',
        name: 'Ibn Abi Uways',
        title: 'Teacher of the Hijaz',
    },
    'ishaq-ibn-rahwayh': {
        city: 'Nishapur',
        hadith: 'Placeholder teaching excerpt: the best collections arise from patience, comparison, and revision.',
        hadithSource: 'Placeholder source note for development build',
        historicalNote: 'This teacher anchors the eastern Persian leg of the journey.',
        id: 'ishaq-ibn-rahwayh',
        name: 'Ishaq ibn Rahwayh',
        title: 'Teacher of Nishapur',
    },
    'makki-ibn-ibrahim': {
        city: 'Balkh',
        hadith: 'Placeholder teaching excerpt: sincere intention gives a journey its meaning and transforms travel into worship.',
        hadithSource: 'Placeholder source note for development build',
        historicalNote:
            'Makki ibn Ibrahim represents the first major transmitter in this route and anchors the opening scholarly encounter.',
        id: 'makki-ibn-ibrahim',
        name: 'Makki ibn Ibrahim',
        title: 'Master of Balkh',
    },
    'muhammad-ibn-yusuf-al-firyabi': {
        city: 'Caesarea',
        hadith: 'Placeholder teaching excerpt: careful collection serves entire communities, not just the traveler.',
        hadithSource: 'Placeholder source note for development build',
        historicalNote: 'This future-level teacher supports the final Levant and Egypt route.',
        id: 'muhammad-ibn-yusuf-al-firyabi',
        name: 'Muhammad ibn Yusuf al-Firyabi',
        title: 'Scholar of Caesarea',
    },
    'yahya-ibn-main': {
        city: 'Baghdad',
        hadith: 'Placeholder teaching excerpt: good judgment in narrators is part of preserving the tradition.',
        hadithSource: 'Placeholder source note for development build',
        historicalNote: 'This future-level teacher broadens the Baghdad scholar circuit.',
        id: 'yahya-ibn-main',
        name: "Yahya ibn Ma'in",
        title: 'Hadith Critic of Baghdad',
    },
} as const satisfies Record<string, TeacherProfile>;

export type TeacherProfileId = keyof typeof TEACHER_PROFILES;

export const getTeacherProfile = (teacherId: TeacherProfileId): TeacherProfile => TEACHER_PROFILES[teacherId];
