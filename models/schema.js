import { relations } from 'drizzle-orm';
import { integer, pgTable, varchar, text } from 'drizzle-orm/pg-core';

export const rncLocus = pgTable('rnc_locus', {
  id: integer('id').primaryKey(),
  assemblyId: varchar('assembly_id', { length: 255 }),
  locusName: text('locus_name'),
  publicLocusName: varchar('public_locus_name', { length: 255 }),
  chromosome: varchar('chromosome', { length: 255 }),
  strand: varchar('strand', { length: 255 }),
  locusStart: integer('locus_start'),
  locusStop: integer('locus_stop'),
  memberCount: integer('member_count'),
});

export const rncLocusRelations = relations(rncLocus, ({ many }) => ({
  members: many(rncLocusMembers),
}));

export const rncLocusMembers = pgTable('rnc_locus_members', {
  locusMemberId: integer('id').primaryKey(),
  regionId: integer('region_id'),
  locusId: integer('locus_id').references(() => rncLocus.id),
  membershipStatus: varchar('membership_status', { length: 255 }),
});

export const rncLocusMembersRelations = relations(rncLocusMembers, ({ one }) => ({
  locus: one(rncLocus, {
    fields: [rncLocusMembers.locusId],
    references: [rncLocus.id],
  }),
}));
