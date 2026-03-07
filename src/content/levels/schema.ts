import { z } from 'zod';
import { AUDIO_ASSETS } from '@/content/audio/cues';
import type { LevelConfig } from '@/content/levels/types';

const coordsSchema = z.object({
    lat: z.number().finite().min(-90).max(90),
    lng: z.number().finite().min(-180).max(180),
});

const initialViewSchema = z.object({
    bearing: z.number().finite(),
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    pitch: z.number().finite().min(0).max(85),
    zoom: z.number().finite().min(0),
});

const lightingSchema = z.object({
    hour: z.number().int().min(0).max(23),
    label: z.string().min(1),
    minute: z.number().int().min(0).max(59),
});

const teacherSchema = z.object({
    city: z.string().min(1),
    coords: coordsSchema,
    hadith: z.string().min(1),
    hadithSource: z.string().min(1),
    historicalNote: z.string().min(1),
    id: z.string().min(1),
    name: z.string().min(1),
    title: z.string().min(1),
});

const obstacleSchema = z.object({
    coords: coordsSchema,
    id: z.string().min(1),
    label: z.string().min(1),
    patrolRadius: z.number().finite().positive().optional(),
    radius: z.number().finite().positive().optional(),
    type: z.enum(['viper', 'sandstorm', 'guard', 'flood', 'rival']),
});

const milestoneSchema = z.object({
    buildingType: z.enum(['mosque', 'madrasa', 'caravanserai', 'minaret', 'market']),
    coords: coordsSchema,
    id: z.string().min(1),
    label: z.string().min(1),
    missionText: z.string().min(1),
});

const tokenClusterSchema = z.object({
    center: coordsSchema,
    count: z.number().int().positive(),
    id: z.string().min(1),
    label: z.string().min(1),
    radius: z.number().finite().positive(),
});

const namedAreaSchema = z.object({
    coords: coordsSchema,
    id: z.string().min(1),
    label: z.string().min(1),
});

const winConditionSchema = z.object({
    finalMilestone: z.string().min(1),
    requiredHadith: z.number().int().nonnegative(),
    requiredTeachers: z.array(z.string().min(1)),
});

const mapStyleSchema = z.union([z.string().min(1), z.record(z.string(), z.unknown())]);

const audioCueSchema = z.enum(
    Object.keys(AUDIO_ASSETS) as [keyof typeof AUDIO_ASSETS, ...Array<keyof typeof AUDIO_ASSETS>],
);

export const levelConfigSchema = z
    .object({
        ambientCue: audioCueSchema,
        completionNarration: z.string().min(1),
        hadithTokenClusters: z.array(tokenClusterSchema),
        historicalNote: z.string().min(1),
        id: z.string().min(1),
        initialView: initialViewSchema,
        lighting: lightingSchema,
        mapStyle: mapStyleSchema,
        milestones: z.array(milestoneSchema).min(1),
        name: z.string().min(1),
        namedAreas: z.array(namedAreaSchema),
        narrative: z.string().min(1),
        obstacles: z.array(obstacleSchema),
        order: z.number().int().positive(),
        origin: coordsSchema,
        playable: z.boolean(),
        subtitle: z.string().min(1),
        teachers: z.array(teacherSchema),
        teaser: z.string().min(1),
        winCondition: winConditionSchema,
    })
    .superRefine((config, context) => {
        const teacherIds = new Set(config.teachers.map((teacher) => teacher.id));
        const milestoneIds = new Set(config.milestones.map((milestone) => milestone.id));

        for (const teacherId of config.winCondition.requiredTeachers) {
            if (!teacherIds.has(teacherId)) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Missing required teacher "${teacherId}" in teachers[]`,
                    path: ['winCondition', 'requiredTeachers'],
                });
            }
        }

        if (!milestoneIds.has(config.winCondition.finalMilestone)) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Missing final milestone "${config.winCondition.finalMilestone}" in milestones[]`,
                path: ['winCondition', 'finalMilestone'],
            });
        }
    });

export const parseLevelConfig = (config: unknown): LevelConfig => levelConfigSchema.parse(config) as LevelConfig;
