import { Router } from 'express';
import { and, eq, inArray, asc, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { rncLocus, rncLocusMembers } from '../models/schema.js';
import ensureAuth from '../middlewares/auth.js';

const router = Router();

router.get('/', ensureAuth, async (req, res) => {
  try {
    const {
      id,
      assemblyId,
      regionId,
      membershipStatus,
      sideload,
      page = 1,
      rows = 1000,
      sortBy = 'id',
      sortOrder = 'asc',
    } = req.query;

    const userRole = req.user.role;
    const offset = (Number(page) - 1) * Number(rows);
    const limitedRegionIds = [86118093, 86696489, 88186467];

    const locusSelect = {
      id: rncLocus.id,
      assemblyId: rncLocus.assemblyId,
      locusName: rncLocus.locusName,
      publicLocusName: rncLocus.publicLocusName,
      chromosome: rncLocus.chromosome,
      strand: rncLocus.strand,
      locusStart: rncLocus.locusStart,
      locusStop: rncLocus.locusStop,
      memberCount: rncLocus.memberCount,
    };

    if (userRole === 'admin' && sideload === 'locusMembers') {
      const loci = await db
        .select(locusSelect)
        .from(rncLocus)
        .where(
          and(
            id
              ? inArray(rncLocus.id, Array.isArray(id) ? id.map(Number) : [Number(id)])
              : undefined,
            assemblyId ? eq(rncLocus.assemblyId, String(assemblyId)) : undefined
          )
        )
        .limit(Number(rows))
        .offset(offset)
        .orderBy(sortOrder === 'desc' ? desc(rncLocus[sortBy]) : asc(rncLocus[sortBy]));

      const locusIds = loci.map((l) => l.id);
      const members = await db
        .select({
          id: rncLocusMembers.locusMemberId,
          regionId: rncLocusMembers.regionId,
          locusId: rncLocusMembers.locusId,
          membershipStatus: rncLocusMembers.membershipStatus,
        })
        .from(rncLocusMembers)
        .where(
          and(
            inArray(rncLocusMembers.locusId, locusIds),
            membershipStatus
              ? eq(rncLocusMembers.membershipStatus, String(membershipStatus))
              : undefined,
            regionId
              ? inArray(
                  rncLocusMembers.regionId,
                  Array.isArray(regionId) ? regionId.map(Number) : [Number(regionId)]
                )
              : undefined
          )
        );

      const membersByLocus = members.reduce((acc, member) => {
        if (!acc[member.locusId]) {
          acc[member.locusId] = [];
        }
        acc[member.locusId].push(member);
        return acc;
      }, {});

      const response = loci.map((locus) => ({
        ...locus,
        locusMembers: membersByLocus[locus.id] || [],
      }));

      return res.json(response);
    }

    if (userRole === 'limited') {
      const results = await db
        .select(locusSelect)
        .from(rncLocus)
        .innerJoin(rncLocusMembers, eq(rncLocusMembers.locusId, rncLocus.id))
        .where(
          and(
            id
              ? inArray(rncLocus.id, Array.isArray(id) ? id.map(Number) : [Number(id)])
              : undefined,
            assemblyId ? eq(rncLocus.assemblyId, String(assemblyId)) : undefined,
            inArray(rncLocusMembers.regionId, limitedRegionIds)
          )
        )
        .limit(Number(rows))
        .offset(offset)
        .orderBy(sortOrder === 'desc' ? desc(rncLocus[sortBy]) : asc(rncLocus[sortBy]));

      const uniqueResults = [...new Map(results.map((row) => [row.id, row])).values()];
      return res.json(uniqueResults);
    }

    const query = db.select(locusSelect).from(rncLocus);

    if (regionId || membershipStatus) {
      query.leftJoin(rncLocusMembers, eq(rncLocusMembers.locusId, rncLocus.id));
      query.where(
        and(
          id ? inArray(rncLocus.id, Array.isArray(id) ? id.map(Number) : [Number(id)]) : undefined,
          assemblyId ? eq(rncLocus.assemblyId, String(assemblyId)) : undefined,
          regionId
            ? inArray(
                rncLocusMembers.regionId,
                Array.isArray(regionId) ? regionId.map(Number) : [Number(regionId)]
              )
            : undefined,
          membershipStatus
            ? eq(rncLocusMembers.membershipStatus, String(membershipStatus))
            : undefined
        )
      );
    } else {
      query.where(
        and(
          id ? inArray(rncLocus.id, Array.isArray(id) ? id.map(Number) : [Number(id)]) : undefined,
          assemblyId ? eq(rncLocus.assemblyId, String(assemblyId)) : undefined
        )
      );
    }

    const results = await query
      .limit(Number(rows))
      .offset(offset)
      .orderBy(sortOrder === 'desc' ? desc(rncLocus[sortBy]) : asc(rncLocus[sortBy]));

    res.json(results);
  } catch (err) {
    console.error('Error fetching locus data:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
