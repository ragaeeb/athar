import type { TeacherConfig } from '@/content/levels/types';

export type TeacherProfile = Omit<TeacherConfig, 'coords'>;

export const TEACHER_PROFILES = {
    'abdullah-ibn-yusuf': {
        city: 'Damascus',
        hadith: 'Athar teaching paraphrase: the chain is protected by trustworthy transmitters, careful memory, and disciplined review.',
        hadithSource:
            'Athar authored teaching paraphrase inspired by transmitter-discipline themes associated with Abdullah ibn Yusuf.',
        historicalNote:
            'Abdullah ibn Yusuf al-Tinnisi appears in transmission chains used by al-Bukhari and is associated in the biographical tradition with Damascus.',
        id: 'abdullah-ibn-yusuf',
        name: 'Abdullah ibn Yusuf',
        title: 'Transmitter of Damascus',
    },
    'abu-asim-al-nabil': {
        city: 'Basra',
        hadith: 'Athar teaching paraphrase: the seeker protects knowledge by repeating it carefully, comparing what is heard, and refusing haste in transmission.',
        hadithSource:
            "Athar authored teaching paraphrase inspired by Basran transmission-discipline themes associated with Abu 'Asim al-Nabil.",
        historicalNote:
            "Abu 'Asim al-Nabil appears in Basran hadith networks and is remembered as a reliable transmitter whose teaching represents disciplined preservation rather than dramatic rhetoric.",
        id: 'abu-asim-al-nabil',
        name: "Abu 'Asim al-Nabil",
        title: 'Scholar of Basra',
    },
    'ahmad-ibn-hanbal': {
        city: 'Baghdad',
        hadith: 'Athar teaching paraphrase: sincerity and patience matter because knowledge survives pressure only when the collector refuses shortcuts under trial.',
        hadithSource:
            'Athar authored teaching paraphrase inspired by endurance, integrity, and transmission themes associated with Ahmad ibn Hanbal.',
        historicalNote:
            'Ahmad ibn Hanbal stands in the biographical tradition as a major Baghdad authority whose legacy is tied to endurance, scruple, and loyalty to transmitted reports.',
        id: 'ahmad-ibn-hanbal',
        name: 'Ahmad ibn Hanbal',
        title: 'Scholar of Baghdad',
    },
    'ali-ibn-al-madini': {
        city: 'Madinah',
        hadith: 'Athar teaching paraphrase: the strongest collector tests narrators closely and refuses to let subtle defects pass unnoticed.',
        hadithSource:
            'Athar authored teaching paraphrase inspired by narrator-criticism themes associated with Ali ibn al-Madini.',
        historicalNote:
            'Ali ibn al-Madini is widely remembered for rigorous narrator criticism and for shaping later hadith evaluation through his teaching and example.',
        id: 'ali-ibn-al-madini',
        name: 'Ali ibn al-Madini',
        title: 'Critical Hadith Scholar',
    },
    'ibn-abi-uways': {
        city: 'Makkah',
        hadith: 'Athar teaching paraphrase: endurance in study matters because reliable knowledge is gathered in stages, not in a single sitting.',
        hadithSource:
            'Athar authored teaching paraphrase inspired by long-form study and transmission themes associated with Ibn Abi Uways.',
        historicalNote:
            'Ibn Abi Uways appears in later hadith transmission networks and is associated here with patient study and careful preservation.',
        id: 'ibn-abi-uways',
        name: 'Ibn Abi Uways',
        title: 'Teacher of the Hijaz',
    },
    'ishaq-ibn-rahwayh': {
        city: 'Nishapur',
        hadith: 'Athar teaching paraphrase: the strongest collection is built through comparison, revision, and the courage to reject what does not hold together.',
        hadithSource:
            'Athar authored teaching paraphrase inspired by comparison and revision themes associated with Ishaq ibn Rahwayh.',
        historicalNote:
            'Ishaq ibn Rahwayh is closely associated with Khurasan and Nishapur in the scholarly tradition and is remembered as a major teacher in the world that shaped later hadith criticism.',
        id: 'ishaq-ibn-rahwayh',
        name: 'Ishaq ibn Rahwayh',
        title: 'Teacher of Nishapur',
    },
    'makki-ibn-ibrahim': {
        city: 'Balkh',
        hadith: 'Athar teaching paraphrase: intention gives the journey its weight, because travel without sincerity gathers fatigue but not lasting knowledge.',
        hadithSource:
            'Athar authored teaching paraphrase inspired by intention and disciplined travel themes associated with Makki ibn Ibrahim.',
        historicalNote:
            'Makki ibn Ibrahim is associated with Balkh in the biographical tradition and appears in early transmission networks linked to al-Bukhari.',
        id: 'makki-ibn-ibrahim',
        name: 'Makki ibn Ibrahim',
        title: 'Master of Balkh',
    },
    'muhammad-ibn-yusuf-al-firyabi': {
        city: 'Caesarea',
        hadith: 'Athar teaching paraphrase: careful collection serves the whole community, because a preserved report reaches far beyond the life of the traveler who first carried it.',
        hadithSource:
            'Athar authored teaching paraphrase inspired by preservation and public transmission themes associated with Muhammad ibn Yusuf al-Firyabi.',
        historicalNote:
            'Muhammad ibn Yusuf al-Firyabi belongs to the Levantine transmission world and is remembered for preserving reports that traveled beyond a single city through wider scholarly networks.',
        id: 'muhammad-ibn-yusuf-al-firyabi',
        name: 'Muhammad ibn Yusuf al-Firyabi',
        title: 'Scholar of Caesarea',
    },
    'yahya-ibn-main': {
        city: 'Baghdad',
        hadith: 'Athar teaching paraphrase: preserving the tradition requires judgment about narrators, because knowing who carries a report is part of knowing what can be trusted.',
        hadithSource:
            "Athar authored teaching paraphrase inspired by narrator-evaluation themes associated with Yahya ibn Ma'in.",
        historicalNote:
            "Yahya ibn Ma'in is widely remembered as one of the major critics of narrators in the Baghdad scholarly world and stands here for disciplined scrutiny within the chain.",
        id: 'yahya-ibn-main',
        name: "Yahya ibn Ma'in",
        title: 'Hadith Critic of Baghdad',
    },
} as const satisfies Record<string, TeacherProfile>;

export type TeacherProfileId = keyof typeof TEACHER_PROFILES;

export const getTeacherProfile = (teacherId: TeacherProfileId): TeacherProfile => TEACHER_PROFILES[teacherId];
