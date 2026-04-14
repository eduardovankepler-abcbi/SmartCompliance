import fs from "fs/promises";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";
import { normalizeLearningIntegrationPayload } from "../services/learningIntegrations.js";
import { evaluationLibrary, questionTemplate, seed } from "./mockData.js";
import {
  assertIncidentCreatePayload,
  assertIncidentUpdatePayload,
  buildIncidentAuditDetail,
  resolveIncidentAssignment
} from "./storeIncidentsDomain.js";
import {
  buildEvaluationAnswerRows,
  buildEvaluationResponseBundle,
  buildCycleConfigAuditDetail,
  buildCycleCreatedAuditDetail,
  buildCycleReminderAuditDetail,
  buildCycleStatusAuditDetail,
  buildFeedbackRequestCreateAuditDetail,
  buildFeedbackRequestItems,
  buildFeedbackRequestReviewAuditDetail,
  filterReceivedManagerFeedback,
  prepareEvaluationCycle,
  prepareEvaluationSubmission,
  prepareFeedbackRequest,
  resolveCycleConfigUpdate
} from "./storeEvaluationsDomain.js";
import {
  assertCanCreateApplause,
  assertCanManageApplauseEntry,
  assertCanManageDevelopmentSubject,
  buildApplauseAuditDetail,
  buildDevelopmentPlanAuditDetail,
  buildDevelopmentRecordAuditDetail
} from "./storeGrowthDomain.js";
import {
  prepareAreaMutation,
  prepareCompetencyMutation,
  preparePersonMutation
} from "./storeRegistryDomain.js";
import {
  assertPersonHasNoLinkedUser,
  assertUserPersonExists,
  buildUserAuditDetail,
  prepareUserWrite
} from "./storeUsersDomain.js";
import {
  canAccessIncidents,
  canManageCompetencies,
  canManageIncidentQueue,
  canManagePeople,
  canManageUsers,
  getAuditCategoriesForUser,
  isAdminUser,
  isAnonymousRelationship,
  isComplianceUser,
  isFullAccessUser,
  isHrUser,
  isManagerUser,
  isOrgWideUser,
  isReleasedCycle
} from "./storeAccess.js";
import {
  AUDIT_CATEGORIES,
  CYCLE_STATUS,
  DEFAULT_CYCLE_MODULE_AVAILABILITY,
  DEFAULT_EVALUATION_LIBRARY_DESCRIPTION,
  DEFAULT_EVALUATION_LIBRARY_ID,
  DEFAULT_EVALUATION_LIBRARY_NAME,
  DEFAULT_TRANSVERSAL_CONFIG,
  DEFAULT_WORK_MODE,
  DEFAULT_WORK_UNIT,
  FEEDBACK_ACKNOWLEDGEMENT_STATUS,
  FEEDBACK_REQUEST_STATUS,
  MIN_ANONYMOUS_AGGREGATE_RESPONSES,
} from "./storeConstants.js";
import { createId, hashPassword, verifyPasswordHash } from "./storeSecurity.js";
import {
  assertCycleStatusTransition,
  assertValidApplauseStatus,
  assertValidDevelopmentPlanStatus,
  assertValidDevelopmentRecordStatus,
  assertValidFeedbackRequestStatus,
  normalizeAreaName,
  normalizeOptionalText,
  normalizeRequiredText,
  normalizeWorkMode,
  normalizeWorkUnit
} from "./storeValidation.js";

const CUSTOM_LIBRARY_STORAGE_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "custom-libraries.json"
);
const ANONYMOUS_RESPONSE_STORAGE_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "anonymous-responses.json"
);

const cloneSeed = () => JSON.parse(JSON.stringify(seed));

function average(values) {
  return values.reduce((sum, value) => sum + Number(value), 0) / Math.max(values.length, 1);
}

function presentCycleReportSnapshot(row) {
  const questionAverages =
    typeof row.questionAveragesJson === "string"
      ? JSON.parse(row.questionAveragesJson)
      : Array.isArray(row.questionAverages)
        ? row.questionAverages
        : row.questionAveragesJson || [];

  return {
    id: row.id,
    cycleId: row.cycleId,
    relationshipType: row.relationshipType,
    totalResponses: Number(row.totalResponses || 0),
    averageScore: Number(row.averageScore || 0),
    questionAverages,
    generatedAt: row.generatedAt
  };
}

function presentCompetency(competency) {
  return {
    id: competency.id,
    key: competency.key,
    name: competency.name,
    description: competency.description || "",
    status: competency.status || "active"
  };
}

function enrichArea(people, area) {
  const manager = people.find((item) => item.id === area.managerPersonId);
  const members = people.filter((person) => person.area === area.name);
  return {
    ...area,
    managerPersonId: area.managerPersonId || null,
    managerName: manager?.name || "",
    peopleCount: members.length
  };
}

function filterAreasForUser(areas, people, user) {
  const enrichedAreas = areas.map((area) => enrichArea(people, area));

  if (isOrgWideUser(user) || isHrUser(user) || isAdminUser(user)) {
    return enrichedAreas;
  }

  if (isManagerUser(user)) {
    return enrichedAreas.filter(
      (area) => area.managerPersonId === user.person.id || area.name === user.person.area
    );
  }

  return enrichedAreas.filter((area) => area.name === user?.person?.area);
}

function enrichPerson(people, person, areas = []) {
  const manager = people.find((item) => item.id === person.managerPersonId);
  const area = areas.find((item) => item.name === person.area);
  return {
    ...person,
    workUnit: String(person.workUnit || DEFAULT_WORK_UNIT),
    workMode: normalizeWorkMode(person.workMode),
    managerPersonId: person.managerPersonId || null,
    managerName: manager?.name || "",
    areaManagerPersonId: area?.managerPersonId || null,
    areaManagerName: area?.managerName || ""
  };
}

function getTeamPeople(people, managerPersonId) {
  return people.filter((person) => person.managerPersonId === managerPersonId);
}

function toPublicUser(db, user) {
  const person = db.people.find((item) => item.id === user.personId);
  const publicPerson = person ? enrichPerson(db.people, person) : null;
  return {
    id: user.id,
    email: user.email,
    roleKey: user.roleKey,
    status: user.status,
    person: publicPerson
      ? {
          id: publicPerson.id,
          name: publicPerson.name,
          roleTitle: publicPerson.roleTitle,
          area: publicPerson.area,
          workUnit: publicPerson.workUnit,
          workMode: publicPerson.workMode,
          managerPersonId: publicPerson.managerPersonId,
          managerName: publicPerson.managerName,
          employmentType: publicPerson.employmentType
        }
      : null
  };
}

function toAdminUserRow(db, user) {
  const person = db.people.find((item) => item.id === user.personId);
  const publicPerson = person ? enrichPerson(db.people, person) : null;

  return {
    id: user.id,
    personId: user.personId,
    personName: publicPerson?.name || "",
    personArea: publicPerson?.area || "",
    personRoleTitle: publicPerson?.roleTitle || "",
    personWorkUnit: publicPerson?.workUnit || "",
    personWorkMode: publicPerson?.workMode || "",
    managerName: publicPerson?.managerName || "",
    areaManagerName: publicPerson?.areaManagerName || "",
    email: user.email,
    roleKey: user.roleKey,
    status: user.status
  };
}

function filterPeopleForUser(people, user, areas = []) {
  const enrichedAreas = areas.map((area) => enrichArea(people, area));
  const enrichedPeople = people.map((person) => enrichPerson(people, person, enrichedAreas));

  if (isOrgWideUser(user)) {
    return enrichedPeople;
  }

  if (isManagerUser(user)) {
    return enrichedPeople.filter(
      (person) => person.id === user.person.id || person.managerPersonId === user.person.id
    );
  }

  return enrichedPeople.map((person) => ({
    id: person.id,
    name: person.name,
    roleTitle: person.roleTitle,
    area: person.area,
    workUnit: person.workUnit,
    workMode: person.workMode,
    managerPersonId: person.managerPersonId,
    managerName: person.managerName
  }));
}

function assignAreaLeadershipSnapshot(areas, personId, areaName, shouldLeadArea) {
  const nextAreaKey = normalizeAreaName(areaName);

  return areas.map((area) => {
    const isTargetArea = normalizeAreaName(area.name) === nextAreaKey;
    const isManagedByPerson = area.managerPersonId === personId;

    if (isManagedByPerson && (!shouldLeadArea || !isTargetArea)) {
      return {
        ...area,
        managerPersonId: null
      };
    }

    if (shouldLeadArea && isTargetArea) {
      return {
        ...area,
        managerPersonId: personId
      };
    }

    return area;
  });
}

function isSameWorkUnit(leftPerson, rightPerson) {
  return (
    normalizeWorkUnit(leftPerson?.workUnit).toLowerCase() ===
    normalizeWorkUnit(rightPerson?.workUnit).toLowerCase()
  );
}

function isRemoteWorker(person) {
  return normalizeWorkMode(person?.workMode) === "remote";
}

function buildSameUnitCandidates(eligibleActors, actor) {
  return eligibleActors.filter(
    (candidate) =>
      candidate.id !== actor.id &&
      isSameWorkUnit(candidate.person, actor.person)
  );
}

function hasDirectManagementLink(leftPerson, rightPerson) {
  return (
    leftPerson?.managerPersonId === rightPerson?.id ||
    rightPerson?.managerPersonId === leftPerson?.id
  );
}

function getEligibleEvaluationActors(users, people) {
  return users
    .filter((user) => user.status === "active")
    .map((user) => ({
      ...user,
      person: people.find((person) => person.id === user.personId)
    }))
    .filter(
      (user) =>
        user.person && !["admin", "hr", "compliance"].includes(user.roleKey)
    );
}

function isCrossFunctionalBaseEligible(actor) {
  return Boolean(actor?.person) && !isRemoteWorker(actor.person);
}

function isCrossFunctionalCandidate(reviewer, reviewee) {
  return (
    reviewer?.id !== reviewee?.id &&
    isCrossFunctionalBaseEligible(reviewer) &&
    isCrossFunctionalBaseEligible(reviewee) &&
    isSameWorkUnit(reviewer.person, reviewee.person) &&
    reviewer.person.area !== reviewee.person.area &&
    !hasDirectManagementLink(reviewer.person, reviewee.person)
  );
}

function hashDeterministic(value) {
  return String(value || "").split("").reduce((acc, char) => {
    return (acc * 31 + char.charCodeAt(0)) % 2147483647;
  }, 7);
}

function getTransversalTargetForActor(actor, transversalConfig = DEFAULT_TRANSVERSAL_CONFIG) {
  const normalizedUnit = normalizeWorkUnit(actor?.person?.workUnit);
  const configuredValue =
    transversalConfig?.unitOverrides?.[normalizedUnit] ??
    transversalConfig?.defaultReviewersPerPerson ??
    DEFAULT_TRANSVERSAL_CONFIG.defaultReviewersPerPerson;
  const target = Number(configuredValue);
  return Number.isInteger(target) && target >= 1
    ? Math.min(target, 5)
    : DEFAULT_TRANSVERSAL_CONFIG.defaultReviewersPerPerson;
}

function buildPriorPairKey(reviewerUserId, revieweePersonId) {
  return `${reviewerUserId}::${revieweePersonId}`;
}

function buildCrossFunctionalPlan({
  users,
  people,
  cycleId,
  transversalConfig = DEFAULT_TRANSVERSAL_CONFIG,
  priorPairings = []
}) {
  const eligibleActors = getEligibleEvaluationActors(users, people);
  const actorByPersonId = new Map(eligibleActors.map((actor) => [actor.person.id, actor]));
  const actorByUserId = new Map(eligibleActors.map((actor) => [actor.id, actor]));
  const groupedByUnit = eligibleActors.reduce((acc, actor) => {
    const unitKey = normalizeWorkUnit(actor.person?.workUnit).toLowerCase();
    acc[unitKey] = acc[unitKey] || [];
    acc[unitKey].push(actor);
    return acc;
  }, {});

  const priorPairingKeys = new Set(
    (priorPairings || [])
      .filter((pairing) => !pairing?.blockedAt)
      .map((pairing) => buildPriorPairKey(pairing.reviewerUserId, pairing.revieweePersonId))
  );
  const assignedRevieweesByReviewerId = new Map();
  const reviewerIdsByRevieweePersonId = new Map();
  const pairings = [];
  const eligible = [];
  const ineligible = [];

  Object.values(groupedByUnit).forEach((unitActors) => {
    const baseEligibleActors = unitActors.filter(isCrossFunctionalBaseEligible);
    const targetByReviewerId = new Map(
      baseEligibleActors.map((actor) => [actor.id, getTransversalTargetForActor(actor, transversalConfig)])
    );
    const candidateMap = new Map(
      baseEligibleActors.map((actor) => [
        actor.id,
        baseEligibleActors
          .filter((candidate) => isCrossFunctionalCandidate(actor, candidate))
          .sort((left, right) => {
            const leftRepeated = priorPairingKeys.has(buildPriorPairKey(actor.id, left.person.id)) ? 1 : 0;
            const rightRepeated = priorPairingKeys.has(buildPriorPairKey(actor.id, right.person.id)) ? 1 : 0;
            const leftHash = hashDeterministic(`${cycleId}:${actor.id}:${left.id}`);
            const rightHash = hashDeterministic(`${cycleId}:${actor.id}:${right.id}`);
            return (
              leftRepeated - rightRepeated ||
              leftHash - rightHash ||
              left.person.area.localeCompare(right.person.area, "pt-BR") ||
              left.person.name.localeCompare(right.person.name, "pt-BR")
            );
          })
      ])
    );

    const maxAssignmentsForUnit = Math.max(
      1,
      ...baseEligibleActors.map((actor) => targetByReviewerId.get(actor.id) || 1)
    );

    for (let round = 0; round < maxAssignmentsForUnit; round += 1) {
      const reviewerOrder = [...baseEligibleActors]
        .filter((actor) => (assignedRevieweesByReviewerId.get(actor.id)?.length || 0) < (targetByReviewerId.get(actor.id) || 1))
        .sort((left, right) => {
          const leftAssigned = assignedRevieweesByReviewerId.get(left.id)?.length || 0;
          const rightAssigned = assignedRevieweesByReviewerId.get(right.id)?.length || 0;
          const leftCount = candidateMap.get(left.id)?.length || 0;
          const rightCount = candidateMap.get(right.id)?.length || 0;
          return (
            leftAssigned - rightAssigned ||
            leftCount - rightCount ||
            hashDeterministic(`${cycleId}:${round}:${left.id}`) -
              hashDeterministic(`${cycleId}:${round}:${right.id}`) ||
            left.person.name.localeCompare(right.person.name, "pt-BR")
          );
        });

      const matchedReviewees = new Map();
      function tryAssign(reviewer, visited = new Set()) {
        const existingRevieweeIds = new Set(assignedRevieweesByReviewerId.get(reviewer.id) || []);
        const candidates = (candidateMap.get(reviewer.id) || []).filter(
          (candidate) => !existingRevieweeIds.has(candidate.person.id)
        );
        for (const candidate of candidates) {
          if (visited.has(candidate.id)) {
            continue;
          }
          visited.add(candidate.id);

          const currentReviewerId = matchedReviewees.get(candidate.id);
          if (!currentReviewerId) {
            matchedReviewees.set(candidate.id, reviewer.id);
            return true;
          }

          const displacedReviewer = reviewerOrder.find((actor) => actor.id === currentReviewerId);
          if (displacedReviewer && tryAssign(displacedReviewer, visited)) {
            matchedReviewees.set(candidate.id, reviewer.id);
            return true;
          }
        }
        return false;
      }

      reviewerOrder.forEach((reviewer) => {
        tryAssign(reviewer);
      });

      matchedReviewees.forEach((reviewerId, candidateUserId) => {
        const reviewer = actorByUserId.get(reviewerId);
        const reviewee = actorByUserId.get(candidateUserId);
        if (!reviewer || !reviewee) {
          return;
        }
        const reviewerAssignments = assignedRevieweesByReviewerId.get(reviewer.id) || [];
        if (!reviewerAssignments.includes(reviewee.person.id)) {
          reviewerAssignments.push(reviewee.person.id);
          assignedRevieweesByReviewerId.set(reviewer.id, reviewerAssignments);
        }
        const revieweeReviewerIds = reviewerIdsByRevieweePersonId.get(reviewee.person.id) || [];
        if (!revieweeReviewerIds.includes(reviewer.id)) {
          revieweeReviewerIds.push(reviewer.id);
          reviewerIdsByRevieweePersonId.set(reviewee.person.id, revieweeReviewerIds);
        }
      });
    }

    baseEligibleActors.forEach((actor) => {
      const candidates = candidateMap.get(actor.id) || [];
      const matchedRevieweeIds = assignedRevieweesByReviewerId.get(actor.id) || [];
      const targetAssignments = targetByReviewerId.get(actor.id) || 1;

      matchedRevieweeIds.forEach((matchedRevieweePersonId) => {
        pairings.push({
          reviewerUserId: actor.id,
          revieweePersonId: matchedRevieweePersonId,
          workUnit: normalizeWorkUnit(actor.person.workUnit)
        });
      });

      const pairingReason =
        !candidates.length
          ? "Sem pares elegiveis na mesma unidade."
          : !matchedRevieweeIds.length
            ? "Sem pareamento balanceado disponivel na unidade."
            : matchedRevieweeIds.length < targetAssignments
              ? `Cobertura parcial: ${matchedRevieweeIds.length} de ${targetAssignments} previstos.`
              : null;

      const targetPayload = {
        personId: actor.person.id,
        personName: actor.person.name,
        personArea: actor.person.area,
        personWorkUnit: normalizeWorkUnit(actor.person.workUnit),
        personWorkMode: normalizeWorkMode(actor.person.workMode),
        candidateCount: candidates.length,
        assignedCount: matchedRevieweeIds.length,
        targetCount: targetAssignments
      };

      if (pairingReason) {
        ineligible.push({
          ...targetPayload,
          reason: pairingReason
        });
      } else {
        eligible.push({
          ...targetPayload,
          pairedRevieweePersonIds: matchedRevieweeIds
        });
      }
    });

    unitActors
      .filter((actor) => !isCrossFunctionalBaseEligible(actor))
      .forEach((actor) => {
        ineligible.push({
          personId: actor.person.id,
          personName: actor.person.name,
          personArea: actor.person.area,
          personWorkUnit: normalizeWorkUnit(actor.person.workUnit),
          personWorkMode: normalizeWorkMode(actor.person.workMode),
          candidateCount: 0,
          assignedCount: 0,
          targetCount: 0,
          reason: "Quem trabalha 100% home office nao participa do Feedback transversal."
        });
      });
  });

  return {
    pairings,
    eligible: eligible
      .map((item) => {
        const pairedRevieweeNames = (item.pairedRevieweePersonIds || [])
          .map((personId) => actorByPersonId.get(personId)?.person?.name || "")
          .filter(Boolean);
        const pairedReviewerNames = (reviewerIdsByRevieweePersonId.get(item.personId) || [])
          .map((reviewerUserId) => actorByUserId.get(reviewerUserId)?.person?.name || "")
          .filter(Boolean);
        return {
          ...item,
          pairedRevieweeName: pairedRevieweeNames[0] || "",
          pairedRevieweeNames,
          pairedReviewerName: pairedReviewerNames[0] || "",
          pairedReviewerNames
        };
      })
      .sort((left, right) => left.personName.localeCompare(right.personName, "pt-BR")),
    ineligible: ineligible.sort((left, right) =>
      left.personName.localeCompare(right.personName, "pt-BR")
    )
  };
}

function createCrossFunctionalPairingRecord({
  pairing,
  cycleId,
  actorUser,
  createId,
  source = "automatic",
  reason = "Pareamento automatico balanceado",
  seed = null
}) {
  return {
    id: createId("pairing"),
    cycleId,
    relationshipType: "cross-functional",
    reviewerUserId: pairing.reviewerUserId,
    revieweePersonId: pairing.revieweePersonId,
    pairingSource: source,
    pairingReason: reason,
    seed,
    createdAt: new Date().toISOString(),
    createdByUserId: actorUser?.id || null,
    blockedAt: null,
    blockedByUserId: null
  };
}

function createPairingExceptionRecord({
  cycleId,
  pairingId = null,
  reviewerUserId,
  previousRevieweePersonId = null,
  nextRevieweePersonId = null,
  actionType,
  reason,
  actorUser,
  createId
}) {
  return {
    id: createId("pairing_exception"),
    cycleId,
    pairingId,
    actionType,
    reviewerUserId,
    previousRevieweePersonId,
    nextRevieweePersonId,
    reason,
    actorUserId: actorUser?.id || null,
    createdAt: new Date().toISOString()
  };
}

function buildCrossFunctionalOperationView({
  users,
  people,
  cycleId,
  cycle = null,
  cycles = [],
  pairings = [],
  exceptions = [],
  allPairings = pairings
}) {
  const activeCycles = (cycles || []).map((item) => presentCycle(item));
  const currentCycle =
    cycle ||
    activeCycles.find((item) => item.id === cycleId) ||
    null;
  const sortedCycles = [...activeCycles].sort((left, right) => {
    const leftDate = parseDateValue(left?.dueDate)?.getTime() || 0;
    const rightDate = parseDateValue(right?.dueDate)?.getTime() || 0;
    return leftDate - rightDate;
  });
  const previousCycle = sortedCycles
    .filter((item) => item.id !== cycleId)
    .filter((item) => {
      const currentDueDate = parseDateValue(currentCycle?.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER;
      const itemDueDate = parseDateValue(item?.dueDate)?.getTime() || 0;
      return itemDueDate <= currentDueDate;
    })
    .at(-1);
  const previousCyclePairings = (allPairings || []).filter((item) => item.cycleId === previousCycle?.id);
  const computedPlan = buildCrossFunctionalPlan({
    users,
    people,
    cycleId,
    transversalConfig: currentCycle?.transversalConfig,
    priorPairings: previousCyclePairings
  });
  const eligibleActors = getEligibleEvaluationActors(users, people);
  const actorByPersonId = new Map(eligibleActors.map((actor) => [actor.person.id, actor]));
  const actorByUserId = new Map(eligibleActors.map((actor) => [actor.id, actor]));
  const storedPairings = pairings.length
    ? pairings.map((pairing) => ({
        reviewerUserId: pairing.reviewerUserId,
        revieweePersonId: pairing.revieweePersonId,
        workUnit:
          normalizeWorkUnit(
            actorByPersonId.get(pairing.revieweePersonId)?.person?.workUnit ||
              actorByUserId.get(pairing.reviewerUserId)?.person?.workUnit
          )
      }))
    : computedPlan.pairings;

  const pairedRevieweesByReviewerPersonId = storedPairings.reduce((acc, pairing) => {
    const reviewerPersonId =
      actorByUserId.get(pairing.reviewerUserId)?.person?.id || pairing.reviewerUserId;
    acc[reviewerPersonId] = acc[reviewerPersonId] || [];
    acc[reviewerPersonId].push(pairing.revieweePersonId);
    return acc;
  }, {});
  const reviewerIdsByRevieweePersonId = storedPairings.reduce((acc, pairing) => {
    acc[pairing.revieweePersonId] = acc[pairing.revieweePersonId] || [];
    acc[pairing.revieweePersonId].push(pairing.reviewerUserId);
    return acc;
  }, {});

  const eligible = computedPlan.eligible.map((item) => {
    const pairedRevieweePersonIds = pairedRevieweesByReviewerPersonId[item.personId] || [];
    const pairedRevieweeNames = pairedRevieweePersonIds
      .map((personId) => actorByPersonId.get(personId)?.person?.name || "")
      .filter(Boolean);
    const pairedReviewerNames = (reviewerIdsByRevieweePersonId[item.personId] || [])
      .map((reviewerUserId) => actorByUserId.get(reviewerUserId)?.person?.name || "")
      .filter(Boolean);
    const actor = actorByPersonId.get(item.personId);
    return {
      ...item,
      reviewerUserId: actor?.id || null,
      pairedRevieweePersonIds,
      pairedRevieweeName: pairedRevieweeNames[0] || "",
      pairedRevieweeNames,
      pairedReviewerName: pairedReviewerNames[0] || "",
      pairedReviewerNames
    };
  });

  const activeStoredPairings = (pairings || []).filter(
    (item) => item.cycleId === cycleId && item.relationshipType === "cross-functional" && !item.blockedAt
  );
  const previousPairingKeys = new Set(
    previousCyclePairings.map((item) => buildPriorPairKey(item.reviewerUserId, item.revieweePersonId))
  );
  const repeatedPairingsCount = activeStoredPairings.filter((item) =>
    previousPairingKeys.has(buildPriorPairKey(item.reviewerUserId, item.revieweePersonId))
  ).length;

  return {
    config: normalizeTransversalConfig(currentCycle?.transversalConfig),
    indicators: {
      totalPairings: storedPairings.length,
      automaticPairings: activeStoredPairings.filter((item) => item.pairingSource !== "manual").length,
      manualPairings: activeStoredPairings.filter((item) => item.pairingSource === "manual").length,
      repeatedPairings: repeatedPairingsCount,
      previousCycleTitle: previousCycle?.title || "",
      coverageRate: eligible.length
        ? Number(
            (
              eligible.reduce((acc, item) => acc + Math.min(item.assignedCount || 0, item.targetCount || 0), 0) /
              eligible.reduce((acc, item) => acc + Math.max(item.targetCount || 0, 0), 0)
            * 100
            ).toFixed(1)
          )
        : 0
    },
    eligible,
    ineligible: computedPlan.ineligible,
    pairings: storedPairings.map((pairing) => {
      const reviewer = actorByUserId.get(pairing.reviewerUserId);
      const reviewee = people.find((item) => item.id === pairing.revieweePersonId);
      const persistedPairing = pairings.find(
        (item) =>
          item.reviewerUserId === pairing.reviewerUserId &&
          item.revieweePersonId === pairing.revieweePersonId &&
          !item.blockedAt
      );
      return {
        pairingId: persistedPairing?.id || null,
        reviewerUserId: pairing.reviewerUserId,
        reviewerPersonId: reviewer?.person?.id || null,
        reviewerName: reviewer?.person?.name || "",
        reviewerArea: reviewer?.person?.area || "",
        revieweePersonId: pairing.revieweePersonId,
        revieweeName: reviewee?.name || "",
        revieweeArea: reviewee?.area || "",
        workUnit: pairing.workUnit,
        pairingSource: persistedPairing?.pairingSource || "automatic",
        pairingReason: persistedPairing?.pairingReason || "Pareamento automatico balanceado"
      };
    }),
    exceptions: exceptions
      .filter((item) => item.cycleId === cycleId)
      .sort((left, right) => {
        const rightDate = right?.createdAt ? new Date(right.createdAt).getTime() : 0;
        const leftDate = left?.createdAt ? new Date(left.createdAt).getTime() : 0;
        return rightDate - leftDate;
      })
  };
}

function getPeopleWithSatisfactionScores(people) {
  return people.filter((person) => Number.isFinite(Number(person.satisfactionScore)));
}

function averageSatisfactionScore(people) {
  const scoredPeople = getPeopleWithSatisfactionScores(people);
  if (!scoredPeople.length) {
    return null;
  }

  return Number(average(scoredPeople.map((person) => Number(person.satisfactionScore))).toFixed(1));
}

function updatePersonSatisfactionScoreInMemory(db, revieweePersonId, overallScore) {
  if (!Number.isFinite(Number(overallScore))) {
    return;
  }

  const person = db.people.find((item) => item.id === revieweePersonId);
  if (!person) {
    return;
  }

  person.satisfactionScore = Number(Number(overallScore).toFixed(2));
}

function parseDateValue(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function calculateDaysOverdue(dueDate, today = getStartOfToday()) {
  const due = parseDateValue(dueDate);
  if (!due) {
    return 0;
  }
  due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000));
}

function isAssignmentDelinquent(assignment, cycleStatus = assignment?.cycleStatus, today = getStartOfToday()) {
  if (!assignment || assignment.status !== "pending") {
    return false;
  }
  if (!isReleasedCycle(cycleStatus)) {
    return false;
  }
  const due = parseDateValue(assignment.dueDate);
  if (!due) {
    return false;
  }
  due.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

function buildCycleComplianceSummary(assignments, cycleStatus) {
  const today = getStartOfToday();
  const totalAssignments = assignments.length;
  const submittedAssignments = assignments.filter((item) => item.status === "submitted").length;
  const pendingAssignments = assignments.filter((item) => item.status === "pending").length;
  const delinquentAssignments = assignments.filter((item) =>
    isAssignmentDelinquent(item, cycleStatus, today)
  );

  return {
    totalAssignments,
    submittedAssignments,
    pendingAssignments,
    delinquentAssignments: delinquentAssignments.length,
    adherenceRate: calculatePercentage(submittedAssignments, totalAssignments),
    delinquencyRate: calculatePercentage(delinquentAssignments.length, totalAssignments)
  };
}

function presentDelinquentAssignment(assignment, db, cycleStatus) {
  const reviewer = db.users.find((item) => item.id === assignment.reviewerUserId);
  const reviewerPerson = reviewer
    ? db.people.find((item) => item.id === reviewer.personId)
    : null;
  const reviewee = db.people.find((item) => item.id === assignment.revieweePersonId);

  return {
    id: assignment.id,
    cycleId: assignment.cycleId,
    reviewerUserId: assignment.reviewerUserId,
    reviewerName: reviewerPerson?.name || "",
    reviewerEmail: reviewer?.email || "",
    reviewerWorkUnit: reviewerPerson?.workUnit || DEFAULT_WORK_UNIT,
    reviewerWorkMode: normalizeWorkMode(reviewerPerson?.workMode),
    revieweePersonId: assignment.revieweePersonId,
    revieweeName: assignment.relationshipType === "company" ? "Empresa" : reviewee?.name || "",
    revieweeArea: assignment.relationshipType === "company" ? "Institucional" : reviewee?.area || "",
    revieweeWorkUnit: reviewee?.workUnit || DEFAULT_WORK_UNIT,
    revieweeWorkMode: normalizeWorkMode(reviewee?.workMode),
    relationshipType: assignment.relationshipType,
    dueDate: assignment.dueDate,
    status: assignment.status,
    reminderCount: Number(assignment.reminderCount || 0),
    lastReminderSentAt: assignment.lastReminderSentAt || null,
    daysOverdue: calculateDaysOverdue(assignment.dueDate),
    isDelinquent: isAssignmentDelinquent(assignment, cycleStatus)
  };
}

function assertValidManagerReference(people, managerPersonId, personId = null) {
  if (!managerPersonId) {
    return;
  }

  const managerExists = people.some((person) => person.id === managerPersonId);
  if (!managerExists) {
    throw new Error("Gestor informado nao foi encontrado.");
  }

  if (personId && managerPersonId === personId) {
    throw new Error("Uma pessoa nao pode ser gestora de si mesma.");
  }
}

function assertNoManagerCycle(people, managerPersonId, personId = null) {
  if (!managerPersonId || !personId) {
    return;
  }

  let currentManagerId = managerPersonId;
  const visited = new Set();

  while (currentManagerId && !visited.has(currentManagerId)) {
    if (currentManagerId === personId) {
      throw new Error("A hierarquia informada cria um ciclo de gestao invalido.");
    }

    visited.add(currentManagerId);
    currentManagerId =
      people.find((person) => person.id === currentManagerId)?.managerPersonId || null;
  }
}

function assertValidAreaReference(areas, areaName) {
  if (!areaName || !areas.some((area) => normalizeAreaName(area.name) === normalizeAreaName(areaName))) {
    throw new Error("Area informada nao foi encontrada.");
  }
}

function assertValidAreaManagerReference(people, managerPersonId) {
  if (!managerPersonId) {
    return;
  }

  const managerExists = people.some((person) => person.id === managerPersonId);
  if (!managerExists) {
    throw new Error("Responsavel da area nao foi encontrado.");
  }
}

function assertNoDuplicatePersonProfile(people, payload, personId = null) {
  const normalizedName = normalizeOptionalText(payload.name).toLowerCase();
  const normalizedArea = normalizeAreaName(payload.area);
  const normalizedRoleTitle = normalizeOptionalText(payload.roleTitle).toLowerCase();

  const duplicate = people.find((person) => {
    if (personId && person.id === personId) {
      return false;
    }

    return (
      normalizeOptionalText(person.name).toLowerCase() === normalizedName &&
      normalizeAreaName(person.area) === normalizedArea &&
      normalizeOptionalText(person.roleTitle).toLowerCase() === normalizedRoleTitle
    );
  });

  if (duplicate) {
    throw new Error("Ja existe uma pessoa com mesmo nome, area e cargo.");
  }
}

function enrichIncident(incident, people = [], areas = []) {
  const assignedPerson = people.find((person) => person.id === incident.assignedPersonId);
  const responsibleArea = areas.find(
    (area) => normalizeAreaName(area.name) === normalizeAreaName(incident.responsibleArea)
  );

  return {
    ...incident,
    responsibleArea: incident.responsibleArea || "",
    assignedPersonId: incident.assignedPersonId || null,
    assignedPersonName: assignedPerson?.name || "",
    areaManagerPersonId: responsibleArea?.managerPersonId || null,
    areaManagerName: responsibleArea?.managerName || "",
    assignedTo:
      assignedPerson?.name ||
      responsibleArea?.managerName ||
      incident.assignedTo ||
      "Nao definido"
  };
}

function assertValidIncidentArea(areas, areaName) {
  if (!areaName) {
    throw new Error("Area responsavel obrigatoria.");
  }

  assertValidAreaReference(areas, areaName);
}

function assertValidIncidentAssignee(people, assignedPersonId) {
  if (!assignedPersonId) {
    return;
  }

  const assignedPerson = people.find((person) => person.id === assignedPersonId);
  if (!assignedPerson) {
    throw new Error("Responsavel informado nao foi encontrado.");
  }
}

function buildSummary(db, user) {
  if (isOrgWideUser(user)) {
    return {
      mode: "executive",
      peopleCount: db.people.length,
      openIncidents: db.incidents.filter((item) => item.status !== "Concluido").length,
      activeEvaluationCycles: db.cycles.filter((item) => isReleasedCycle(item.status)).length,
      applauseCount: db.applauseEntries.length,
      developmentRecords: db.developmentRecords.length,
      pendingAssignments: db.assignments.filter((item) => item.status === "pending").length
    };
  }

  if (isManagerUser(user)) {
    const teamPeople = getTeamPeople(db.people, user.person.id);
    const visiblePersonIds = new Set([user.person.id, ...teamPeople.map((item) => item.id)]);
    return {
      mode: "team",
      peopleCount: visiblePersonIds.size,
      openIncidents: 0,
      activeEvaluationCycles: db.cycles.filter((item) => isReleasedCycle(item.status)).length,
      applauseCount: db.applauseEntries.filter(
        (item) =>
          visiblePersonIds.has(item.receiverPersonId) || visiblePersonIds.has(item.senderPersonId)
      ).length,
      developmentRecords: db.developmentRecords.filter((item) =>
        visiblePersonIds.has(item.personId)
      ).length,
      pendingAssignments: db.assignments.filter(
        (item) =>
          item.status === "pending" &&
          (item.reviewerUserId === user.id || visiblePersonIds.has(item.revieweePersonId))
      ).length
    };
  }

  return {
    mode: "personal",
    peopleCount: 1,
    openIncidents: 0,
    activeEvaluationCycles: db.cycles.filter((item) => isReleasedCycle(item.status)).length,
    applauseCount: db.applauseEntries.filter(
      (item) => item.receiverPersonId === user.person.id
    ).length,
    developmentRecords: db.developmentRecords.filter(
      (item) => item.personId === user.person.id
    ).length,
    pendingAssignments: db.assignments.filter(
      (item) => item.reviewerUserId === user.id && item.status === "pending"
    ).length
  };
}

function presentDevelopmentRecord(record, personName = "") {
  return {
    ...record,
    personName,
    status: record.status || "active",
    archivedAt: record.archivedAt || null
  };
}

function buildDashboard(db, user, anonymousResponses = []) {
  const allResponses = [
    ...db.submissions.map((item) => enrichSubmission(db, item)),
    ...anonymousResponses
  ];

  if (isOrgWideUser(user)) {
    const avgSatisfaction = averageSatisfactionScore(db.people);
    const completedAssignments = db.assignments.filter((item) => item.status === "submitted").length;
    const adherence = db.assignments.length
      ? Math.round((completedAssignments / db.assignments.length) * 100)
      : 0;

    return {
      mode: "executive",
      notice: "Leitura consolidada para RH, compliance e lideranca.",
      cards: [
        {
          label: "Satisfacao media",
          value: avgSatisfaction === null ? "-" : avgSatisfaction.toFixed(1),
          trend: "Painel institucional consolidado"
        },
        {
          label: "Adesao ao ciclo",
          value: `${adherence}%`,
          trend: "Assignments concluidos sobre o total"
        },
        {
          label: "Aplause validado",
          value: String(db.applauseEntries.length),
          trend: "Somente reconhecimentos aceitos"
        },
        {
          label: "Registros de desenvolvimento",
          value: String(db.developmentRecords.length),
          trend: "Historico pronto para comites"
        }
      ],
      satisfactionByArea: Object.values(
        getPeopleWithSatisfactionScores(db.people).reduce((acc, person) => {
          const entry = acc[person.area] || { area: person.area, scores: [] };
          entry.scores.push(Number(person.satisfactionScore));
          acc[person.area] = entry;
          return acc;
        }, {})
      ).map((entry) => ({
        area: entry.area,
        score: average(entry.scores).toFixed(1)
      })),
      evaluationHighlights: [
        "Perguntas-base padronizadas com customizacao limitada do gestor.",
        "Escala de 1 a 5 totalmente rotulada para reduzir ambiguidade.",
        "Comentarios obrigatorios em notas extremas para fortalecer evidencias."
      ],
      responseDistributions: buildQuestionDistributions(allResponses),
      evaluationMix: Object.entries(
        db.assignments.reduce((acc, assignment) => {
          acc[assignment.relationshipType] = (acc[assignment.relationshipType] || 0) + 1;
          return acc;
        }, {})
      ).map(([type, total]) => ({
        type,
        total
      }))
    };
  }

  if (isManagerUser(user)) {
    const teamPeople = getTeamPeople(db.people, user.person.id);
    const visiblePersonIds = new Set([user.person.id, ...teamPeople.map((item) => item.id)]);
    const teamAssignments = db.assignments.filter(
      (item) =>
        item.reviewerUserId === user.id || visiblePersonIds.has(item.revieweePersonId)
    );
    const teamResponses = allResponses.filter((response) =>
      visiblePersonIds.has(response.revieweePersonId)
    );
    const completedAssignments = teamAssignments.filter((item) => item.status === "submitted").length;
    const adherence = teamAssignments.length
      ? Math.round((completedAssignments / teamAssignments.length) * 100)
      : 0;

    return {
      mode: "team",
      notice: "Leitura da sua equipe direta, sem exposicao de outras areas.",
      cards: [
        {
          label: "Pessoas na equipe",
          value: String(visiblePersonIds.size),
          trend: "Gestor e reportes diretos"
        },
        {
          label: "Adesao ao ciclo",
          value: `${adherence}%`,
          trend: "Assignments da equipe concluidos"
        },
        {
          label: "Aplause na equipe",
          value: String(
            db.applauseEntries.filter((item) => visiblePersonIds.has(item.receiverPersonId)).length
          ),
          trend: "Reconhecimentos recebidos pelos reportes"
        },
        {
          label: "Registros de desenvolvimento",
          value: String(
            db.developmentRecords.filter((item) => visiblePersonIds.has(item.personId)).length
          ),
          trend: "Historico de desenvolvimento da equipe"
        }
      ],
      satisfactionByArea: [],
      evaluationHighlights: [
        "Voce acompanha somente sua equipe direta.",
        "Respostas confidenciais continuam agregadas quando aplicavel.",
        "O dashboard gerencial nao expande para outras areas."
      ],
      responseDistributions: buildQuestionDistributions(teamResponses),
      evaluationMix: Object.entries(
        teamAssignments.reduce((acc, assignment) => {
          acc[assignment.relationshipType] = (acc[assignment.relationshipType] || 0) + 1;
          return acc;
        }, {})
      ).map(([type, total]) => ({
        type,
        total
      }))
    };
  }

  const myAssignments = db.assignments.filter((item) => item.reviewerUserId === user.id);
  const completedAssignments = myAssignments.filter((item) => item.status === "submitted").length;
  const receivedApplause = db.applauseEntries.filter(
    (item) => item.receiverPersonId === user.person.id
  ).length;
  const myDevelopmentRecords = db.developmentRecords.filter(
    (item) => item.personId === user.person.id
  ).length;

  return {
    mode: "personal",
    notice: "Voce esta vendo apenas seu recorte individual.",
    cards: [
      {
        label: "Avaliacoes pendentes",
        value: String(myAssignments.filter((item) => item.status === "pending").length),
        trend: "Acompanhe seus prazos do ciclo"
      },
      {
        label: "Avaliacoes concluidas",
        value: String(completedAssignments),
        trend: "Respostas ja registradas por voce"
      },
      {
        label: "Aplause recebidos",
        value: String(receivedApplause),
        trend: "Reconhecimentos validados no periodo"
      },
      {
        label: "Evolucao registrada",
        value: String(myDevelopmentRecords),
        trend: "Cursos e marcos no seu historico"
      }
    ],
    satisfactionByArea: [],
    evaluationHighlights: [
      "Seu dashboard mostra apenas dados pessoais e agregados permitidos.",
      "Respostas confidenciais de lideranca e empresa entram somente em leitura agregada.",
      "O score anual pode existir, mas nao fica aberto no detalhe operacional."
    ],
    responseDistributions: buildQuestionDistributions(
      allResponses.filter((response) => response.reviewerUserId === user.id)
    ),
    evaluationMix: Object.entries(
      myAssignments.reduce((acc, assignment) => {
        acc[assignment.relationshipType] = (acc[assignment.relationshipType] || 0) + 1;
        return acc;
      }, {})
    ).map(([type, total]) => ({
      type,
      total
    }))
  };
}

function buildTemplate(definition) {
  const normalizedDefinition = {
    id: definition.id || `${definition.relationshipType || "custom"}_template`,
    key: definition.key || definition.relationshipType || "custom",
    modelName: definition.modelName || definition.name || "Template customizado",
    description: definition.description || "",
    policy: definition.policy || {},
    questions: definition.questions || []
  };
  const dimensions = [];
  const sections = [];
  for (const question of normalizedDefinition.questions) {
    if (question.sectionKey && !sections.find((item) => item.key === question.sectionKey)) {
      sections.push({
        key: question.sectionKey,
        title: question.sectionTitle || question.sectionKey,
        description: question.sectionDescription || ""
      });
    }
    let entry = dimensions.find((item) => item.key === question.dimensionKey);
    if (!entry) {
      entry = {
        key: question.dimensionKey,
        title: question.dimensionTitle,
        questions: []
      };
      dimensions.push(entry);
    }
    entry.questions.push(question.prompt);
  }

  return {
    id: normalizedDefinition.id,
    key: normalizedDefinition.key,
    modelName: normalizedDefinition.modelName,
    description: normalizedDefinition.description,
    policy: normalizedDefinition.policy,
    sections,
    dimensions,
    questions: normalizedDefinition.questions
  };
}

function buildEvaluationLibraryPayload(customLibraries = []) {
  const defaultLibrary = {
    id: DEFAULT_EVALUATION_LIBRARY_ID,
    name: DEFAULT_EVALUATION_LIBRARY_NAME,
    description: DEFAULT_EVALUATION_LIBRARY_DESCRIPTION,
    sourceType: "default",
    templateCount: Object.values(evaluationLibrary.templates).length,
    questionCount: Object.values(evaluationLibrary.templates).reduce(
      (total, template) => total + template.questions.length,
      0
    )
  };
  const customLibrarySummaries = customLibraries.map((library) => ({
    ...library,
    sourceType: "custom"
  }));

  return {
    scale: evaluationLibrary.scale,
    weights: evaluationLibrary.weights,
    defaultLibrary,
    cycleLibraries: [defaultLibrary, ...customLibrarySummaries].map((library) => ({
      id: library.id,
      name: library.name,
      description: library.description || "",
      sourceType: library.sourceType,
      templateCount: library.templateCount,
      questionCount: library.questionCount
    })),
    templates: Object.values(evaluationLibrary.templates).map((template) =>
      buildTemplate(template)
    ),
    customLibraries: customLibrarySummaries
  };
}

function countLibraryQuestions(templates = []) {
  return (templates || []).reduce(
    (total, template) => total + ((template?.questions || []).length || 0),
    0
  );
}

function normalizeCustomLibraryQuestion(question, templateKey, index) {
  const inputType = ["scale", "text", "multi-select"].includes(question?.inputType)
    ? question.inputType
    : "scale";
  const options =
    inputType === "multi-select"
      ? (Array.isArray(question?.options) ? question.options : [])
          .map((option, optionIndex) =>
            typeof option === "string"
              ? {
                  value: option,
                  label: option
                }
              : {
                  value:
                    String(option?.value || option?.label || `option_${optionIndex + 1}`).trim(),
                  label:
                    String(option?.label || option?.value || `Opcao ${optionIndex + 1}`).trim()
                }
          )
          .filter((option) => option.value && option.label)
      : [];

  return {
    id: question?.id || createId("question"),
    sectionKey: String(question?.sectionKey || templateKey || `secao_${index + 1}`).trim(),
    sectionTitle: String(question?.sectionTitle || question?.sectionKey || "Secao").trim(),
    sectionDescription: String(question?.sectionDescription || "").trim(),
    dimensionKey: String(question?.dimensionKey || `dimensao_${index + 1}`).trim(),
    dimensionTitle: String(
      question?.dimensionTitle || question?.sectionTitle || `Pergunta ${index + 1}`
    ).trim(),
    prompt: String(question?.prompt || "").trim(),
    helperText: String(question?.helperText || "").trim(),
    sortOrder: Number(question?.sortOrder) > 0 ? Number(question.sortOrder) : index + 1,
    isRequired: question?.isRequired !== false,
    visibility: ["shared", "private", "confidential"].includes(question?.visibility)
      ? question.visibility
      : "shared",
    inputType,
    options,
    scaleProfile: String(question?.scaleProfile || "").trim(),
    collectEvidenceOnExtreme: Boolean(question?.collectEvidenceOnExtreme)
  };
}

function normalizeCustomLibraryTemplate(template, index) {
  const relationshipType = String(template?.relationshipType || template?.key || "").trim();
  if (!relationshipType) {
    throw new Error("Cada template customizado precisa informar o tipo de avaliacao.");
  }

  const questions = (Array.isArray(template?.questions) ? template.questions : []).map(
    (question, questionIndex) =>
      normalizeCustomLibraryQuestion(question, relationshipType, questionIndex)
  );

  if (!questions.length) {
    throw new Error(`O template ${relationshipType} precisa ter ao menos uma pergunta.`);
  }

  if (questions.some((question) => !question.prompt)) {
    throw new Error(`O template ${relationshipType} possui pergunta sem enunciado.`);
  }

  if (
    questions.some(
      (question) => question.inputType === "multi-select" && !question.options.length
    )
  ) {
    throw new Error(
      `O template ${relationshipType} possui pergunta multipla escolha sem opcoes.`
    );
  }

  return {
    id: template?.id || createId("template"),
    relationshipType,
    key: String(template?.key || relationshipType).trim(),
    modelName: String(template?.modelName || template?.name || relationshipType).trim(),
    description: String(template?.description || "").trim(),
    policy: {
      ...(template?.policy || {})
    },
    questions: questions.sort((left, right) => left.sortOrder - right.sortOrder)
  };
}

function preparePublishedCustomLibraryUpdate(existingLibrary, payload = {}) {
  if (!existingLibrary) {
    throw new Error("Biblioteca customizada nao encontrada.");
  }

  const nextName = String(payload.name ?? existingLibrary.name ?? "").trim();
  if (!nextName) {
    throw new Error("Nome da biblioteca obrigatorio.");
  }

  const nextTemplates =
    payload.templates !== undefined
      ? (Array.isArray(payload.templates) ? payload.templates : []).map((template, index) =>
          normalizeCustomLibraryTemplate(template, index)
        )
      : existingLibrary.templates || [];

  if (!nextTemplates.length) {
    throw new Error("A biblioteca precisa manter ao menos um template.");
  }

  return {
    ...existingLibrary,
    name: nextName,
    description: String(payload.description ?? existingLibrary.description ?? "").trim(),
    templateCount: nextTemplates.length,
    questionCount: countLibraryQuestions(nextTemplates),
    templates: nextTemplates,
    updatedAt: new Date().toISOString()
  };
}

function normalizeCycleModuleAvailability(value) {
  if (!value) {
    return { ...DEFAULT_CYCLE_MODULE_AVAILABILITY };
  }

  if (typeof value === "string") {
    try {
      return normalizeCycleModuleAvailability(JSON.parse(value));
    } catch (_error) {
      return { ...DEFAULT_CYCLE_MODULE_AVAILABILITY };
    }
  }

  if (typeof value !== "object") {
    return { ...DEFAULT_CYCLE_MODULE_AVAILABILITY };
  }

  return {
    ...DEFAULT_CYCLE_MODULE_AVAILABILITY,
    ...Object.fromEntries(
      Object.entries(value).map(([key, enabled]) => [key, Boolean(enabled)])
    )
  };
}

function normalizeCycleIsEnabled(value) {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return true;
}

function normalizeTransversalConfig(value) {
  const raw =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value);
          } catch (_error) {
            return {};
          }
        })()
      : value || {};

  const defaultReviewersPerPerson = Number(
    raw.defaultReviewersPerPerson ?? DEFAULT_TRANSVERSAL_CONFIG.defaultReviewersPerPerson
  );
  const safeDefault =
    Number.isInteger(defaultReviewersPerPerson) && defaultReviewersPerPerson >= 1
      ? Math.min(defaultReviewersPerPerson, 5)
      : DEFAULT_TRANSVERSAL_CONFIG.defaultReviewersPerPerson;

  const unitOverrides =
    raw.unitOverrides && typeof raw.unitOverrides === "object" && !Array.isArray(raw.unitOverrides)
      ? Object.fromEntries(
          Object.entries(raw.unitOverrides)
            .map(([unit, count]) => [String(unit || "").trim(), Number(count)])
            .filter(
              ([unit, count]) =>
                Boolean(unit) && Number.isInteger(count) && count >= 1 && count <= 5
            )
        )
      : {};

  return {
    defaultReviewersPerPerson: safeDefault,
    unitOverrides
  };
}

function isCycleRelationshipEnabled(cycle, relationshipType) {
  const resolvedCycle = presentCycle(cycle || {});
  if (!resolvedCycle.isEnabled) {
    return false;
  }
  return resolvedCycle.moduleAvailability?.[relationshipType] !== false;
}

function presentCycle(row) {
  return {
    ...row,
    templateId: row.templateId || questionTemplate.id,
    libraryId: row.libraryId || DEFAULT_EVALUATION_LIBRARY_ID,
    libraryName: row.libraryName || DEFAULT_EVALUATION_LIBRARY_NAME,
    modelName:
      row.modelName || row.libraryName || DEFAULT_EVALUATION_LIBRARY_NAME,
    isEnabled: normalizeCycleIsEnabled(row.isEnabled),
    moduleAvailability: normalizeCycleModuleAvailability(
      row.moduleAvailability ?? row.enabledRelationshipsJson ?? row.enabledRelationships
    ),
    transversalConfig: normalizeTransversalConfig(
      row.transversalConfig ?? row.transversalConfigJson
    )
  };
}

function findPublishedLibrary(customLibraries, libraryId) {
  return (customLibraries || []).find((library) => library.id === libraryId) || null;
}

function findTemplateInPublishedLibrary(library, relationshipType) {
  return (
    library?.templates?.find((template) => template.relationshipType === relationshipType) || null
  );
}

function getTemplateDefinitionForCycle({
  cycle,
  relationshipType,
  customLibraries = []
}) {
  const baseTemplate = getTemplateForRelationship(relationshipType);
  const customLibrary = findPublishedLibrary(customLibraries, cycle?.libraryId);
  const customTemplate = findTemplateInPublishedLibrary(customLibrary, relationshipType);

  if (!customTemplate) {
    return baseTemplate;
  }

  if (!Array.isArray(customTemplate.questions) || !customTemplate.questions.length) {
    return baseTemplate;
  }

  return {
    ...baseTemplate,
    ...customTemplate,
    policy: {
      ...(baseTemplate?.policy || {}),
      ...(customTemplate.policy || {})
    },
    questions: customTemplate.questions
  };
}

function resolveTemplateKey(relationshipType) {
  if (relationshipType === "self") {
    return "self";
  }
  if (relationshipType === "manager") {
    return "manager";
  }
  if (relationshipType === "cross-functional") {
    return "cross-functional";
  }
  if (relationshipType === "leader") {
    return "leader";
  }
  if (relationshipType === "company") {
    return "company";
  }
  return "collaboration";
}

function getTemplateForRelationship(relationshipType) {
  return evaluationLibrary.templates[resolveTemplateKey(relationshipType)];
}

function findQuestionDefinition(questionId, customLibraries = []) {
  return [
    ...Object.values(evaluationLibrary.templates),
    ...customLibraries.flatMap((library) => library.templates || [])
  ]
    .flatMap((template) => template.questions)
    .find((question) => question.id === questionId);
}

function presentAssignment(row, customLibraries = []) {
  const cycle = presentCycle(row);
  const templateDefinition = getTemplateDefinitionForCycle({
    cycle,
    relationshipType: row.relationshipType,
    customLibraries
  });
  return {
    ...cycle,
    templateKey: templateDefinition?.key || resolveTemplateKey(row.relationshipType),
    templateId: templateDefinition?.id || row.templateId || questionTemplate.id,
    weight: evaluationLibrary.weights[row.relationshipType] || 0,
    cycleStatus: cycle.cycleStatus || "",
    reminderCount: Number(row.reminderCount || 0),
    lastReminderSentAt: row.lastReminderSentAt || null,
    revieweeName: row.relationshipType === "company" ? "Empresa" : row.revieweeName,
    revieweeArea: row.relationshipType === "company" ? "Institucional" : row.revieweeArea
  };
}

function hasMysqlColumn(rows) {
  return Boolean(rows?.length);
}

async function hasMysqlTable(pool, tableName) {
  try {
    const [tables] = await pool.query(`SHOW TABLES LIKE '${tableName}'`);
    return Boolean(tables?.length);
  } catch (_error) {
    return false;
  }
}

async function detectMysqlCycleConfigSupport(pool) {
  try {
    const [enabledRows] = await pool.query(
      "SHOW COLUMNS FROM evaluation_cycles LIKE 'is_enabled'"
    );
    const [relationshipsRows] = await pool.query(
      "SHOW COLUMNS FROM evaluation_cycles LIKE 'enabled_relationships_json'"
    );
    const [transversalRows] = await pool.query(
      "SHOW COLUMNS FROM evaluation_cycles LIKE 'transversal_config_json'"
    );
    return hasMysqlColumn(enabledRows) && hasMysqlColumn(relationshipsRows) && hasMysqlColumn(transversalRows);
  } catch (_error) {
    return false;
  }
}

async function ensureMysqlColumns(pool, tableName, statements, detector) {
  const supportsBefore = await detector(pool);
  if (supportsBefore) {
    return true;
  }

  const autoMigrateRaw = String(process.env.AUTO_MIGRATE_DB || "").trim().toLowerCase();
  const autoMigrateDisabled = ["0", "false", "no", "off"].includes(autoMigrateRaw);
  if (autoMigrateDisabled) {
    return false;
  }

  try {
    if (!(await hasMysqlTable(pool, tableName))) {
      return false;
    }
  } catch (error) {
    console.warn(`Could not verify ${tableName} table existence`, error);
    return false;
  }

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (error) {
      if (error?.code === "ER_DUP_FIELDNAME" || error?.errno === 1060) {
        continue;
      }
      console.warn("Database auto-migration failed", error);
      break;
    }
  }

  return detector(pool);
}

async function ensureMysqlTables(pool, detector, statements) {
  const supportsBefore = await detector(pool);
  if (supportsBefore) {
    return true;
  }

  const autoMigrateRaw = String(process.env.AUTO_MIGRATE_DB || "").trim().toLowerCase();
  const autoMigrateDisabled = ["0", "false", "no", "off"].includes(autoMigrateRaw);
  if (autoMigrateDisabled) {
    return false;
  }

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (error) {
      console.warn("Database auto-migration failed", error);
      break;
    }
  }

  return detector(pool);
}

async function ensureMysqlCycleConfigSupport(pool) {
  return ensureMysqlColumns(
    pool,
    "evaluation_cycles",
    [
      "ALTER TABLE evaluation_cycles ADD COLUMN is_enabled BOOLEAN NOT NULL DEFAULT TRUE",
      "ALTER TABLE evaluation_cycles ADD COLUMN enabled_relationships_json JSON NULL",
      "ALTER TABLE evaluation_cycles ADD COLUMN transversal_config_json JSON NULL"
    ],
    detectMysqlCycleConfigSupport
  );
}

async function detectMysqlFeedbackAcknowledgementSupport(pool) {
  try {
    const [statusRows] = await pool.query(
      "SHOW COLUMNS FROM evaluation_submissions LIKE 'reviewee_acknowledgement_status'"
    );
    const [noteRows] = await pool.query(
      "SHOW COLUMNS FROM evaluation_submissions LIKE 'reviewee_acknowledgement_note'"
    );
    const [acknowledgedAtRows] = await pool.query(
      "SHOW COLUMNS FROM evaluation_submissions LIKE 'reviewee_acknowledged_at'"
    );
    return (
      hasMysqlColumn(statusRows) &&
      hasMysqlColumn(noteRows) &&
      hasMysqlColumn(acknowledgedAtRows)
    );
  } catch (_error) {
    return false;
  }
}

async function ensureMysqlFeedbackAcknowledgementSupport(pool) {
  return ensureMysqlColumns(
    pool,
    "evaluation_submissions",
    [
      "ALTER TABLE evaluation_submissions ADD COLUMN reviewee_acknowledgement_status VARCHAR(30) NULL",
      "ALTER TABLE evaluation_submissions ADD COLUMN reviewee_acknowledgement_note TEXT NULL",
      "ALTER TABLE evaluation_submissions ADD COLUMN reviewee_acknowledged_at DATETIME NULL"
    ],
    detectMysqlFeedbackAcknowledgementSupport
  );
}

async function detectMysqlPeopleWorkContextSupport(pool) {
  try {
    const [unitRows] = await pool.query("SHOW COLUMNS FROM people LIKE 'work_unit'");
    const [modeRows] = await pool.query("SHOW COLUMNS FROM people LIKE 'work_mode'");
    const [employmentRows] = await pool.query("SHOW COLUMNS FROM people LIKE 'employment_type'");
    const [satisfactionRows] = await pool.query("SHOW COLUMNS FROM people LIKE 'satisfaction_score'");
    return (
      hasMysqlColumn(unitRows) &&
      hasMysqlColumn(modeRows) &&
      hasMysqlColumn(employmentRows) &&
      hasMysqlColumn(satisfactionRows)
    );
  } catch (_error) {
    return false;
  }
}

async function ensureMysqlPeopleWorkContextSupport(pool) {
  return ensureMysqlColumns(
    pool,
    "people",
    [
      `ALTER TABLE people ADD COLUMN work_unit VARCHAR(120) NOT NULL DEFAULT '${DEFAULT_WORK_UNIT}'`,
      `ALTER TABLE people ADD COLUMN work_mode VARCHAR(30) NOT NULL DEFAULT '${DEFAULT_WORK_MODE}'`,
      "ALTER TABLE people ADD COLUMN employment_type VARCHAR(40) NOT NULL DEFAULT 'internal'",
      "ALTER TABLE people ADD COLUMN satisfaction_score DECIMAL(4,2) NOT NULL DEFAULT 0"
    ],
    detectMysqlPeopleWorkContextSupport
  );
}

async function detectMysqlAssignmentReminderSupport(pool) {
  try {
    const [countRows] = await pool.query(
      "SHOW COLUMNS FROM evaluation_assignments LIKE 'reminder_count'"
    );
    const [dateRows] = await pool.query(
      "SHOW COLUMNS FROM evaluation_assignments LIKE 'last_reminder_sent_at'"
    );
    return hasMysqlColumn(countRows) && hasMysqlColumn(dateRows);
  } catch (_error) {
    return false;
  }
}

async function ensureMysqlAssignmentReminderSupport(pool) {
  return ensureMysqlColumns(
    pool,
    "evaluation_assignments",
    [
      "ALTER TABLE evaluation_assignments ADD COLUMN reminder_count INT NOT NULL DEFAULT 0",
      "ALTER TABLE evaluation_assignments ADD COLUMN last_reminder_sent_at DATETIME NULL"
    ],
    detectMysqlAssignmentReminderSupport
  );
}

async function detectMysqlPairingSupport(pool) {
  return (
    (await hasMysqlTable(pool, "evaluation_pairings")) &&
    (await hasMysqlTable(pool, "evaluation_pairing_exceptions"))
  );
}

async function ensureMysqlPairingSupport(pool) {
  return ensureMysqlTables(pool, detectMysqlPairingSupport, [
    `CREATE TABLE IF NOT EXISTS evaluation_pairings (
      id VARCHAR(36) PRIMARY KEY,
      cycle_id VARCHAR(36) NOT NULL,
      relationship_type VARCHAR(60) NOT NULL,
      reviewer_user_id VARCHAR(36) NOT NULL,
      reviewee_person_id VARCHAR(36) NOT NULL,
      pairing_source VARCHAR(30) NOT NULL,
      pairing_reason TEXT NOT NULL,
      seed VARCHAR(120) NULL,
      created_at DATETIME NOT NULL,
      created_by_user_id VARCHAR(36) NULL,
      blocked_at DATETIME NULL,
      blocked_by_user_id VARCHAR(36) NULL,
      FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id),
      FOREIGN KEY (reviewer_user_id) REFERENCES users(id),
      FOREIGN KEY (reviewee_person_id) REFERENCES people(id),
      FOREIGN KEY (created_by_user_id) REFERENCES users(id),
      FOREIGN KEY (blocked_by_user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS evaluation_pairing_exceptions (
      id VARCHAR(36) PRIMARY KEY,
      cycle_id VARCHAR(36) NOT NULL,
      pairing_id VARCHAR(36) NULL,
      action_type VARCHAR(40) NOT NULL,
      reviewer_user_id VARCHAR(36) NOT NULL,
      previous_reviewee_person_id VARCHAR(36) NULL,
      next_reviewee_person_id VARCHAR(36) NULL,
      reason TEXT NOT NULL,
      actor_user_id VARCHAR(36) NOT NULL,
      created_at DATETIME NOT NULL,
      FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id),
      FOREIGN KEY (pairing_id) REFERENCES evaluation_pairings(id),
      FOREIGN KEY (reviewer_user_id) REFERENCES users(id),
      FOREIGN KEY (previous_reviewee_person_id) REFERENCES people(id),
      FOREIGN KEY (next_reviewee_person_id) REFERENCES people(id),
      FOREIGN KEY (actor_user_id) REFERENCES users(id)
    )`
  ]);
}

async function detectMysqlLearningIntegrationSupport(pool) {
  try {
    const hasTable = await hasMysqlTable(pool, "learning_integration_events");
    if (!hasTable) {
      return false;
    }

    const [entityTypeRows] = await pool.query(
      "SHOW COLUMNS FROM learning_integration_events LIKE 'applied_entity_type'"
    );
    const [entityIdRows] = await pool.query(
      "SHOW COLUMNS FROM learning_integration_events LIKE 'applied_entity_id'"
    );
    const [appliedAtRows] = await pool.query(
      "SHOW COLUMNS FROM learning_integration_events LIKE 'applied_at'"
    );
    const [reviewNoteRows] = await pool.query(
      "SHOW COLUMNS FROM learning_integration_events LIKE 'review_note'"
    );
    return (
      hasMysqlColumn(entityTypeRows) &&
      hasMysqlColumn(entityIdRows) &&
      hasMysqlColumn(appliedAtRows) &&
      hasMysqlColumn(reviewNoteRows)
    );
  } catch (_error) {
    return false;
  }
}

async function ensureMysqlLearningIntegrationSupport(pool) {
  const hasTable = await ensureMysqlTables(
    pool,
    async (mysqlPool) => hasMysqlTable(mysqlPool, "learning_integration_events"),
    [
      `CREATE TABLE IF NOT EXISTS learning_integration_events (
      id VARCHAR(36) PRIMARY KEY,
      source_system VARCHAR(120) NOT NULL,
      external_id VARCHAR(160) NOT NULL,
      person_email VARCHAR(180) NOT NULL,
      person_document VARCHAR(80) NULL,
      person_id VARCHAR(36) NULL,
      event_type VARCHAR(80) NOT NULL,
      title VARCHAR(220) NOT NULL,
      provider_name VARCHAR(160) NOT NULL,
      status VARCHAR(40) NOT NULL,
      occurred_at DATE NULL,
      workload_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
      competency_key VARCHAR(120) NULL,
      suggested_action VARCHAR(80) NOT NULL,
      processing_status VARCHAR(40) NOT NULL,
      applied_entity_type VARCHAR(80) NULL,
      applied_entity_id VARCHAR(36) NULL,
      applied_at DATETIME NULL,
      review_note TEXT NULL,
      raw_payload_json JSON NULL,
      created_at DATETIME NOT NULL,
      created_by_user_id VARCHAR(36) NULL,
      FOREIGN KEY (person_id) REFERENCES people(id),
      FOREIGN KEY (created_by_user_id) REFERENCES users(id),
      UNIQUE KEY unique_learning_event (source_system, external_id)
    )`
    ]
  );

  if (!hasTable) {
    return false;
  }

  return ensureMysqlColumns(
    pool,
    "learning_integration_events",
    [
      "ALTER TABLE learning_integration_events ADD COLUMN applied_entity_type VARCHAR(80) NULL",
      "ALTER TABLE learning_integration_events ADD COLUMN applied_entity_id VARCHAR(36) NULL",
      "ALTER TABLE learning_integration_events ADD COLUMN applied_at DATETIME NULL",
      "ALTER TABLE learning_integration_events ADD COLUMN review_note TEXT NULL"
    ],
    detectMysqlLearningIntegrationSupport
  );
}

function enrichAssignment(db, assignment, customLibraries = []) {
  const cycle = db.cycles.find((item) => item.id === assignment.cycleId);
  const presentedCycle = presentCycle(cycle || {});
  const reviewer = db.users.find((item) => item.id === assignment.reviewerUserId);
  const reviewee = db.people.find((item) => item.id === assignment.revieweePersonId);
  const revieweeManager = reviewee
    ? db.people.find((item) => item.id === reviewee.managerPersonId)
    : null;
  const reviewerPerson = reviewer
    ? db.people.find((item) => item.id === reviewer.personId)
    : null;
  const submission = db.submissions.find((item) => item.assignmentId === assignment.id);

  return {
    ...assignment,
    cycleTitle: presentedCycle.title || "",
    semesterLabel: presentedCycle.semesterLabel || "",
    cycleStatus: presentedCycle.status || "",
    templateId:
      getTemplateDefinitionForCycle({
        cycle: presentedCycle,
        relationshipType: assignment.relationshipType,
        customLibraries
      })?.id || presentedCycle.templateId || questionTemplate.id,
    templateKey:
      getTemplateDefinitionForCycle({
        cycle: presentedCycle,
        relationshipType: assignment.relationshipType,
        customLibraries
      })?.key || resolveTemplateKey(assignment.relationshipType),
    libraryId: presentedCycle.libraryId,
    libraryName: presentedCycle.libraryName,
    weight: evaluationLibrary.weights[assignment.relationshipType] || 0,
    reviewerName: reviewerPerson?.name || "",
    revieweeName: assignment.relationshipType === "company" ? "Empresa" : reviewee?.name || "",
    revieweeArea:
      assignment.relationshipType === "company" ? "Institucional" : reviewee?.area || "",
    revieweeManagerPersonId:
      assignment.relationshipType === "company" ? null : reviewee?.managerPersonId || null,
    revieweeManagerName:
      assignment.relationshipType === "company" ? "" : revieweeManager?.name || "",
    overallScore: submission?.overallScore || null,
    submittedAt: submission?.submittedAt || null
  };
}

function enrichSubmission(db, submission, customLibraries = []) {
  const reviewer = db.users.find((item) => item.id === submission.reviewerUserId);
  const reviewee = db.people.find((item) => item.id === submission.revieweePersonId);
  const assignment = db.assignments.find((item) => item.id === submission.assignmentId);
  const reviewerPerson = reviewer
    ? db.people.find((item) => item.id === reviewer.personId)
    : null;
  const answers = db.answers
    .filter((item) => item.submissionId === submission.id)
    .map((answer) => {
      const question = findQuestionDefinition(answer.questionId, customLibraries);
      return {
        ...answer,
        questionPrompt: question?.prompt || "",
        dimensionTitle: question?.dimensionTitle || ""
      };
    });

  return {
    ...submission,
    relationshipType: assignment?.relationshipType || "peer",
    weight: evaluationLibrary.weights[assignment?.relationshipType || "peer"] || 0,
    weightedScore: Number(
      (
        Number(submission.overallScore) *
        (evaluationLibrary.weights[assignment?.relationshipType || "peer"] || 0)
      ).toFixed(2)
    ),
    reviewerName: reviewerPerson?.name || "",
    revieweeName:
      assignment?.relationshipType === "company" ? "Empresa" : reviewee?.name || "",
    revieweeArea:
      assignment?.relationshipType === "company" ? "Institucional" : reviewee?.area || "",
    revieweeManagerPersonId:
      assignment?.relationshipType === "company" ? null : reviewee?.managerPersonId || null,
    revieweeManagerName:
      assignment?.relationshipType === "company"
        ? "Institucional"
        : db.people.find((item) => item.id === reviewee?.managerPersonId)?.name || "",
    revieweeAcknowledgementStatus: submission.revieweeAcknowledgementStatus || null,
    revieweeAcknowledgementNote: submission.revieweeAcknowledgementNote || "",
    revieweeAcknowledgedAt: submission.revieweeAcknowledgedAt || null,
    answers
  };
}

function presentLearningIntegrationEvent(event, people = []) {
  const person = people.find((item) => item.id === event.personId);
  return {
    ...event,
    personName: person?.name || "",
    processingStatus:
      event.processingStatus || (event.personId ? "ready_for_review" : "needs_review")
  };
}

function buildLearningIntegrationEventRows(payload, people, users, actorUser) {
  const { sourceSystem, events } = normalizeLearningIntegrationPayload(payload);
  const createdAt = new Date().toISOString();

  return events.map((event) => {
    const user = users.find((item) => String(item.email || "").toLowerCase() === event.personEmail);
    const person = people.find((item) => item.id === user?.personId);

    return {
      id: createId("learning_event"),
      ...event,
      sourceSystem,
      personId: person?.id || null,
      processingStatus: person ? "ready_for_review" : "needs_review",
      createdAt,
      createdByUserId: actorUser?.id || null
    };
  });
}

function formatDateOnly(value = new Date()) {
  const parsed = parseDateValue(value) || new Date();
  return parsed.toISOString().slice(0, 10);
}

function addDaysAsDateOnly(value, days) {
  const parsed = parseDateValue(value) || new Date();
  parsed.setDate(parsed.getDate() + days);
  return formatDateOnly(parsed);
}

function resolveLearningIntegrationCompetency(event, competencies = [], requestedCompetencyId = null) {
  if (requestedCompetencyId) {
    return competencies.find((item) => item.id === requestedCompetencyId) || null;
  }

  const competencyKey = String(event.competencyKey || "").trim().toLowerCase();
  if (!competencyKey) {
    return null;
  }

  return (
    competencies.find((item) => String(item.key || "").trim().toLowerCase() === competencyKey) ||
    null
  );
}

function buildLearningIntegrationApplicationPayload(event, payload = {}, competencies = []) {
  const competency = resolveLearningIntegrationCompetency(event, competencies, payload.competencyId);
  const personId = payload.personId || event.personId;

  if (!personId) {
    throw new Error("Evento precisa estar conciliado com uma pessoa antes da aplicacao.");
  }

  if (event.processingStatus === "applied") {
    throw new Error("Evento de aprendizagem ja aplicado.");
  }

  if (event.suggestedAction === "development_record_candidate") {
    const notes = [
      `Origem: ${event.sourceSystem}`,
      `Evento externo: ${event.externalId}`,
      event.workloadHours ? `Carga horaria: ${event.workloadHours}h` : "",
      event.competencyKey ? `Competencia/eixo: ${event.competencyKey}` : "",
      payload.notes || ""
    ]
      .filter(Boolean)
      .join(" | ");

    return {
      entityType: "development_record",
      payload: {
        personId,
        recordType: payload.recordType || "Certificacao",
        title: payload.title || event.title,
        providerName: payload.providerName || event.providerName,
        completedAt: payload.completedAt || event.occurredAt || formatDateOnly(),
        skillSignal: payload.skillSignal || competency?.name || event.competencyKey || event.title,
        notes
      }
    };
  }

  return {
    entityType: "development_plan",
    payload: {
      personId,
      cycleId: payload.cycleId || null,
      competencyId: competency?.id || null,
      focusTitle: payload.focusTitle || event.title,
      actionText:
        payload.actionText ||
        `Concluir ou aplicar o aprendizado de ${event.title} (${event.providerName}).`,
      dueDate: payload.dueDate || event.occurredAt || addDaysAsDateOnly(new Date(), 30),
      expectedEvidence:
        payload.expectedEvidence ||
        "Conclusao do treinamento e aplicacao pratica documentada no PDI."
    }
  };
}

function normalizeFeedbackAcknowledgementStatus(value) {
  if (value === FEEDBACK_ACKNOWLEDGEMENT_STATUS.agreed) {
    return FEEDBACK_ACKNOWLEDGEMENT_STATUS.agreed;
  }
  if (value === FEEDBACK_ACKNOWLEDGEMENT_STATUS.disagreed) {
    return FEEDBACK_ACKNOWLEDGEMENT_STATUS.disagreed;
  }
  throw new Error("Escolha Concordo ou Discordo para registrar o retorno.");
}

function validateFeedbackAcknowledgementPayload(payload) {
  const status = normalizeFeedbackAcknowledgementStatus(payload?.status);
  const note = String(payload?.note || "").trim();

  if (status === FEEDBACK_ACKNOWLEDGEMENT_STATUS.disagreed && !note) {
    throw new Error("Explique o motivo da discordancia antes de enviar.");
  }

  return {
    status,
    note
  };
}

function getAnsweredScaleScores(answers) {
  return answers
    .map((item) => Number(item.score))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function validateEvaluationAnswers(answers, templateDefinition) {
  if (!Array.isArray(answers) || !answers.length) {
    throw new Error("Avaliacao precisa conter respostas.");
  }

  for (const question of templateDefinition.questions.filter((item) => item.isRequired)) {
    const answer = answers.find((item) => item.questionId === question.id);
    if (!answer) {
      throw new Error("Existem perguntas obrigatorias sem resposta.");
    }

    if (question.inputType === "text") {
      if (!String(answer.textValue || "").trim()) {
        throw new Error("Perguntas de texto obrigatorias precisam ser respondidas.");
      }
      continue;
    }

    if (question.inputType === "multi-select") {
      const selectedOptions = Array.isArray(answer.selectedOptions)
        ? answer.selectedOptions.filter(Boolean)
        : [];
      if (!selectedOptions.length) {
        throw new Error("Perguntas de multipla escolha exigem ao menos uma opcao.");
      }
      const validOptions = new Set((question.options || []).map((item) => item.value));
      if (selectedOptions.some((item) => !validOptions.has(item))) {
        throw new Error("Existe uma opcao invalida em pergunta de multipla escolha.");
      }
      continue;
    }

    const score = Number(answer.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new Error("Todas as respostas de escala devem ter score entre 1 e 5.");
    }
    if (
      question.collectEvidenceOnExtreme &&
      (score === 1 || score === 5) &&
      !String(answer.evidenceNote || "").trim()
    ) {
      throw new Error("Notas extremas exigem comentario de evidencia.");
    }
  }
}

function getManagerPerson(people, person) {
  return people.find((candidate) => candidate.id === person.managerPersonId) || null;
}

function getUserByPersonId(users, personId) {
  return users.find((candidate) => candidate.personId === personId) || null;
}

function pushAssignment(assignments, nextAssignment) {
  const normalizedAssignment = {
    reminderCount: 0,
    lastReminderSentAt: null,
    ...nextAssignment
  };
  const exists = assignments.some(
    (item) =>
      item.cycleId === normalizedAssignment.cycleId &&
      item.reviewerUserId === normalizedAssignment.reviewerUserId &&
      item.revieweePersonId === normalizedAssignment.revieweePersonId &&
      item.relationshipType === normalizedAssignment.relationshipType
  );

  if (!exists) {
    assignments.push(normalizedAssignment);
  }
}

function removeCrossFunctionalAssignment(assignments, cycleId, reviewerUserId, revieweePersonId = null) {
  for (let index = assignments.length - 1; index >= 0; index -= 1) {
    const item = assignments[index];
    if (
      item.cycleId === cycleId &&
      item.reviewerUserId === reviewerUserId &&
      item.relationshipType === "cross-functional" &&
      (revieweePersonId ? item.revieweePersonId === revieweePersonId : true)
    ) {
      assignments.splice(index, 1);
    }
  }
}

function upsertCrossFunctionalAssignment(assignments, {
  cycleId,
  reviewerUserId,
  revieweePersonId,
  dueDate
}) {
  removeCrossFunctionalAssignment(assignments, cycleId, reviewerUserId, revieweePersonId);
  pushAssignment(assignments, {
    id: createId("assignment"),
    cycleId,
    reviewerUserId,
    revieweePersonId,
    relationshipType: "cross-functional",
    projectContext: "Colaboracao transversal entre areas",
    collaborationContext:
      "Feedback transversal gerado automaticamente para colaboracao entre areas da mesma unidade.",
    status: "pending",
    dueDate
  });
}

function generateAssignments({ users, people, cycleId, dueDate, crossFunctionalPlan = null }) {
  const eligibleActors = getEligibleEvaluationActors(users, people);
  const resolvedCrossFunctionalPlan =
    crossFunctionalPlan ||
    buildCrossFunctionalPlan({
      users,
      people,
      cycleId
    });
  const crossFunctionalPairsByReviewer = resolvedCrossFunctionalPlan.pairings.reduce((acc, pairing) => {
    acc[pairing.reviewerUserId] = acc[pairing.reviewerUserId] || [];
    acc[pairing.reviewerUserId].push(pairing);
    return acc;
  }, {});

  const assignments = [];

  for (const actor of eligibleActors) {
    const sameUnitCandidates = buildSameUnitCandidates(eligibleActors, actor);
    const sameAreaCandidates = sameUnitCandidates.filter(
      (candidate) => candidate.person.area === actor.person.area
    );
    const anyPeerCandidates = eligibleActors.filter((candidate) => candidate.id !== actor.id);
    const internalClientCandidates = eligibleActors.filter(
      (candidate) =>
        candidate.id !== actor.id &&
        candidate.person.employmentType !== "consultant" &&
        candidate.person.area !== actor.person.area
    );
    const consultantCandidates = eligibleActors.filter(
      (candidate) =>
        candidate.id !== actor.id && candidate.person.employmentType === "consultant"
    );
    const internalCandidates = eligibleActors.filter(
      (candidate) =>
        candidate.id !== actor.id && candidate.person.employmentType !== "consultant"
    );
    const managerPerson = getManagerPerson(people, actor.person);
    const managerUser = managerPerson ? getUserByPersonId(users, managerPerson.id) : null;
    const peerCandidate = sameAreaCandidates[0] || anyPeerCandidates[0] || null;
    const crossFunctionalCandidates = crossFunctionalPairsByReviewer[actor.id] || [];
    const primaryCrossFunctionalCandidate = crossFunctionalCandidates[0] || null;
    const clientInternalCandidate =
      internalClientCandidates[0] ||
      (primaryCrossFunctionalCandidate
        ? eligibleActors.find((candidate) => candidate.person.id === primaryCrossFunctionalCandidate.revieweePersonId)
        : null) ||
      peerCandidate ||
      null;
    const clientExternalCandidate =
      actor.person.employmentType === "consultant"
        ? internalCandidates[0] || null
        : consultantCandidates[0] || null;

    pushAssignment(assignments, {
      id: createId("assignment"),
      cycleId,
      reviewerUserId: actor.id,
      revieweePersonId: actor.person.id,
      relationshipType: "self",
      projectContext: "Reflexao individual",
      collaborationContext: "Autoavaliacao semestral do colaborador.",
      status: "pending",
      dueDate
    });

    pushAssignment(assignments, {
      id: createId("assignment"),
      cycleId,
      reviewerUserId: actor.id,
      revieweePersonId: actor.person.id,
      relationshipType: "company",
      projectContext: "Experiencia institucional",
      collaborationContext: "Avaliacao da empresa e da experiencia geral do colaborador.",
      status: "pending",
      dueDate
    });

    if (managerPerson && managerPerson.id !== actor.person.id) {
      pushAssignment(assignments, {
        id: createId("assignment"),
        cycleId,
        reviewerUserId: actor.id,
        revieweePersonId: managerPerson.id,
        relationshipType: "leader",
        projectContext: "Avaliacao da lideranca imediata",
        collaborationContext: "Leitura da lideranca no semestre.",
        status: "pending",
        dueDate
      });
    }

    if (managerUser && managerUser.id !== actor.id) {
      pushAssignment(assignments, {
        id: createId("assignment"),
        cycleId,
        reviewerUserId: managerUser.id,
        revieweePersonId: actor.person.id,
        relationshipType: "manager",
        projectContext: "Rotina da area",
        collaborationContext: "Avaliacao gerencial semestral.",
        status: "pending",
        dueDate
      });
    }

    crossFunctionalCandidates.forEach((crossFunctionalCandidate) => {
      pushAssignment(assignments, {
        id: createId("assignment"),
        cycleId,
        reviewerUserId: actor.id,
        revieweePersonId: crossFunctionalCandidate.revieweePersonId,
        relationshipType: "cross-functional",
        projectContext: "Colaboracao transversal entre areas",
        collaborationContext:
          "Feedback transversal gerado automaticamente para colaboracao entre areas da mesma unidade.",
        status: "pending",
        dueDate
      });
    });

    if (clientInternalCandidate) {
      pushAssignment(assignments, {
        id: createId("assignment"),
        cycleId,
        reviewerUserId: actor.id,
        revieweePersonId: clientInternalCandidate.person.id,
        relationshipType: "client-internal",
        projectContext: "Consumo interno entre areas",
        collaborationContext:
          "Leitura da area cliente sobre atendimento, parceria e valor percebido na entrega.",
        status: "pending",
        dueDate
      });
    }

    if (clientExternalCandidate) {
      pushAssignment(assignments, {
        id: createId("assignment"),
        cycleId,
        reviewerUserId: actor.id,
        revieweePersonId: clientExternalCandidate.person.id,
        relationshipType: "client-external",
        projectContext:
          actor.person.employmentType === "consultant"
            ? "Percepcao da consultoria sobre a operacao"
            : "Relacao com consultoria ou parceiro",
        collaborationContext:
          actor.person.employmentType === "consultant"
            ? "Leitura externa sobre confiabilidade, atendimento e resultado percebido pelo cliente."
            : "Leitura da experiencia com consultoria, parceiro ou cliente externo no ciclo.",
        status: "pending",
        dueDate
      });
    }
  }

  return assignments;
}

function mapAssignmentStatusToRaterStatus(status) {
  if (status === "submitted") {
    return "completed";
  }

  if (status === "expired") {
    return "expired";
  }

  return "pending";
}

function buildCycleParticipantsAndRaters({ assignments, users, people, cycleId }) {
  const participantMap = new Map();
  const raterMap = new Map();

  assignments
    .filter((assignment) => assignment.cycleId === cycleId)
    .forEach((assignment) => {
      const reviewee = people.find((person) => person.id === assignment.revieweePersonId);
      const reviewer = users.find((user) => user.id === assignment.reviewerUserId);

      if (!reviewee || !reviewer) {
        return;
      }

      const participantKey = `${cycleId}:${reviewee.id}`;
      if (!participantMap.has(participantKey)) {
        participantMap.set(participantKey, {
          id: createId("cycle_participant"),
          cycleId,
          personId: reviewee.id,
          status: "active"
        });
      }

      const raterKey = [
        cycleId,
        reviewee.id,
        reviewer.id,
        assignment.relationshipType
      ].join(":");

      if (!raterMap.has(raterKey)) {
        raterMap.set(raterKey, {
          id: createId("cycle_rater"),
          cycleId,
          participantPersonId: reviewee.id,
          raterUserId: reviewer.id,
          relationshipType: assignment.relationshipType,
          status: mapAssignmentStatusToRaterStatus(assignment.status)
        });
      }
    });

  return {
    participants: Array.from(participantMap.values()),
    raters: Array.from(raterMap.values())
  };
}

function hydrateCycleStructure(db, cycleId) {
  const scopedAssignments = db.assignments.filter((assignment) => assignment.cycleId === cycleId);
  if (!scopedAssignments.length) {
    return;
  }

  const existingParticipantKeys = new Set(
    (db.cycleParticipants || []).map((participant) => `${participant.cycleId}:${participant.personId}`)
  );
  const existingRaterKeys = new Set(
    (db.cycleRaters || []).map(
      (rater) =>
        `${rater.cycleId}:${rater.participantPersonId}:${rater.raterUserId}:${rater.relationshipType}`
    )
  );
  const generatedStructure = buildCycleParticipantsAndRaters({
    assignments: scopedAssignments,
    users: db.users,
    people: db.people,
    cycleId
  });

  generatedStructure.participants.forEach((participant) => {
    const key = `${participant.cycleId}:${participant.personId}`;
    if (!existingParticipantKeys.has(key)) {
      db.cycleParticipants.push(participant);
      existingParticipantKeys.add(key);
    }
  });

  generatedStructure.raters.forEach((rater) => {
    const key = `${rater.cycleId}:${rater.participantPersonId}:${rater.raterUserId}:${rater.relationshipType}`;
    const existingRater = db.cycleRaters.find(
      (item) =>
        item.cycleId === rater.cycleId &&
        item.participantPersonId === rater.participantPersonId &&
        item.raterUserId === rater.raterUserId &&
        item.relationshipType === rater.relationshipType
    );

    if (existingRater) {
      existingRater.status = rater.status;
      return;
    }

    if (!existingRaterKeys.has(key)) {
      db.cycleRaters.push(rater);
      existingRaterKeys.add(key);
    }
  });
}

function rebuildCycleStructure(db, cycleId) {
  db.cycleParticipants = (db.cycleParticipants || []).filter((item) => item.cycleId !== cycleId);
  db.cycleRaters = (db.cycleRaters || []).filter((item) => item.cycleId !== cycleId);
  hydrateCycleStructure(db, cycleId);
}

function presentCycleParticipantStructure(db, cycleId, customLibraries = []) {
  const cycle = presentCycle(db.cycles.find((item) => item.id === cycleId) || {});
  const crossFunctionalOperation = buildCrossFunctionalOperationView({
    users: db.users || [],
    people: db.people || [],
    cycleId,
    cycle,
    cycles: db.cycles || [],
    pairings: (db.evaluationPairings || []).filter((item) => item.cycleId === cycleId),
    exceptions: db.evaluationPairingExceptions || [],
    allPairings: db.allPairings || db.evaluationPairings || []
  });
  const participantRows = (db.cycleParticipants || []).filter(
    (participant) => participant.cycleId === cycleId
  );
  const raterRows = (db.cycleRaters || []).filter((rater) => rater.cycleId === cycleId);
  const cycleAssignments = (db.assignments || []).filter((assignment) => assignment.cycleId === cycleId);

  const participants = participantRows
    .map((participant) => {
      const person = db.people.find((item) => item.id === participant.personId);
      const manager = person?.managerPersonId
        ? db.people.find((item) => item.id === person.managerPersonId)
        : null;
      const raters = raterRows
        .filter((rater) => rater.participantPersonId === participant.personId)
        .map((rater) => {
          const user = db.users.find((item) => item.id === rater.raterUserId);
          const raterPerson = user
            ? db.people.find((item) => item.id === user.personId)
            : null;
          const template = getTemplateDefinitionForCycle({
            cycle,
            relationshipType: rater.relationshipType,
            customLibraries
          });

          return {
            ...rater,
            raterPersonId: raterPerson?.id || null,
            raterName: raterPerson?.name || "",
            raterArea: raterPerson?.area || "",
            templateId: template?.id || null,
            templateName: template?.modelName || "",
            statusLabel: rater.status
          };
        })
        .sort((left, right) => left.raterName.localeCompare(right.raterName, "pt-BR"));

      return {
        ...participant,
        personId: participant.personId,
        personName: person?.name || "",
        personArea: person?.area || "",
        personRoleTitle: person?.roleTitle || "",
        personWorkUnit: person?.workUnit || DEFAULT_WORK_UNIT,
        personWorkMode: normalizeWorkMode(person?.workMode),
        managerName: manager?.name || "",
        totalRaters: raters.length,
        completedRaters: raters.filter((rater) => rater.status === "completed").length,
        pendingRaters: raters.filter((rater) => rater.status === "pending").length,
        raters
      };
    })
    .sort((left, right) => left.personName.localeCompare(right.personName, "pt-BR"));
  const compliance = buildCycleComplianceSummary(cycleAssignments, cycle.status);
  const delinquents = cycleAssignments
    .filter((assignment) => isAssignmentDelinquent(assignment, cycle.status))
    .map((assignment) => presentDelinquentAssignment(assignment, db, cycle.status))
    .sort((left, right) => right.daysOverdue - left.daysOverdue || left.reviewerName.localeCompare(right.reviewerName, "pt-BR"));

  return {
    cycle: {
      id: cycle.id,
      title: cycle.title,
      semesterLabel: cycle.semesterLabel,
      status: cycle.status,
      dueDate: cycle.dueDate,
      transversalConfig: cycle.transversalConfig,
      participantCount: participants.length,
      raterCount: raterRows.length
    },
    compliance,
    delinquents,
    participants,
    transversal: crossFunctionalOperation,
    relationshipSummary: Object.entries(
      raterRows.reduce((summary, rater) => {
        summary[rater.relationshipType] = (summary[rater.relationshipType] || 0) + 1;
        return summary;
      }, {})
    ).map(([relationshipType, total]) => ({ relationshipType, total }))
  };
}

function buildAggregateResponses(responses) {
  const aggregateTypes = ["leader", "company", "client-internal", "client-external"];

  return aggregateTypes
    .map((relationshipType) => {
      const typeResponses = responses.filter((item) => item.relationshipType === relationshipType);
      if (typeResponses.length < MIN_ANONYMOUS_AGGREGATE_RESPONSES) {
        return null;
      }

      const answers = typeResponses
        .flatMap((item) => item.answers)
        .filter((answer) => Number.isFinite(Number(answer.score)));
      const questionAverages = Object.values(
        answers.reduce((acc, answer) => {
          const entry = acc[answer.questionId] || {
            questionId: answer.questionId,
            questionPrompt: answer.questionPrompt,
            dimensionTitle: answer.dimensionTitle,
            total: 0,
            scores: []
          };
          entry.total += 1;
          entry.scores.push(Number(answer.score));
          acc[answer.questionId] = entry;
          return acc;
        }, {})
      ).map((entry) => ({
        questionId: entry.questionId,
        questionPrompt: entry.questionPrompt,
        dimensionTitle: entry.dimensionTitle,
        totalResponses: entry.total,
        averageScore: Number(average(entry.scores).toFixed(2))
      }));

      return {
        relationshipType,
        totalResponses: typeResponses.length,
        averageScore: Number(
          average(typeResponses.map((item) => Number(item.overallScore))).toFixed(2)
        ),
        questionAverages
      };
    })
    .filter(Boolean);
}

function buildAggregateResponsesByCycle(responses) {
  return Object.entries(
    responses.reduce((acc, response) => {
      const cycleResponses = acc[response.cycleId] || [];
      cycleResponses.push(response);
      acc[response.cycleId] = cycleResponses;
      return acc;
    }, {})
  ).flatMap(([cycleId, cycleResponses]) =>
    buildAggregateResponses(cycleResponses).map((entry) => ({
      ...entry,
      cycleId
    }))
  );
}

function buildCycleReportSnapshots(cycleId, responses) {
  return buildAggregateResponses(responses)
    .filter((entry) => entry.totalResponses > 0)
    .map((entry) => ({
      id: createId("cycle_report"),
      cycleId,
      relationshipType: entry.relationshipType,
      totalResponses: entry.totalResponses,
      averageScore: entry.averageScore,
      questionAverages: entry.questionAverages,
      generatedAt: new Date().toISOString()
    }));
}

function buildQuestionDistributions(responses) {
  return Object.entries(
    responses.reduce((acc, response) => {
      const relationshipEntry = acc[response.relationshipType] || {
        relationshipType: response.relationshipType,
        totalResponses: 0,
        questions: {}
      };
      relationshipEntry.totalResponses += 1;

      for (const answer of response.answers) {
        if (!Number.isFinite(Number(answer.score))) {
          continue;
        }
        const questionEntry = relationshipEntry.questions[answer.questionId] || {
          questionId: answer.questionId,
          questionPrompt: answer.questionPrompt,
          dimensionTitle: answer.dimensionTitle,
          totalAnswers: 0,
          distribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          }
        };

        const scoreKey = String(Number(answer.score));
        questionEntry.totalAnswers += 1;
        questionEntry.distribution[scoreKey] =
          (questionEntry.distribution[scoreKey] || 0) + 1;
        relationshipEntry.questions[answer.questionId] = questionEntry;
      }

      acc[response.relationshipType] = relationshipEntry;
      return acc;
    }, {})
  ).map(([, relationshipEntry]) => ({
    relationshipType: relationshipEntry.relationshipType,
    totalResponses: relationshipEntry.totalResponses,
    questions: Object.values(relationshipEntry.questions).map((question) => ({
      questionId: question.questionId,
      questionPrompt: question.questionPrompt,
      dimensionTitle: question.dimensionTitle,
      totalAnswers: question.totalAnswers,
      options: Object.entries(question.distribution).map(([value, total]) => ({
        value: Number(value),
        label:
          findQuestionDefinition(question.questionId)?.scaleProfile === "satisfaction"
            ? evaluationLibrary.scale.find((item) => item.value === Number(value))?.label
            : getTemplateForRelationship(relationshipEntry.relationshipType)?.policy?.scale?.find(
                (item) => item.value === Number(value)
              )?.label || value,
        total,
        percentage: question.totalAnswers
          ? Number(((total / question.totalAnswers) * 100).toFixed(1))
          : 0
      }))
    }))
  })).filter(
    (group) =>
      !isAnonymousRelationship(group.relationshipType) ||
      group.totalResponses >= MIN_ANONYMOUS_AGGREGATE_RESPONSES
  );
}

function calculatePercentage(value, total) {
  if (!total) {
    return 0;
  }

  return Math.round((Number(value) / Number(total)) * 100);
}

function buildSatisfactionByAreaSeries(people) {
  return Object.values(
    getPeopleWithSatisfactionScores(people).reduce((acc, person) => {
      const entry = acc[person.area] || {
        area: person.area,
        scores: [],
        peopleCount: 0
      };
      entry.scores.push(Number(person.satisfactionScore));
      entry.peopleCount += 1;
      acc[person.area] = entry;
      return acc;
    }, {})
  )
    .map((entry) => {
      const scoreValue = Number(average(entry.scores).toFixed(1));
      return {
        area: entry.area,
        peopleCount: entry.peopleCount,
        score: scoreValue.toFixed(1),
        scoreValue,
        percentage: calculatePercentage(scoreValue, 5)
      };
    })
    .sort((left, right) => right.scoreValue - left.scoreValue);
}

function buildEvaluationMixSeries(assignments) {
  return Object.entries(
    assignments.reduce((acc, assignment) => {
      acc[assignment.relationshipType] = (acc[assignment.relationshipType] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([type, total]) => ({
      type,
      total,
      percentage: calculatePercentage(total, assignments.length)
    }))
    .sort((left, right) => right.total - left.total);
}

function buildEvaluationResultsSummarySeries(assignments, responses) {
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const entry = acc[assignment.relationshipType] || {
      relationshipType: assignment.relationshipType,
      totalAssignments: 0,
      totalResponses: 0,
      scores: []
    };
    entry.totalAssignments += 1;
    acc[assignment.relationshipType] = entry;
    return acc;
  }, {});

  for (const response of responses) {
    const entry = groupedAssignments[response.relationshipType] || {
      relationshipType: response.relationshipType,
      totalAssignments: 0,
      totalResponses: 0,
      scores: []
    };
    entry.totalResponses += 1;
    if (Number.isFinite(Number(response.overallScore))) {
      entry.scores.push(Number(response.overallScore));
    }
    groupedAssignments[response.relationshipType] = entry;
  }

  return Object.values(groupedAssignments)
    .map((entry) => {
      const averageScore = entry.scores.length
        ? Number(average(entry.scores).toFixed(2))
        : null;
      const adherencePercentage = calculatePercentage(
        entry.totalResponses,
        entry.totalAssignments || entry.totalResponses
      );

      return {
        relationshipType: entry.relationshipType,
        totalAssignments: entry.totalAssignments,
        totalResponses: entry.totalResponses,
        adherencePercentage,
        averageScore,
        averageScoreLabel: averageScore === null ? "-" : averageScore.toFixed(1),
        tone:
          averageScore === null
            ? "neutral"
            : averageScore >= 4.3
              ? "positive"
              : averageScore >= 3.7
                ? "warning"
                : "critical"
      };
    })
    .filter(
      (item) =>
        !isAnonymousRelationship(item.relationshipType) ||
        item.totalResponses >= MIN_ANONYMOUS_AGGREGATE_RESPONSES
    )
    .sort((left, right) => {
      const leftScore = left.averageScore === null ? -1 : left.averageScore;
      const rightScore = right.averageScore === null ? -1 : right.averageScore;
      return rightScore - leftScore || right.totalResponses - left.totalResponses;
    });
}

function buildAssignmentStatusSeries(assignments) {
  const labelMap = {
    pending: "Pendentes",
    submitted: "Concluidas"
  };

  return Object.entries(
    assignments.reduce((acc, assignment) => {
      acc[assignment.status] = (acc[assignment.status] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([status, total]) => ({
      status,
      label: labelMap[status] || status,
      total,
      percentage: calculatePercentage(total, assignments.length)
    }))
    .sort((left, right) => right.total - left.total);
}

function buildDevelopmentByTypeSeries(records) {
  return Object.entries(
    records.reduce((acc, record) => {
      acc[record.recordType] = (acc[record.recordType] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([type, total]) => ({
      type,
      total,
      percentage: calculatePercentage(total, records.length)
    }))
    .sort((left, right) => right.total - left.total);
}

function getCyclePeriodMeta(cycle, timeGrouping = "semester") {
  const cycleDate = cycle?.dueDate ? new Date(cycle.dueDate) : null;
  const year = cycleDate && !Number.isNaN(cycleDate.getTime()) ? cycleDate.getUTCFullYear() : 0;
  const month = cycleDate && !Number.isNaN(cycleDate.getTime()) ? cycleDate.getUTCMonth() : 0;
  const quarter = Math.floor(month / 3) + 1;
  const semester = month < 6 ? 1 : 2;

  if (timeGrouping === "year") {
    return {
      key: String(year || cycle?.semesterLabel || cycle?.title || "Sem data"),
      label: String(year || cycle?.semesterLabel || cycle?.title || "Sem data"),
      sortValue: year || 0
    };
  }

  if (timeGrouping === "quarter") {
    return {
      key: `${year || "Sem data"}-T${quarter}`,
      label: year ? `${year} T${quarter}` : cycle?.semesterLabel || cycle?.title || "Sem data",
      sortValue: (year || 0) * 10 + quarter
    };
  }

  return {
    key: `${year || "Sem data"}.${semester}`,
    label: year ? `${year}.${semester}` : cycle?.semesterLabel || cycle?.title || "Sem data",
    sortValue: (year || 0) * 10 + semester
  };
}

function buildCycleTimelineSeries({ cycles, assignments, responses, timeGrouping = "semester" }) {
  const cyclesById = new Map(cycles.map((cycle) => [cycle.id, cycle]));

  const grouped = {};

  for (const cycle of cycles) {
    const meta = getCyclePeriodMeta(cycle, timeGrouping);
    grouped[meta.key] = grouped[meta.key] || {
      periodKey: meta.key,
      label: meta.label,
      sortValue: meta.sortValue,
      cycleCount: 0,
      totalAssignments: 0,
      submittedAssignments: 0,
      pendingAssignments: 0,
      totalResponses: 0
    };
    grouped[meta.key].cycleCount += 1;
  }

  for (const assignment of assignments) {
    const cycle = cyclesById.get(assignment.cycleId);
    if (!cycle) {
      continue;
    }
    const meta = getCyclePeriodMeta(cycle, timeGrouping);
    grouped[meta.key] = grouped[meta.key] || {
      periodKey: meta.key,
      label: meta.label,
      sortValue: meta.sortValue,
      cycleCount: 0,
      totalAssignments: 0,
      submittedAssignments: 0,
      pendingAssignments: 0,
      totalResponses: 0
    };
    grouped[meta.key].totalAssignments += 1;
    if (assignment.status === "submitted") {
      grouped[meta.key].submittedAssignments += 1;
    } else {
      grouped[meta.key].pendingAssignments += 1;
    }
  }

  for (const response of responses) {
    const cycle = cyclesById.get(response.cycleId);
    if (!cycle) {
      continue;
    }
    const meta = getCyclePeriodMeta(cycle, timeGrouping);
    grouped[meta.key] = grouped[meta.key] || {
      periodKey: meta.key,
      label: meta.label,
      sortValue: meta.sortValue,
      cycleCount: 0,
      totalAssignments: 0,
      submittedAssignments: 0,
      pendingAssignments: 0,
      totalResponses: 0
    };
    grouped[meta.key].totalResponses += 1;
  }

  const rows = Object.values(grouped)
    .map((entry) => ({
      ...entry,
      adherencePercentage: calculatePercentage(
        entry.submittedAssignments,
        entry.totalAssignments
      )
    }))
    .filter((entry) => entry.cycleCount || entry.totalAssignments || entry.totalResponses)
    .sort((left, right) => left.sortValue - right.sortValue);

  const maxAssignments = Math.max(...rows.map((item) => item.totalAssignments), 1);

  return rows.map((entry) => ({
    ...entry,
    volumePercentage: calculatePercentage(entry.totalAssignments, maxAssignments)
  }));
}

function buildDashboardPayload({
  mode,
  notice,
  scopeLabel,
  cycles,
  people,
  assignments,
  applauseEntries,
  developmentRecords,
  responses,
  evaluationHighlights,
  availableAreas = [],
  selectedArea = null,
  timeGrouping = "semester"
}) {
  const submittedAssignments = assignments.filter((item) => item.status === "submitted").length;
  const pendingAssignments = assignments.filter((item) => item.status === "pending").length;
  const peopleCount = people.length;
  const avgSatisfaction = averageSatisfactionScore(people);
  const peopleWithDevelopment = new Set(developmentRecords.map((item) => item.personId)).size;
  const peopleWithApplause = new Set(applauseEntries.map((item) => item.receiverPersonId)).size;

  return {
    mode,
    notice,
    scopeLabel,
    selectedArea,
    areaOptions: availableAreas,
    scopeSummary: {
      peopleCount,
      pendingAssignments,
      submittedAssignments,
      totalAssignments: assignments.length,
      developmentRecords: developmentRecords.length,
      applauseEntries: applauseEntries.length
    },
    cards: [
      {
        label: "Satisfacao media",
        value: avgSatisfaction === null ? "-" : avgSatisfaction.toFixed(1),
        trend: scopeLabel
      },
      {
        label: "Pessoas no recorte",
        value: String(peopleCount),
        trend: "Escopo aplicado ao dashboard"
      },
      {
        label: "Adesao ao ciclo",
        value: `${calculatePercentage(submittedAssignments, assignments.length)}%`,
        trend: `${submittedAssignments} concluidas de ${assignments.length || 0}`
      },
      {
        label: "Aplause validados",
        value: String(applauseEntries.length),
        trend: "Reconhecimentos considerados no recorte"
      },
      {
        label: "Registros de desenvolvimento",
        value: String(developmentRecords.length),
        trend: "Historico profissional considerado"
      }
    ],
    donutMetrics: [
      {
        key: "adherence",
        label: "Adesao ao ciclo",
        percentage: calculatePercentage(submittedAssignments, assignments.length),
        value: submittedAssignments,
        total: assignments.length,
        detail: "Assignments concluidos"
      },
      {
        key: "development",
        label: "Cobertura de desenvolvimento",
        percentage: calculatePercentage(peopleWithDevelopment, peopleCount),
        value: peopleWithDevelopment,
        total: peopleCount,
        detail: "Pessoas com historico registrado"
      },
      {
        key: "applause",
        label: "Pessoas reconhecidas",
        percentage: calculatePercentage(peopleWithApplause, peopleCount),
        value: peopleWithApplause,
        total: peopleCount,
        detail: "Pessoas com Aplause no recorte"
      }
    ],
    satisfactionByArea: buildSatisfactionByAreaSeries(people),
    evaluationHighlights,
    responseDistributions: buildQuestionDistributions(responses),
    evaluationMix: buildEvaluationMixSeries(assignments),
    evaluationResultsSummary: buildEvaluationResultsSummarySeries(assignments, responses),
    assignmentStatus: buildAssignmentStatusSeries(assignments),
    developmentByType: buildDevelopmentByTypeSeries(developmentRecords),
    cycleTimeline: buildCycleTimelineSeries({
      cycles,
      assignments,
      responses,
      timeGrouping
    }),
    timeGrouping
  };
}

function filterIndividualResponses(responses, actorUser) {
  const visibleTypes = isOrgWideUser(actorUser)
    ? ["peer", "manager", "cross-functional", "self"]
    : ["peer", "manager", "cross-functional"];

  return responses.filter((response) => {
    if (!visibleTypes.includes(response.relationshipType)) {
      return false;
    }

    if (isOrgWideUser(actorUser)) {
      return true;
    }

    if (isManagerUser(actorUser)) {
      return (
        response.revieweeManagerPersonId === actorUser.person.id ||
        response.reviewerUserId === actorUser.id
      );
    }

    return response.reviewerUserId === actorUser.id;
  });
}

function buildResponsesBundle(responses, actorUser, options = {}) {
  const { cycles = [], cycleReports = [] } = options;
  const aggregateSource = isOrgWideUser(actorUser)
    ? responses
    : isManagerUser(actorUser)
      ? responses.filter((response) => response.revieweeManagerPersonId === actorUser.person.id)
      : [];

  const processedCycleIds = new Set(
    cycles
      .filter((cycle) => cycle.status === CYCLE_STATUS.processed)
      .map((cycle) => cycle.id)
  );
  const dynamicAggregateSource = aggregateSource.filter(
    (response) => !processedCycleIds.has(response.cycleId)
  );
  const scopedSnapshots = isOrgWideUser(actorUser)
    ? cycleReports.filter((snapshot) => processedCycleIds.has(snapshot.cycleId))
    : [];
  const liveAggregateResponses = buildAggregateResponses(dynamicAggregateSource);
  const liveCycleAggregateResponses = buildAggregateResponsesByCycle(dynamicAggregateSource);

  return {
    individualResponses: filterIndividualResponses(responses, actorUser),
    aggregateResponses: [...liveAggregateResponses, ...scopedSnapshots],
    cycleAggregateResponses: [...liveCycleAggregateResponses, ...scopedSnapshots],
    reportSnapshots: scopedSnapshots
  };
}

function createAnonymousSubmissionPayload(assignment, payload, templateDefinition) {
  const scaleScores = getAnsweredScaleScores(payload.answers);

  return {
    id: createId("anonymous_submission"),
    assignmentId: assignment.id,
    cycleId: assignment.cycleId,
    revieweePersonId: assignment.revieweePersonId,
    relationshipType: assignment.relationshipType,
    overallScore: scaleScores.length ? Number(average(scaleScores).toFixed(2)) : null,
    strengthsNote: payload.strengthsNote || "",
    developmentNote: payload.developmentNote || "",
    submittedAt: new Date().toISOString(),
    answers: payload.answers.map((answer) => {
      const question = templateDefinition.questions.find(
        (item) => item.id === answer.questionId
      );

      return {
        id: createId("anonymous_answer"),
        questionId: answer.questionId,
        score: Number.isFinite(Number(answer.score)) ? Number(answer.score) : null,
        evidenceNote: answer.evidenceNote || "",
        textValue: answer.textValue || "",
        selectedOptions: Array.isArray(answer.selectedOptions) ? answer.selectedOptions : [],
        answerType: question?.inputType || "scale",
        questionPrompt: question?.prompt || "",
        dimensionTitle: question?.dimensionTitle || ""
      };
    })
  };
}

function getFeedbackRequestItems(db, requestId) {
  return db.feedbackRequestItems.filter((item) => item.requestId === requestId);
}

function presentFeedbackRequest(db, request) {
  const cycle = db.cycles.find((item) => item.id === request.cycleId);
  const requester = db.users.find((item) => item.id === request.requesterUserId);
  const requesterPerson = requester
    ? db.people.find((item) => item.id === requester.personId)
    : null;
  const reviewee = db.people.find((item) => item.id === request.revieweePersonId);
  const decidedByUser = request.decidedByUserId
    ? db.users.find((item) => item.id === request.decidedByUserId)
    : null;
  const decidedByPerson = decidedByUser
    ? db.people.find((item) => item.id === decidedByUser.personId)
    : null;

  return {
    ...request,
    cycleTitle: cycle?.title || "",
    semesterLabel: cycle?.semesterLabel || "",
    cycleStatus: cycle?.status || "",
    requesterName: requesterPerson?.name || "",
    revieweeName: reviewee?.name || "",
    decidedByName: decidedByPerson?.name || "",
    providers: getFeedbackRequestItems(db, request.id).map((item) => ({
      ...item,
      providerName: db.people.find((person) => person.id === item.providerPersonId)?.name || ""
    }))
  };
}

function createAuditPayload({
  action,
  actorUser,
  category,
  detail,
  entityId,
  entityLabel,
  entityType,
  summary,
  createdAt = new Date().toISOString()
}) {
  return {
    id: createId("audit"),
    category,
    action,
    entityType,
    entityId,
    entityLabel,
    actorUserId: actorUser?.id || null,
    actorName: actorUser?.person?.name || actorUser?.email || "Sistema",
    actorRoleKey: actorUser?.roleKey || "system",
    summary,
    detail,
    createdAt
  };
}

function pushAuditLog(auditLogs, payload) {
  auditLogs.unshift(createAuditPayload(payload));
}

function filterAuditLogsForUser(auditLogs, actorUser, options = {}) {
  const allowedCategories = getAuditCategoriesForUser(actorUser);
  if (!allowedCategories.length) {
    return [];
  }

  const { category = null, limit = 40 } = options;
  return auditLogs
    .filter(
      (item) =>
        allowedCategories.includes(item.category) && (!category || item.category === category)
    )
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, limit);
}

async function insertAuditLog(target, payload) {
  const entry = createAuditPayload(payload);
  await target.query(
    `INSERT INTO audit_logs
     (id, category, action_key, entity_type, entity_id, entity_label, actor_user_id,
      actor_name, actor_role_key, summary_text, detail_text, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.category,
      entry.action,
      entry.entityType,
      entry.entityId,
      entry.entityLabel,
      entry.actorUserId,
      entry.actorName,
      entry.actorRoleKey,
      entry.summary,
      entry.detail,
      entry.createdAt
    ]
  );
}

async function fetchAuditLogs(pool, actorUser, options = {}) {
  const allowedCategories = getAuditCategoriesForUser(actorUser);
  if (!allowedCategories.length) {
    return [];
  }

  const { category = null, limit = 40 } = options;
  const filters = [];
  const params = [];

  const categoryPlaceholders = allowedCategories.map(() => "?").join(", ");
  filters.push(`category IN (${categoryPlaceholders})`);
  params.push(...allowedCategories);

  if (category) {
    filters.push("category = ?");
    params.push(category);
  }

  params.push(Number(limit) || 40);

  const [rows] = await pool.query(
    `SELECT id, category, action_key AS action, entity_type AS entityType, entity_id AS entityId,
            entity_label AS entityLabel, actor_user_id AS actorUserId, actor_name AS actorName,
            actor_role_key AS actorRoleKey, summary_text AS summary, detail_text AS detail,
            created_at AS createdAt
     FROM audit_logs
     WHERE ${filters.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT ?`,
    params
  );

  return rows;
}

function filterFeedbackRequestsForUser(db, actorUser) {
  const requests = db.feedbackRequests.map((item) => presentFeedbackRequest(db, item));

  if (isOrgWideUser(actorUser)) {
    return requests;
  }

  if (isManagerUser(actorUser)) {
    return requests.filter((item) => {
      const reviewee = db.people.find((person) => person.id === item.revieweePersonId);
      return (
        item.requesterUserId === actorUser.id ||
        item.revieweePersonId === actorUser.person.id ||
        reviewee?.managerPersonId === actorUser.person.id
      );
    });
  }

  return requests.filter((item) => item.requesterUserId === actorUser.id);
}

function assertCanCreateFeedbackRequest(db, actorUser, payload) {
  if (!payload.cycleId || !Array.isArray(payload.providerPersonIds)) {
    throw new Error("Dados obrigatorios da solicitacao de feedback nao informados.");
  }

  if (!payload.contextNote?.trim() || payload.contextNote.trim().length < 20) {
    throw new Error("Descreva o contexto da colaboracao com pelo menos 20 caracteres.");
  }

  const uniqueProviderIds = [...new Set(payload.providerPersonIds.filter(Boolean))];
  if (!uniqueProviderIds.length || uniqueProviderIds.length > 3) {
    throw new Error("Selecione de 1 a 3 fornecedores de feedback.");
  }

  if (uniqueProviderIds.includes(actorUser.person.id)) {
    throw new Error("Nao e permitido solicitar feedback direto para si mesmo.");
  }

  const cycle = db.cycles.find((item) => item.id === payload.cycleId);
  if (!cycle) {
    throw new Error("Ciclo de avaliacao nao encontrado.");
  }

  if (cycle.status === CYCLE_STATUS.closed) {
    throw new Error("Nao e possivel solicitar feedback em ciclo encerrado.");
  }

  for (const providerPersonId of uniqueProviderIds) {
    const providerPerson = db.people.find((item) => item.id === providerPersonId);
    const providerUser = db.users.find(
      (item) => item.personId === providerPersonId && item.status === "active"
    );
    if (!providerUser) {
      throw new Error("Todos os fornecedores precisam ter usuario ativo.");
    }
    if (!providerPerson) {
      throw new Error("Pessoa fornecedora de feedback nao encontrada.");
    }
    if (!isSameWorkUnit(actorUser.person, providerPerson)) {
      throw new Error(
        "Feedback direto entre colaboradores exige que ambos estejam na mesma unidade."
      );
    }

    const duplicateAssignment = db.assignments.some(
      (item) =>
        item.cycleId === payload.cycleId &&
        item.relationshipType === "peer" &&
        item.revieweePersonId === actorUser.person.id &&
        item.reviewerUserId === providerUser.id
    );
    if (duplicateAssignment) {
      throw new Error("Ja existe feedback direto para uma das pessoas selecionadas neste ciclo.");
    }
  }

  return uniqueProviderIds;
}

function assertCanCreateDevelopmentPlan(actorUser, people, personId) {
  assertCanManageDevelopmentSubject(actorUser, people, personId, {
    isOrgWideUser,
    isManagerUser,
    getTeamPeople
  });
}

async function loadCustomLibraryState() {
  try {
    const content = await fs.readFile(CUSTOM_LIBRARY_STORAGE_FILE, "utf8");
    const parsed = JSON.parse(content);
    return {
      drafts: Array.isArray(parsed.drafts) ? parsed.drafts : [],
      published: Array.isArray(parsed.published) ? parsed.published : []
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { drafts: [], published: [] };
    }
    throw error;
  }
}

async function saveCustomLibraryState(state) {
  await fs.writeFile(
    CUSTOM_LIBRARY_STORAGE_FILE,
    JSON.stringify(
      {
        drafts: state.drafts,
        published: state.published
      },
      null,
      2
    ),
    "utf8"
  );
}

async function loadAnonymousResponseState() {
  try {
    const content = await fs.readFile(ANONYMOUS_RESPONSE_STORAGE_FILE, "utf8");
    const parsed = JSON.parse(content);
    return {
      responses: Array.isArray(parsed.responses) ? parsed.responses : []
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { responses: [] };
    }
    throw error;
  }
}

async function saveAnonymousResponseState(state) {
  await fs.writeFile(
    ANONYMOUS_RESPONSE_STORAGE_FILE,
    JSON.stringify(
      {
        responses: state.responses
      },
      null,
      2
    ),
    "utf8"
  );
}

function mapMysqlPersonRow(row) {
  return {
    id: row.id,
    name: row.name,
    roleTitle: row.roleTitle,
    area: row.area,
    workUnit: row.workUnit || DEFAULT_WORK_UNIT,
    workMode: row.workMode || DEFAULT_WORK_MODE,
    managerPersonId: row.managerPersonId || null,
    managerName: row.managerName,
    employmentType: row.employmentType || "internal",
    satisfactionScore: row.satisfactionScore || 0
  };
}

function mapMysqlAreaRow(row) {
  return {
    id: row.id,
    name: row.name,
    managerPersonId: row.managerPersonId || null,
    managerName: row.managerName || ""
  };
}

async function fetchPeopleRows(pool) {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.role_title AS roleTitle, p.area,
              p.work_unit AS workUnit, p.work_mode AS workMode,
              p.manager_person_id AS managerPersonId, manager.name AS managerName,
              p.employment_type AS employmentType, p.satisfaction_score AS satisfactionScore
       FROM people p
       LEFT JOIN people manager ON manager.id = p.manager_person_id
       ORDER BY p.name`
    );
    return rows.map(mapMysqlPersonRow);
  } catch (error) {
    if (error?.code !== "ER_BAD_FIELD_ERROR" && error?.errno !== 1054) {
      throw error;
    }

    try {
      const [rows] = await pool.query(
        `SELECT p.id, p.name, p.role_title AS roleTitle, p.area,
                p.manager_person_id AS managerPersonId, manager.name AS managerName,
                p.employment_type AS employmentType, p.satisfaction_score AS satisfactionScore
         FROM people p
         LEFT JOIN people manager ON manager.id = p.manager_person_id
         ORDER BY p.name`
      );
      return rows.map((row) =>
        mapMysqlPersonRow({
          ...row,
          workUnit: DEFAULT_WORK_UNIT,
          workMode: DEFAULT_WORK_MODE
        })
      );
    } catch (fallbackError) {
      if (fallbackError?.code !== "ER_BAD_FIELD_ERROR" && fallbackError?.errno !== 1054) {
        throw fallbackError;
      }

      const [rows] = await pool.query(
        `SELECT p.id, p.name, p.role_title AS roleTitle, p.area,
                p.manager_person_id AS managerPersonId, manager.name AS managerName
         FROM people p
         LEFT JOIN people manager ON manager.id = p.manager_person_id
         ORDER BY p.name`
      );
      return rows.map((row) =>
        mapMysqlPersonRow({
          ...row,
          workUnit: DEFAULT_WORK_UNIT,
          workMode: DEFAULT_WORK_MODE,
          employmentType: "internal",
          satisfactionScore: 0
        })
      );
    }
  }
}

async function fetchAreaRows(pool) {
  const [rows] = await pool.query(
    `SELECT a.id, a.name, a.manager_person_id AS managerPersonId, manager.name AS managerName
     FROM areas a
     LEFT JOIN people manager ON manager.id = a.manager_person_id
     ORDER BY a.name`
  );
  return rows.map(mapMysqlAreaRow);
}

async function fetchCompetencyRows(pool) {
  const [rows] = await pool.query(
    `SELECT id, competency_key AS \`key\`, name, description, status
     FROM competencies
     ORDER BY name`
  );
  return rows.map(presentCompetency);
}

async function fetchUserRows(pool) {
  const [rows] = await pool.query(
    `SELECT id, person_id AS personId, email, password_hash AS passwordHash, role_key AS roleKey, status
     FROM users`
  );
  return rows;
}

function enrichDevelopmentPlan(plan, people, cycles, competencies) {
  const person = people.find((item) => item.id === plan.personId);
  const cycle = plan.cycleId ? cycles.find((item) => item.id === plan.cycleId) : null;
  const competency = plan.competencyId
    ? competencies.find((item) => item.id === plan.competencyId)
    : null;

  return {
    ...plan,
    personName: person?.name || "",
    cycleTitle: cycle?.title || "",
    cycleSemesterLabel: cycle?.semesterLabel || "",
    competencyName: competency?.name || "",
    status: plan.status || "active",
    archivedAt: plan.archivedAt || null
  };
}

async function fetchCycleParticipantRows(pool, cycleId = null) {
  const [rows] = cycleId
    ? await pool.query(
        `SELECT id, cycle_id AS cycleId, person_id AS personId, status
         FROM evaluation_cycle_participants
         WHERE cycle_id = ?
         ORDER BY person_id`,
        [cycleId]
      )
    : await pool.query(
        `SELECT id, cycle_id AS cycleId, person_id AS personId, status
         FROM evaluation_cycle_participants
         ORDER BY cycle_id, person_id`
      );
  return rows;
}

async function fetchCycleRaterRows(pool, cycleId = null) {
  const [rows] = cycleId
    ? await pool.query(
        `SELECT id, cycle_id AS cycleId, participant_person_id AS participantPersonId,
                rater_user_id AS raterUserId, relationship_type AS relationshipType, status
         FROM evaluation_cycle_raters
         WHERE cycle_id = ?
         ORDER BY participant_person_id, relationship_type`,
        [cycleId]
      )
    : await pool.query(
        `SELECT id, cycle_id AS cycleId, participant_person_id AS participantPersonId,
                rater_user_id AS raterUserId, relationship_type AS relationshipType, status
         FROM evaluation_cycle_raters
         ORDER BY cycle_id, participant_person_id, relationship_type`
      );
  return rows;
}

async function fetchCycleAssignmentRows(
  pool,
  cycleId,
  { supportsAssignmentReminder = false } = {}
) {
  const baseSelect = supportsAssignmentReminder
    ? `SELECT id, cycle_id AS cycleId, reviewer_user_id AS reviewerUserId,
              reviewee_person_id AS revieweePersonId, relationship_type AS relationshipType,
              project_context AS projectContext, collaboration_context AS collaborationContext,
              status, reminder_count AS reminderCount, last_reminder_sent_at AS lastReminderSentAt,
              due_date AS dueDate
       FROM evaluation_assignments
       WHERE cycle_id = ?
       ORDER BY due_date, relationship_type`
    : `SELECT id, cycle_id AS cycleId, reviewer_user_id AS reviewerUserId,
              reviewee_person_id AS revieweePersonId, relationship_type AS relationshipType,
              project_context AS projectContext, collaboration_context AS collaborationContext,
              status, due_date AS dueDate
       FROM evaluation_assignments
       WHERE cycle_id = ?
       ORDER BY due_date, relationship_type`;
  const [rows] = await pool.query(baseSelect, [cycleId]);
  return rows.map((row) => ({
    ...row,
    reminderCount: Number(row.reminderCount || 0),
    lastReminderSentAt: row.lastReminderSentAt || null
  }));
}

async function fetchCyclePairingRows(pool, cycleId = null) {
  const [rows] = cycleId
    ? await pool.query(
        `SELECT id, cycle_id AS cycleId, relationship_type AS relationshipType,
                reviewer_user_id AS reviewerUserId, reviewee_person_id AS revieweePersonId,
                pairing_source AS pairingSource, pairing_reason AS pairingReason, seed,
                created_at AS createdAt, created_by_user_id AS createdByUserId,
                blocked_at AS blockedAt, blocked_by_user_id AS blockedByUserId
         FROM evaluation_pairings
         WHERE cycle_id = ?
         ORDER BY created_at DESC`,
        [cycleId]
      )
    : await pool.query(
        `SELECT id, cycle_id AS cycleId, relationship_type AS relationshipType,
                reviewer_user_id AS reviewerUserId, reviewee_person_id AS revieweePersonId,
                pairing_source AS pairingSource, pairing_reason AS pairingReason, seed,
                created_at AS createdAt, created_by_user_id AS createdByUserId,
                blocked_at AS blockedAt, blocked_by_user_id AS blockedByUserId
         FROM evaluation_pairings
         ORDER BY cycle_id, created_at DESC`
      );
  return rows;
}

async function fetchCyclePairingExceptionRows(pool, cycleId = null) {
  const [rows] = cycleId
    ? await pool.query(
        `SELECT id, cycle_id AS cycleId, pairing_id AS pairingId, action_type AS actionType,
                reviewer_user_id AS reviewerUserId,
                previous_reviewee_person_id AS previousRevieweePersonId,
                next_reviewee_person_id AS nextRevieweePersonId,
                reason, actor_user_id AS actorUserId, created_at AS createdAt
         FROM evaluation_pairing_exceptions
         WHERE cycle_id = ?
         ORDER BY created_at DESC`,
        [cycleId]
      )
    : await pool.query(
        `SELECT id, cycle_id AS cycleId, pairing_id AS pairingId, action_type AS actionType,
                reviewer_user_id AS reviewerUserId,
                previous_reviewee_person_id AS previousRevieweePersonId,
                next_reviewee_person_id AS nextRevieweePersonId,
                reason, actor_user_id AS actorUserId, created_at AS createdAt
         FROM evaluation_pairing_exceptions
         ORDER BY cycle_id, created_at DESC`
      );
  return rows;
}

async function fetchCycleReportRows(pool, cycleId = null) {
  const [rows] = cycleId
    ? await pool.query(
        `SELECT id, cycle_id AS cycleId, relationship_type AS relationshipType,
                total_responses AS totalResponses, average_score AS averageScore,
                question_averages_json AS questionAveragesJson, generated_at AS generatedAt
         FROM evaluation_cycle_reports
         WHERE cycle_id = ?
         ORDER BY relationship_type`,
        [cycleId]
      )
    : await pool.query(
        `SELECT id, cycle_id AS cycleId, relationship_type AS relationshipType,
                total_responses AS totalResponses, average_score AS averageScore,
                question_averages_json AS questionAveragesJson, generated_at AS generatedAt
         FROM evaluation_cycle_reports
         ORDER BY cycle_id, relationship_type`
      );
  return rows.map((row) => presentCycleReportSnapshot(row));
}

async function fetchDevelopmentPlanRows(pool) {
  const [rows] = await pool.query(
    `SELECT id, person_id AS personId, cycle_id AS cycleId, competency_id AS competencyId,
            focus_title AS focusTitle, action_text AS actionText, due_date AS dueDate,
            expected_evidence AS expectedEvidence, status, created_by_user_id AS createdByUserId,
            created_at AS createdAt, archived_at AS archivedAt
     FROM development_plans
     ORDER BY due_date ASC, created_at DESC`
  );
  return rows;
}

async function fetchLearningIntegrationEventRows(pool) {
  const [rows] = await pool.query(
    `SELECT id, source_system AS sourceSystem, external_id AS externalId,
            person_email AS personEmail, person_document AS personDocument, person_id AS personId,
            event_type AS eventType, title, provider_name AS providerName, status,
            occurred_at AS occurredAt, workload_hours AS workloadHours, competency_key AS competencyKey,
            suggested_action AS suggestedAction, processing_status AS processingStatus,
            applied_entity_type AS appliedEntityType, applied_entity_id AS appliedEntityId,
            applied_at AS appliedAt, review_note AS reviewNote,
            raw_payload_json AS rawPayloadJson, created_at AS createdAt,
            created_by_user_id AS createdByUserId
     FROM learning_integration_events
     ORDER BY created_at DESC`
  );
  return rows.map((row) => ({
    ...row,
    workloadHours: Number(row.workloadHours || 0),
    rawPayload:
      typeof row.rawPayloadJson === "string"
        ? JSON.parse(row.rawPayloadJson)
        : row.rawPayloadJson || {}
  }));
}

async function fetchMysqlResponses(
  pool,
  customLibraries = [],
  { supportsFeedbackAcknowledgement = false } = {}
) {
  const [submissions] = await pool.query(
    supportsFeedbackAcknowledgement
      ? `SELECT s.id, s.assignment_id AS assignmentId, s.cycle_id AS cycleId,
              s.reviewer_user_id AS reviewerUserId, s.reviewee_person_id AS revieweePersonId,
              s.overall_score AS overallScore, s.strengths_note AS strengthsNote,
              s.development_note AS developmentNote, s.reviewee_acknowledgement_status AS revieweeAcknowledgementStatus,
              s.reviewee_acknowledgement_note AS revieweeAcknowledgementNote,
              s.reviewee_acknowledged_at AS revieweeAcknowledgedAt, s.submitted_at AS submittedAt,
              reviewer_person.name AS reviewerName, reviewee.name AS revieweeName,
              reviewee.area AS revieweeArea, reviewee.manager_person_id AS revieweeManagerPersonId,
              reviewee_manager.name AS revieweeManagerName,
              a.relationship_type AS relationshipType
       FROM evaluation_submissions s
       JOIN evaluation_assignments a ON a.id = s.assignment_id
       JOIN users reviewer_user ON reviewer_user.id = s.reviewer_user_id
       JOIN people reviewer_person ON reviewer_person.id = reviewer_user.person_id
       JOIN people reviewee ON reviewee.id = s.reviewee_person_id
       LEFT JOIN people reviewee_manager ON reviewee_manager.id = reviewee.manager_person_id
       ORDER BY s.submitted_at DESC`
      : `SELECT s.id, s.assignment_id AS assignmentId, s.cycle_id AS cycleId,
              s.reviewer_user_id AS reviewerUserId, s.reviewee_person_id AS revieweePersonId,
              s.overall_score AS overallScore, s.strengths_note AS strengthsNote,
              s.development_note AS developmentNote, s.submitted_at AS submittedAt,
              reviewer_person.name AS reviewerName, reviewee.name AS revieweeName,
              reviewee.area AS revieweeArea, reviewee.manager_person_id AS revieweeManagerPersonId,
              reviewee_manager.name AS revieweeManagerName,
              a.relationship_type AS relationshipType
       FROM evaluation_submissions s
       JOIN evaluation_assignments a ON a.id = s.assignment_id
       JOIN users reviewer_user ON reviewer_user.id = s.reviewer_user_id
       JOIN people reviewer_person ON reviewer_person.id = reviewer_user.person_id
       JOIN people reviewee ON reviewee.id = s.reviewee_person_id
       LEFT JOIN people reviewee_manager ON reviewee_manager.id = reviewee.manager_person_id
       ORDER BY s.submitted_at DESC`
  );

  const [answers] = await pool.query(
    `SELECT a.id, a.submission_id AS submissionId, a.question_id AS questionId, a.answer_type AS answerType, a.score,
            a.evidence_note AS evidenceNote, a.answer_text AS textValue, a.answer_options_json AS answerOptionsJson, q.prompt_text AS questionPrompt,
            q.dimension_title AS dimensionTitle
     FROM evaluation_answers a
     LEFT JOIN evaluation_questions q ON q.id = a.question_id
     ORDER BY a.id ASC`
  );

  return submissions.map((submission) => ({
    ...submission,
    revieweeName: submission.relationshipType === "company" ? "Empresa" : submission.revieweeName,
    revieweeArea:
      submission.relationshipType === "company" ? "Institucional" : submission.revieweeArea,
    revieweeManagerPersonId:
      submission.relationshipType === "company" ? null : submission.revieweeManagerPersonId,
    revieweeManagerName:
      submission.relationshipType === "company"
        ? "Institucional"
        : submission.revieweeManagerName,
    revieweeAcknowledgementStatus: submission.revieweeAcknowledgementStatus || null,
    revieweeAcknowledgementNote: submission.revieweeAcknowledgementNote || "",
    revieweeAcknowledgedAt: submission.revieweeAcknowledgedAt || null,
    weight: evaluationLibrary.weights[submission.relationshipType] || 0,
    weightedScore: Number(
      (
        Number(submission.overallScore) *
        (evaluationLibrary.weights[submission.relationshipType] || 0)
      ).toFixed(2)
    ),
    answers: answers
      .filter((answer) => answer.submissionId === submission.id)
      .map((answer) => ({
        ...answer,
        questionPrompt:
          answer.questionPrompt ||
          findQuestionDefinition(answer.questionId, customLibraries)?.prompt ||
          "",
        dimensionTitle:
          answer.dimensionTitle ||
          findQuestionDefinition(answer.questionId, customLibraries)?.dimensionTitle ||
          "",
        selectedOptions: answer.answerOptionsJson ? JSON.parse(answer.answerOptionsJson) : []
      }))
  }));
}

function buildMemoryStore(customLibraryState, anonymousResponseState) {
  const db = {
    auditLogs: [],
    ...cloneSeed()
  };
  if (!Array.isArray(db.auditLogs)) {
    db.auditLogs = [];
  }
  if (!Array.isArray(db.competencies)) {
    db.competencies = [];
  }
  if (!Array.isArray(db.cycleParticipants)) {
    db.cycleParticipants = [];
  }
  if (!Array.isArray(db.cycleRaters)) {
    db.cycleRaters = [];
  }
  if (!Array.isArray(db.cycleReports)) {
    db.cycleReports = [];
  }
  if (!Array.isArray(db.evaluationPairings)) {
    db.evaluationPairings = [];
  }
  if (!Array.isArray(db.evaluationPairingExceptions)) {
    db.evaluationPairingExceptions = [];
  }
  if (!Array.isArray(db.developmentPlans)) {
    db.developmentPlans = [];
  }
  if (!Array.isArray(db.learningIntegrationEvents)) {
    db.learningIntegrationEvents = [];
  }
  db.cycles.forEach((cycle) => hydrateCycleStructure(db, cycle.id));

  return {
    async checkHealth() {
      return {
        database: "memory"
      };
    },
    async findUserByEmail(email) {
      return db.users.find((item) => item.email.toLowerCase() === email.toLowerCase()) || null;
    },
    async getUserById(userId) {
      const user = db.users.find((item) => item.id === userId);
      return user ? toPublicUser(db, user) : null;
    },
    async authenticateUser(email, password) {
      const user = await this.findUserByEmail(email);
      if (!user || user.status !== "active" || !verifyPasswordHash(user.passwordHash, password)) {
        return null;
      }
      return toPublicUser(db, user);
    },
    async getAreas(actorUser) {
      return filterAreasForUser(db.areas, db.people, actorUser);
    },
    async getCompetencies() {
      return db.competencies
        .map((item) => presentCompetency(item))
        .sort((left, right) => left.name.localeCompare(right.name));
    },
    async createCompetency(payload, actorUser) {
      if (!canManageCompetencies(actorUser)) {
        throw new Error("Perfil sem permissao para cadastrar competencias.");
      }

      const competencyData = prepareCompetencyMutation(db.competencies, payload);

      const competency = {
        id: createId("competency"),
        ...competencyData
      };
      db.competencies.unshift(competency);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.competency,
        action: "created",
        entityType: "competency",
        entityId: competency.id,
        entityLabel: competency.name,
        actorUser,
        summary: `Competencia criada: ${competency.name}`,
        detail: `${competency.key} · ${competency.status}`
      });
      return presentCompetency(competency);
    },
    async updateCompetency(competencyId, payload, actorUser) {
      if (!canManageCompetencies(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar competencias.");
      }

      const competency = db.competencies.find((item) => item.id === competencyId);
      if (!competency) {
        throw new Error("Competencia nao encontrada.");
      }

      const competencyData = prepareCompetencyMutation(db.competencies, payload, {
        competencyId
      });

      competency.name = competencyData.name;
      competency.key = competencyData.key;
      competency.description = competencyData.description;
      competency.status = competencyData.status;
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.competency,
        action: "updated",
        entityType: "competency",
        entityId: competency.id,
        entityLabel: competency.name,
        actorUser,
        summary: `Competencia atualizada: ${competency.name}`,
        detail: `${competency.key} · ${competency.status}`
      });
      return presentCompetency(competency);
    },
    async createArea(payload, actorUser) {
      if (!canManagePeople(actorUser)) {
        throw new Error("Perfil sem permissao para cadastrar areas.");
      }

      const areaMutation = prepareAreaMutation({
        areas: db.areas,
        payload,
        people: db.people,
        assertValidAreaManagerReference
      });

      const area = {
        id: createId("area"),
        name: areaMutation.normalizedName,
        managerPersonId: areaMutation.managerPersonId || null
      };
      db.areas.unshift(area);
      return enrichArea(db.people, area);
    },
    async updateArea(areaId, payload, actorUser) {
      if (!canManagePeople(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar areas.");
      }

      const area = db.areas.find((item) => item.id === areaId);
      if (!area) {
        throw new Error("Area nao encontrada.");
      }

      const areaMutation = prepareAreaMutation({
        areaId,
        areas: db.areas,
        payload,
        people: db.people,
        assertValidAreaManagerReference
      });

      const previousName = area.name;
      area.name = areaMutation.normalizedName;
      if (areaMutation.managerPersonId !== undefined) {
        area.managerPersonId = areaMutation.managerPersonId;
      }

      if (previousName !== area.name) {
        db.people.forEach((person) => {
          if (person.area === previousName) {
            person.area = area.name;
          }
        });
      }

      return enrichArea(db.people, area);
    },
    async getPeople(actorUser) {
      return filterPeopleForUser(db.people, actorUser, db.areas);
    },
    async createPerson(payload, actorUser) {
      if (!canManagePeople(actorUser)) {
        throw new Error("Perfil sem permissao para cadastrar pessoas.");
      }

      const { personPayload, shouldLeadArea } = preparePersonMutation({
        areas: db.areas,
        payload,
        people: db.people,
        assertNoDuplicatePersonProfile,
        assertNoManagerCycle,
        assertValidAreaReference,
        assertValidManagerReference
      });

      const person = {
        id: createId("person"),
        ...personPayload,
        satisfactionScore: null
      };
      db.people.unshift(person);
      db.areas = assignAreaLeadershipSnapshot(
        db.areas,
        person.id,
        person.area,
        shouldLeadArea
      );
      return enrichPerson(db.people, person, db.areas.map((area) => enrichArea(db.people, area)));
    },
    async updatePerson(personId, payload, actorUser) {
      if (!canManagePeople(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar pessoas.");
      }

      const person = db.people.find((item) => item.id === personId);
      if (!person) {
        throw new Error("Pessoa nao encontrada.");
      }

      const { personPayload, shouldLeadArea } = preparePersonMutation({
        areaId: personId,
        areas: db.areas,
        payload: {
          ...payload
        },
        people: db.people,
        assertNoDuplicatePersonProfile,
        assertNoManagerCycle,
        assertValidAreaReference,
        assertValidManagerReference
      });

      Object.assign(person, personPayload);
      db.areas = assignAreaLeadershipSnapshot(
        db.areas,
        person.id,
        person.area,
        shouldLeadArea
      );

      return enrichPerson(db.people, person, db.areas.map((area) => enrichArea(db.people, area)));
    },
    async getUsers(actorUser) {
      if (!canManageUsers(actorUser)) {
        return [];
      }

      return db.users.map((user) => toAdminUserRow(db, user));
    },
    async getAuditTrail(actorUser, options = {}) {
      return filterAuditLogsForUser(db.auditLogs, actorUser, options);
    },
    async createUser(payload, actorUser) {
      if (!canManageUsers(actorUser)) {
        throw new Error("Perfil sem permissao para cadastrar usuarios.");
      }

      const person = db.people.find((item) => item.id === payload.personId);
      assertUserPersonExists(person);
      assertPersonHasNoLinkedUser(db.users.some((item) => item.personId === payload.personId));

      const userData = prepareUserWrite(db.users, payload, { requirePassword: true });

      const user = {
        id: createId("user"),
        personId: payload.personId,
        email: userData.email,
        passwordHash: hashPassword(userData.password),
        roleKey: userData.roleKey,
        status: userData.status
      };
      db.users.unshift(user);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.user,
        action: "created",
        entityType: "user",
        entityId: user.id,
        entityLabel: person.name,
        actorUser,
        summary: `Usuario criado para ${person.name}`,
        detail: buildUserAuditDetail(userData)
      });
      return toAdminUserRow(db, user);
    },
    async updateUser(userId, payload, actorUser) {
      if (!canManageUsers(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar usuarios.");
      }

      const user = db.users.find((item) => item.id === userId);
      if (!user) {
        throw new Error("Usuario nao encontrado.");
      }

      const userData = prepareUserWrite(db.users, payload, { userId });

      user.email = userData.email;
      user.roleKey = userData.roleKey;
      user.status = userData.status;
      if (userData.password) {
        user.passwordHash = hashPassword(userData.password);
      }

      const person = db.people.find((item) => item.id === user.personId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.user,
        action: "updated",
        entityType: "user",
        entityId: user.id,
        entityLabel: person?.name || user.email,
        actorUser,
        summary: `Acesso atualizado para ${person?.name || user.email}`,
        detail: buildUserAuditDetail(userData)
      });

      return toAdminUserRow(db, user);
    },
    async getSummary(actorUser) {
      return buildSummary(db, actorUser);
    },
    async getIncidents(actorUser) {
      if (!canAccessIncidents(actorUser)) {
        return [];
      }
      return db.incidents.map((incident) => enrichIncident(incident, db.people, db.areas));
    },
    async createIncident(payload, actorUser) {
      assertIncidentCreatePayload({
        areas: db.areas,
        people: db.people,
        payload,
        assertValidIncidentArea,
        assertValidIncidentAssignee
      });
      const incidentRouting = resolveIncidentAssignment({
        areas: db.areas,
        people: db.people,
        payload
      });

      const incident = {
        id: createId("incident"),
        status: "Em triagem",
        createdAt: new Date().toISOString(),
        ...payload,
        responsibleArea: incidentRouting.responsibleArea,
        assignedPersonId: incidentRouting.assignedPersonId,
        assignedTo: incidentRouting.assignedTo
      };
      db.incidents.unshift(incident);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.incident,
        action: "created",
        entityType: "incident",
        entityId: incident.id,
        entityLabel: incident.title,
        actorUser,
        summary: `Relato registrado: ${incident.title}`,
        detail: buildIncidentAuditDetail({
          classification: incident.classification,
          responsibleArea: incident.responsibleArea,
          assignedTo: incident.assignedTo
        })
      });
      return enrichIncident(incident, db.people, db.areas);
    },
    async updateIncident(incidentId, payload, actorUser) {
      if (!canManageIncidentQueue(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar o caso.");
      }

      const incident = db.incidents.find((item) => item.id === incidentId);
      if (!incident) {
        throw new Error("Caso de compliance nao encontrado.");
      }

      assertIncidentUpdatePayload({
        areas: db.areas,
        people: db.people,
        payload,
        assertValidIncidentArea,
        assertValidIncidentAssignee
      });
      const incidentRouting = resolveIncidentAssignment({
        areas: db.areas,
        people: db.people,
        payload
      });

      incident.classification = payload.classification;
      incident.status = payload.status;
      incident.responsibleArea = incidentRouting.responsibleArea;
      incident.assignedPersonId = incidentRouting.assignedPersonId;
      incident.assignedTo = incidentRouting.assignedTo;

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.incident,
        action: "updated",
        entityType: "incident",
        entityId: incident.id,
        entityLabel: incident.title,
        actorUser,
        summary: `Caso atualizado: ${incident.title}`,
        detail: buildIncidentAuditDetail({
          status: incident.status,
          classification: incident.classification,
          responsibleArea: incident.responsibleArea,
          assignedTo: incident.assignedTo
        })
      });

      return enrichIncident(incident, db.people, db.areas);
    },
    async getEvaluationTemplate() {
      return buildTemplate(evaluationLibrary.templates.collaboration);
    },
    async getEvaluationLibrary() {
      return buildEvaluationLibraryPayload(customLibraryState.published);
    },
    async importCustomLibraryDraft(payload) {
      const draft = {
        id: createId("library_draft"),
        fileName: payload.fileName,
        createdAt: new Date().toISOString(),
        createdByUserId: payload.createdByUserId,
        errors: payload.errors,
        templates: payload.templates,
        summary: payload.summary
      };
      customLibraryState.drafts.unshift(draft);
      await saveCustomLibraryState(customLibraryState);
      return draft;
    },
      async publishCustomLibraryDraft(payload) {
        const draft = customLibraryState.drafts.find((item) => item.id === payload.draftId);
      if (!draft) {
        throw new Error("Rascunho da biblioteca nao encontrado.");
      }
      if (draft.errors.length) {
        throw new Error("Nao e possivel publicar uma biblioteca com erros.");
      }

      const published = {
        id: createId("library"),
        name: payload.name,
        description: payload.description || "",
        sourceFileName: draft.fileName,
        createdAt: new Date().toISOString(),
        createdByUserId: payload.createdByUserId,
        templateCount: draft.templates.length,
        questionCount: draft.summary.questions,
        templates: draft.templates
      };
      customLibraryState.published.unshift(published);
      customLibraryState.drafts = customLibraryState.drafts.filter(
        (item) => item.id !== payload.draftId
      );
        await saveCustomLibraryState(customLibraryState);
        return published;
      },
      async updateCustomLibrary(libraryId, payload) {
        const libraryIndex = customLibraryState.published.findIndex((item) => item.id === libraryId);
        if (libraryIndex < 0) {
          throw new Error("Biblioteca customizada nao encontrada.");
        }

        const updatedLibrary = preparePublishedCustomLibraryUpdate(
          customLibraryState.published[libraryIndex],
          payload
        );

        customLibraryState.published[libraryIndex] = updatedLibrary;
        await saveCustomLibraryState(customLibraryState);
        return updatedLibrary;
      },
      async getEvaluationTemplateForCycleRelationship(cycleId, relationshipType) {
      const cycle = db.cycles.find((item) => item.id === cycleId);
      return buildTemplate(
        getTemplateDefinitionForCycle({
          cycle: presentCycle(cycle || {}),
          relationshipType,
          customLibraries: customLibraryState.published
        })
      );
    },
    async getEvaluationCycles(actorUser = null) {
      const cycles = db.cycles.map((cycle) => {
        const cycleStructure = presentCycleParticipantStructure(
          db,
          cycle.id,
          customLibraryState.published
        );

        return {
          ...presentCycle(cycle),
          supportsConfig: true,
          participantCount: cycleStructure.cycle.participantCount,
          raterCount: cycleStructure.cycle.raterCount,
          reportSnapshotCount: db.cycleReports.filter((item) => item.cycleId === cycle.id).length
        };
      });

      if (actorUser && !isOrgWideUser(actorUser)) {
        return cycles.filter((cycle) => cycle.isEnabled);
      }

      return cycles;
    },
    async createEvaluationCycle(payload, actorUser) {
      const selectedLibrary =
        payload.libraryId && payload.libraryId !== DEFAULT_EVALUATION_LIBRARY_ID
          ? findPublishedLibrary(customLibraryState.published, payload.libraryId)
          : null;

      if (payload.libraryId && payload.libraryId !== DEFAULT_EVALUATION_LIBRARY_ID && !selectedLibrary) {
        throw new Error("Biblioteca selecionada nao foi encontrada.");
      }

      const cycle = prepareEvaluationCycle({
        payload,
        createId,
        questionTemplateId: questionTemplate.id,
        selectedLibrary
      });
      db.cycles.unshift(cycle);
      const crossFunctionalPlan = buildCrossFunctionalPlan({
        users: db.users,
        people: db.people,
        cycleId: cycle.id,
        transversalConfig: cycle.transversalConfig,
        priorPairings: (db.evaluationPairings || []).filter((item) => item.relationshipType === "cross-functional")
      });
      db.evaluationPairings.unshift(
        ...crossFunctionalPlan.pairings.map((pairing) =>
          createCrossFunctionalPairingRecord({
            pairing,
            cycleId: cycle.id,
            actorUser,
            createId,
            source: "automatic",
            reason: "Pareamento automatico balanceado",
            seed: cycle.id
          })
        )
      );

      const generatedAssignments = generateAssignments({
        users: db.users,
        people: db.people,
        cycleId: cycle.id,
        dueDate: cycle.dueDate,
        crossFunctionalPlan
      });
      db.assignments.unshift(...generatedAssignments);
      hydrateCycleStructure(db, cycle.id);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "created",
        entityType: "cycle",
        entityId: cycle.id,
        entityLabel: cycle.title,
        actorUser,
        summary: `Ciclo criado: ${cycle.title}`,
        detail: buildCycleCreatedAuditDetail({
          semesterLabel: cycle.semesterLabel,
          assignmentCount: generatedAssignments.length
        })
      });

      return {
        ...presentCycle(cycle),
        supportsConfig: true,
        participantCount: db.cycleParticipants.filter((item) => item.cycleId === cycle.id).length,
        raterCount: db.cycleRaters.filter((item) => item.cycleId === cycle.id).length,
        reportSnapshotCount: 0,
        generatedAssignmentsCount: generatedAssignments.length
      };
    },
    async getEvaluationCycleParticipants(cycleId) {
      const cycle = db.cycles.find((item) => item.id === cycleId);
      if (!cycle) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      hydrateCycleStructure(db, cycleId);
      return presentCycleParticipantStructure(db, cycleId, customLibraryState.published);
    },
    async blockCrossFunctionalPairing(cycleId, pairingId, reason, actorUser) {
      const cycle = db.cycles.find((item) => item.id === cycleId);
      if (!cycle) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }
      const normalizedReason = String(reason || "").trim();
      if (!normalizedReason) {
        throw new Error("Informe a justificativa da excecao.");
      }

      const pairing = db.evaluationPairings.find(
        (item) =>
          item.id === pairingId &&
          item.cycleId === cycleId &&
          item.relationshipType === "cross-functional"
      );
      if (!pairing || pairing.blockedAt) {
        throw new Error("Pareamento transversal nao encontrado.");
      }

      const assignment = db.assignments.find(
        (item) =>
          item.cycleId === cycleId &&
          item.reviewerUserId === pairing.reviewerUserId &&
          item.revieweePersonId === pairing.revieweePersonId &&
          item.relationshipType === "cross-functional"
      );
      if (assignment?.status === "submitted") {
        throw new Error("Nao e possivel bloquear um pareamento ja respondido.");
      }

      pairing.blockedAt = new Date().toISOString();
      pairing.blockedByUserId = actorUser.id;
      removeCrossFunctionalAssignment(
        db.assignments,
        cycleId,
        pairing.reviewerUserId,
        pairing.revieweePersonId
      );
      db.evaluationPairingExceptions.unshift(
        createPairingExceptionRecord({
          cycleId,
          pairingId,
          reviewerUserId: pairing.reviewerUserId,
          previousRevieweePersonId: pairing.revieweePersonId,
          nextRevieweePersonId: null,
          actionType: "blocked",
          reason: normalizedReason,
          actorUser,
          createId
        })
      );
      rebuildCycleStructure(db, cycleId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "pairing_blocked",
        entityType: "cycle",
        entityId: cycle.id,
        entityLabel: cycle.title,
        actorUser,
        summary: "Pareamento transversal bloqueado",
        detail: normalizedReason
      });
      return presentCycleParticipantStructure(db, cycleId, customLibraryState.published);
    },
    async forceCrossFunctionalPairing(cycleId, payload, actorUser) {
      const cycle = db.cycles.find((item) => item.id === cycleId);
      if (!cycle) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }
      const normalizedReason = String(payload?.reason || "").trim();
      if (!normalizedReason) {
        throw new Error("Informe a justificativa da excecao.");
      }

      const reviewer = db.users.find((item) => item.id === payload?.reviewerUserId && item.status === "active");
      const reviewee = db.people.find((item) => item.id === payload?.revieweePersonId);
      const reviewerPerson = reviewer
        ? db.people.find((item) => item.id === reviewer.personId)
        : null;

      if (!reviewer || !reviewerPerson || !reviewee) {
        throw new Error("Revisor ou avaliado nao encontrado.");
      }
      if (!isCrossFunctionalCandidate({ id: reviewer.id, person: reviewerPerson }, { id: reviewee.id, person: reviewee })) {
        throw new Error("O pareamento informado nao atende as regras do Feedback transversal.");
      }

      const existingPairing = db.evaluationPairings.find(
        (item) =>
          item.cycleId === cycleId &&
          item.relationshipType === "cross-functional" &&
          item.reviewerUserId === reviewer.id &&
          item.revieweePersonId === reviewee.id &&
          !item.blockedAt
      );
      if (existingPairing) {
        throw new Error("Esse pareamento transversal ja esta ativo no ciclo.");
      }
      const previousAssignment = db.assignments.find(
        (item) =>
          item.cycleId === cycleId &&
          item.relationshipType === "cross-functional" &&
          item.reviewerUserId === reviewer.id &&
          item.revieweePersonId === reviewee.id
      );
      if (previousAssignment?.status === "submitted") {
        throw new Error("Nao e possivel alterar um pareamento ja respondido.");
      }

      const newPairing = createCrossFunctionalPairingRecord({
        pairing: {
          reviewerUserId: reviewer.id,
          revieweePersonId: reviewee.id
        },
        cycleId,
        actorUser,
        createId,
        source: "manual",
        reason: normalizedReason,
        seed: cycle.id
      });
      db.evaluationPairings.unshift(newPairing);
      upsertCrossFunctionalAssignment(db.assignments, {
        cycleId,
        reviewerUserId: reviewer.id,
        revieweePersonId: reviewee.id,
        dueDate: cycle.dueDate
      });
      db.evaluationPairingExceptions.unshift(
        createPairingExceptionRecord({
          cycleId,
          pairingId: newPairing.id,
          reviewerUserId: reviewer.id,
          previousRevieweePersonId: null,
          nextRevieweePersonId: reviewee.id,
          actionType: "forced",
          reason: normalizedReason,
          actorUser,
          createId
        })
      );
      rebuildCycleStructure(db, cycleId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "pairing_forced",
        entityType: "cycle",
        entityId: cycle.id,
        entityLabel: cycle.title,
        actorUser,
        summary: "Pareamento transversal ajustado",
        detail: normalizedReason
      });
      return presentCycleParticipantStructure(db, cycleId, customLibraryState.published);
    },
    async notifyCycleDelinquents(cycleId, actorUser) {
      const cycle = db.cycles.find((item) => item.id === cycleId);
      if (!cycle) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const delinquentAssignments = db.assignments.filter(
        (assignment) =>
          assignment.cycleId === cycleId && isAssignmentDelinquent(assignment, cycle.status)
      );

      if (!delinquentAssignments.length) {
        return {
          cycleId,
          notifiedAssignments: 0,
          delinquentAssignments: []
        };
      }

      const reminderSentAt = new Date().toISOString();
      delinquentAssignments.forEach((assignment) => {
        assignment.reminderCount = Number(assignment.reminderCount || 0) + 1;
        assignment.lastReminderSentAt = reminderSentAt;
      });

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "delinquent_reminder_sent",
        entityType: "evaluation_cycle",
        entityId: cycle.id,
        entityLabel: cycle.title,
        actorUser,
        summary: `Lembrete enviado para inadimplentes: ${cycle.title}`,
        detail: buildCycleReminderAuditDetail(delinquentAssignments.length)
      });

      return {
        cycleId,
        notifiedAssignments: delinquentAssignments.length,
        delinquentAssignments: delinquentAssignments.map((assignment) =>
          presentDelinquentAssignment(assignment, db, cycle.status)
        )
      };
    },
    async updateEvaluationCycleStatus(cycleId, nextStatus, actorUser) {
      const cycle = db.cycles.find((item) => item.id === cycleId);
      if (!cycle) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const previousStatus = cycle.status;
      assertCycleStatusTransition(cycle.status, nextStatus);
      cycle.status = nextStatus;
      if (nextStatus === CYCLE_STATUS.processed) {
        const responses = [
          ...db.submissions
            .filter((submission) => submission.cycleId === cycleId)
            .map((item) => enrichSubmission(db, item, customLibraryState.published)),
          ...anonymousResponseState.responses.filter((response) => response.cycleId === cycleId)
        ];
        const snapshots = buildCycleReportSnapshots(cycleId, responses);
        db.cycleReports = db.cycleReports.filter((item) => item.cycleId !== cycleId);
        db.cycleReports.unshift(...snapshots);
      }
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: nextStatus === CYCLE_STATUS.processed ? "processed" : "status_changed",
        entityType: "cycle",
        entityId: cycle.id,
        entityLabel: cycle.title,
        actorUser,
        summary: `Status do ciclo atualizado: ${cycle.title}`,
        detail: buildCycleStatusAuditDetail(previousStatus, nextStatus)
      });
      return { ...presentCycle(cycle), supportsConfig: true };
    },
    async updateEvaluationCycleConfig(cycleId, payload, actorUser) {
      if (!["admin", "hr"].includes(actorUser?.roleKey || "")) {
        throw new Error("Perfil sem permissao para configurar ciclos.");
      }

      const cycle = db.cycles.find((item) => item.id === cycleId);
      if (!cycle) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const currentModuleAvailability = normalizeCycleModuleAvailability(cycle.moduleAvailability);
      const cycleConfigUpdate = resolveCycleConfigUpdate(
        currentModuleAvailability,
        normalizeTransversalConfig(cycle.transversalConfig),
        payload
      );

      if (cycleConfigUpdate.nextIsEnabled !== undefined) {
        cycle.isEnabled = cycleConfigUpdate.nextIsEnabled;
      }

      if (cycleConfigUpdate.nextModuleAvailability) {
        cycle.moduleAvailability = cycleConfigUpdate.nextModuleAvailability;
      }
      if (cycleConfigUpdate.nextTransversalConfig) {
        cycle.transversalConfig = cycleConfigUpdate.nextTransversalConfig;
      }

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "config_changed",
        entityType: "cycle",
        entityId: cycle.id,
        entityLabel: cycle.title,
        actorUser,
        summary: `Configuracao do ciclo atualizada: ${cycle.title}`,
        detail: buildCycleConfigAuditDetail(cycle.isEnabled)
      });

      return presentCycle(cycle);
    },
    async getEvaluationAssignmentsForUser(userId) {
      return db.assignments
        .filter((item) => item.reviewerUserId === userId)
        .filter((item) =>
          isCycleRelationshipEnabled(
            db.cycles.find((cycle) => cycle.id === item.cycleId),
            item.relationshipType
          )
        )
        .map((item) => enrichAssignment(db, item, customLibraryState.published));
    },
    async getEvaluationAssignmentById(assignmentId, userId) {
      const assignment = db.assignments.find(
        (item) => item.id === assignmentId && item.reviewerUserId === userId
      );
      if (!assignment) {
        return null;
      }
      if (
        !isCycleRelationshipEnabled(
          db.cycles.find((cycle) => cycle.id === assignment.cycleId),
          assignment.relationshipType
        )
      ) {
        return null;
      }
      return enrichAssignment(db, assignment, customLibraryState.published);
    },
    async getEvaluationResponses(actorUser) {
      return buildEvaluationResponseBundle({
        submissions: db.submissions,
        anonymousResponses: anonymousResponseState.responses,
        buildSubmission: (item) => enrichSubmission(db, item, customLibraryState.published),
        actorUser,
        buildResponsesBundle,
        cycles: db.cycles,
        cycleReports: db.cycleReports.map((item) => presentCycleReportSnapshot(item))
      });
    },
    async getReceivedManagerFeedback(actorUser) {
      return filterReceivedManagerFeedback({
        submissions: db.submissions,
        actorUser,
        buildSubmission: (item) => enrichSubmission(db, item, customLibraryState.published)
      });
    },
    async getFeedbackRequests(actorUser) {
      return filterFeedbackRequestsForUser(db, actorUser);
    },
    async createFeedbackRequest(payload, actorUser) {
      const providerPersonIds = assertCanCreateFeedbackRequest(db, actorUser, payload);

      const request = {
        ...prepareFeedbackRequest({
          payload,
          actorUser,
          createId,
          requestedAt: new Date().toISOString()
        }),
        decidedAt: null,
        decidedByUserId: null
      };
      db.feedbackRequests.unshift(request);

      const items = buildFeedbackRequestItems({
        providerPersonIds,
        requestId: request.id,
        createId
      });
      db.feedbackRequestItems.unshift(...items);

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.feedbackRequest,
        action: "created",
        entityType: "feedback_request",
        entityId: request.id,
        entityLabel: actorUser.person?.name || actorUser.email,
        actorUser,
        summary: `Solicitacao de feedback direto registrada`,
        detail: buildFeedbackRequestCreateAuditDetail(providerPersonIds, request.cycleId)
      });

      return presentFeedbackRequest(db, request);
    },
    async reviewFeedbackRequest(requestId, payload, actorUser) {
      if (!["admin", "hr"].includes(actorUser.roleKey)) {
        throw new Error("Perfil sem permissao para aprovar solicitacoes de feedback.");
      }

      assertValidFeedbackRequestStatus(payload.status);
      const request = db.feedbackRequests.find((item) => item.id === requestId);
      if (!request) {
        throw new Error("Solicitacao de feedback nao encontrada.");
      }
      if (request.status !== FEEDBACK_REQUEST_STATUS.pending) {
        throw new Error("A solicitacao ja foi tratada.");
      }

      request.status = payload.status;
      request.decidedAt = new Date().toISOString();
      request.decidedByUserId = actorUser.id;

      if (payload.status === FEEDBACK_REQUEST_STATUS.approved) {
        const cycle = db.cycles.find((item) => item.id === request.cycleId);
        if (!cycle) {
          throw new Error("Ciclo de avaliacao nao encontrado.");
        }
        if (!isCycleRelationshipEnabled(cycle, "peer")) {
          throw new Error("Feedback direto esta desativado neste ciclo.");
        }
        const items = getFeedbackRequestItems(db, request.id);

        for (const item of items) {
          const reviewerUser = db.users.find(
            (user) => user.personId === item.providerPersonId && user.status === "active"
          );
          if (!reviewerUser) {
            continue;
          }

          const assignment = {
            id: createId("assignment"),
            cycleId: request.cycleId,
            reviewerUserId: reviewerUser.id,
            revieweePersonId: request.revieweePersonId,
            relationshipType: "peer",
            projectContext: "Feedback direto solicitado",
            collaborationContext: request.contextNote,
            status: "pending",
            dueDate: cycle.dueDate || ""
          };
          pushAssignment(db.assignments, assignment);
          const createdAssignment = db.assignments.find(
            (entry) =>
              entry.cycleId === assignment.cycleId &&
              entry.reviewerUserId === assignment.reviewerUserId &&
              entry.revieweePersonId === assignment.revieweePersonId &&
              entry.relationshipType === assignment.relationshipType
          );
          item.assignmentId = createdAssignment?.id || null;
        }
      }

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.feedbackRequest,
        action: payload.status === FEEDBACK_REQUEST_STATUS.approved ? "approved" : "rejected",
        entityType: "feedback_request",
        entityId: request.id,
        entityLabel:
          db.people.find((item) => item.id === request.revieweePersonId)?.name || request.id,
        actorUser,
        summary:
          payload.status === FEEDBACK_REQUEST_STATUS.approved
            ? "Solicitacao de feedback aprovada"
            : "Solicitacao de feedback rejeitada",
        detail: buildFeedbackRequestReviewAuditDetail(request)
      });

      return presentFeedbackRequest(db, request);
    },
    async submitEvaluationAssignment(payload) {
      const assignment = db.assignments.find((item) => item.id === payload.assignmentId);
      if (!assignment) {
        throw new Error("Assignment de avaliacao nao encontrado.");
      }
      if (assignment.reviewerUserId !== payload.reviewerUserId) {
        throw new Error("Usuario nao autorizado a responder esta avaliacao.");
      }
      if (assignment.status === "submitted") {
        throw new Error("Esta avaliacao ja foi enviada.");
      }

      const cycle = db.cycles.find((item) => item.id === assignment.cycleId);
      if (!cycle) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }
      if (!isReleasedCycle(cycle.status)) {
        throw new Error("As avaliacoes deste ciclo ainda nao foram liberadas pelo RH.");
      }
      if (!isCycleRelationshipEnabled(cycle, assignment.relationshipType)) {
        throw new Error("Este questionario nao esta ativo neste ciclo.");
      }

      const templateDefinition = getTemplateDefinitionForCycle({
        cycle,
        relationshipType: assignment.relationshipType,
        customLibraries: customLibraryState.published
      });
      validateEvaluationAnswers(payload.answers, templateDefinition);

      if (isAnonymousRelationship(assignment.relationshipType)) {
        const anonymousSubmission = createAnonymousSubmissionPayload(
          assignment,
          payload,
          templateDefinition
        );
        anonymousResponseState.responses.unshift(anonymousSubmission);
        await saveAnonymousResponseState(anonymousResponseState);
        if (assignment.relationshipType === "company") {
          updatePersonSatisfactionScoreInMemory(
            db,
            assignment.revieweePersonId,
            anonymousSubmission.overallScore
          );
        }
        assignment.status = "submitted";
        hydrateCycleStructure(db, assignment.cycleId);
        return anonymousSubmission;
      }

      const submission = prepareEvaluationSubmission({
        assignment,
        payload,
        createId,
        getAnsweredScaleScores,
        average
      });

      const answerRows = buildEvaluationAnswerRows({
        answers: payload.answers,
        templateDefinition,
        submissionId: submission.id,
        createId
      });

      db.submissions.unshift(submission);
      db.answers.unshift(...answerRows);
      assignment.status = "submitted";
      hydrateCycleStructure(db, assignment.cycleId);

      return enrichSubmission(db, submission);
    },
    async acknowledgeReceivedManagerFeedback(submissionId, payload, actorUser) {
      const submission = db.submissions.find((item) => item.id === submissionId);
      if (!submission) {
        throw new Error("Feedback do lider nao encontrado.");
      }

      const assignment = db.assignments.find((item) => item.id === submission.assignmentId);
      if (assignment?.relationshipType !== "manager") {
        throw new Error("Somente feedback do lider permite concordancia do colaborador.");
      }

      if (submission.revieweePersonId !== actorUser?.person?.id) {
        throw new Error("Usuario nao autorizado a responder este feedback.");
      }

      const acknowledgement = validateFeedbackAcknowledgementPayload(payload);
      submission.revieweeAcknowledgementStatus = acknowledgement.status;
      submission.revieweeAcknowledgementNote = acknowledgement.note;
      submission.revieweeAcknowledgedAt = new Date().toISOString();

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action:
          acknowledgement.status === FEEDBACK_ACKNOWLEDGEMENT_STATUS.agreed
            ? "manager_feedback_agreed"
            : "manager_feedback_disagreed",
        entityType: "evaluation_submission",
        entityId: submission.id,
        entityLabel:
          db.people.find((item) => item.id === submission.revieweePersonId)?.name || submission.id,
        actorUser,
        summary:
          acknowledgement.status === FEEDBACK_ACKNOWLEDGEMENT_STATUS.agreed
            ? "Colaborador concordou com o feedback do lider"
            : "Colaborador discordou do feedback do lider",
        detail: acknowledgement.note || "Sem observacoes adicionais."
      });

      return enrichSubmission(db, submission, customLibraryState.published);
    },
    async getApplauseEntries(actorUser) {
      const entries = db.applauseEntries.map((item) => {
        const sender = db.people.find((person) => person.id === item.senderPersonId);
        const receiver = db.people.find((person) => person.id === item.receiverPersonId);
        return {
          ...item,
          senderName: sender?.name || "",
          receiverName: receiver?.name || ""
        };
      });

      if (isOrgWideUser(actorUser)) {
        return entries;
      }

      if (isManagerUser(actorUser)) {
        const visiblePersonIds = new Set([
          actorUser.person.id,
          ...getTeamPeople(db.people, actorUser.person.id).map((item) => item.id)
        ]);
        return entries.filter(
          (item) =>
            visiblePersonIds.has(item.senderPersonId) ||
            visiblePersonIds.has(item.receiverPersonId)
        );
      }

      return entries.filter(
        (item) =>
          item.senderPersonId === actorUser.person.id ||
          item.receiverPersonId === actorUser.person.id
      );
    },
    async createApplauseEntry(payload) {
      assertCanCreateApplause(db.applauseEntries, payload);

      const applause = {
        id: createId("applause"),
        createdAt: new Date().toISOString(),
        status: "Validado",
        ...payload
      };
      db.applauseEntries.unshift(applause);
      const sender = db.people.find((person) => person.id === applause.senderPersonId);
      const receiver = db.people.find((person) => person.id === applause.receiverPersonId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.applause,
        action: "created",
        entityType: "applause_entry",
        entityId: applause.id,
        entityLabel: applause.category,
        actorUser: db.users.find((user) => user.personId === applause.senderPersonId) || null,
        summary: `Aplause registrado para ${receiver?.name || "colaborador"}`,
        detail: buildApplauseAuditDetail({
          category: applause.category,
          senderName: sender?.name,
          receiverName: receiver?.name
        })
      });
      return {
        ...applause,
        senderName: sender?.name || "",
        receiverName: receiver?.name || ""
      };
    },
    async updateApplauseEntry(applauseId, payload, actorUser) {
      const applause = db.applauseEntries.find((item) => item.id === applauseId);
      if (!applause) {
        throw new Error("Registro de Aplause nao encontrado.");
      }

      assertCanManageApplauseEntry(actorUser, db.people, applause, {
        isOrgWideUser,
        getTeamPeople
      });
      assertValidApplauseStatus(payload.status);

      applause.receiverPersonId = payload.receiverPersonId;
      applause.category = payload.category;
      applause.impact = payload.impact;
      applause.contextNote = payload.contextNote;
      applause.status = payload.status;

      const sender = db.people.find((person) => person.id === applause.senderPersonId);
      const receiver = db.people.find((person) => person.id === applause.receiverPersonId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.applause,
        action: payload.status === "Arquivado" ? "archived" : "updated",
        entityType: "applause_entry",
        entityId: applause.id,
        entityLabel: applause.category,
        actorUser,
        summary:
          payload.status === "Arquivado"
            ? `Aplause arquivado para ${receiver?.name || "colaborador"}`
            : `Aplause atualizado para ${receiver?.name || "colaborador"}`,
        detail: buildApplauseAuditDetail({
          category: applause.category,
          senderName: sender?.name,
          receiverName: receiver?.name
        })
      });

      return {
        ...applause,
        senderName: sender?.name || "",
        receiverName: receiver?.name || ""
      };
    },
    async getDevelopmentRecords(actorUser) {
      const actorPersonId = actorUser.person?.id || actorUser.personId;
      const records = db.developmentRecords.map((item) => {
        const person = db.people.find((person) => person.id === item.personId);
        return {
          ...item,
          status: item.status || "active",
          archivedAt: item.archivedAt || null,
          personName: person?.name || ""
        };
      });

      if (isOrgWideUser(actorUser)) {
        return records;
      }

      if (isManagerUser(actorUser)) {
        const visiblePersonIds = new Set([
          actorPersonId,
          ...getTeamPeople(db.people, actorPersonId).map((item) => item.id)
        ]);
        return records.filter((item) => visiblePersonIds.has(item.personId));
      }

      return records.filter((item) => item.personId === actorPersonId);
    },
    async createDevelopmentRecord(payload, actorUser) {
      assertCanManageDevelopmentSubject(actorUser, db.people, payload.personId, {
        isOrgWideUser,
        isManagerUser,
        getTeamPeople
      });

      const record = {
        id: createId("development"),
        ...payload,
        status: "active",
        archivedAt: null
      };
      db.developmentRecords.unshift(record);
      const person = db.people.find((item) => item.id === record.personId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.development,
        action: "created",
        entityType: "development_record",
        entityId: record.id,
        entityLabel: record.title,
        actorUser,
        summary: `Registro de desenvolvimento criado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentRecordAuditDetail(record)
      });
      return record;
    },
    async updateDevelopmentRecord(recordId, payload, actorUser) {
      const record = db.developmentRecords.find((item) => item.id === recordId);
      if (!record) {
        throw new Error("Registro de desenvolvimento nao encontrado.");
      }

      assertCanManageDevelopmentSubject(actorUser, db.people, payload.personId, {
        isOrgWideUser,
        isManagerUser,
        getTeamPeople
      });
      assertValidDevelopmentRecordStatus(payload.status);

      record.personId = payload.personId;
      record.recordType = payload.recordType;
      record.title = payload.title;
      record.providerName = payload.providerName;
      record.completedAt = payload.completedAt;
      record.skillSignal = payload.skillSignal;
      record.notes = payload.notes;
      record.status = payload.status;
      record.archivedAt = payload.status === "archived" ? new Date().toISOString() : null;

      const person = db.people.find((item) => item.id === record.personId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.development,
        action: payload.status === "archived" ? "archived" : "updated",
        entityType: "development_record",
        entityId: record.id,
        entityLabel: record.title,
        actorUser,
        summary:
          payload.status === "archived"
            ? `Registro de desenvolvimento arquivado para ${person?.name || "pessoa"}`
            : `Registro de desenvolvimento atualizado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentRecordAuditDetail(record)
      });

      return {
        ...record,
        personName: person?.name || ""
      };
    },
    async getLearningIntegrationEvents(actorUser) {
      if (!isOrgWideUser(actorUser)) {
        throw new Error("Perfil sem permissao para visualizar integracoes de aprendizagem.");
      }

      return db.learningIntegrationEvents.map((event) =>
        presentLearningIntegrationEvent(event, db.people)
      );
    },
    async ingestLearningIntegrationEvents(payload, actorUser) {
      if (!isOrgWideUser(actorUser)) {
        throw new Error("Perfil sem permissao para receber integracoes de aprendizagem.");
      }

      const rows = buildLearningIntegrationEventRows(payload, db.people, db.users, actorUser);
      const existingKeys = new Set(
        db.learningIntegrationEvents.map((item) => `${item.sourceSystem}:${item.externalId}`)
      );
      const accepted = rows.filter((row) => !existingKeys.has(`${row.sourceSystem}:${row.externalId}`));

      db.learningIntegrationEvents.unshift(...accepted);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.development,
        action: "imported",
        entityType: "learning_integration_event",
        entityId: accepted[0]?.id || rows[0]?.id || "learning_integration",
        entityLabel: payload.sourceSystem || "Integracao de aprendizagem",
        actorUser,
        summary: `${accepted.length} eventos de aprendizagem recebidos de ${payload.sourceSystem || "sistema externo"}`,
        detail: `${accepted.filter((item) => item.processingStatus === "ready_for_review").length} prontos para revisao · ${accepted.filter((item) => item.processingStatus === "needs_review").length} exigem conciliacao`
      });

      return {
        sourceSystem: payload.sourceSystem,
        received: rows.length,
        accepted: accepted.length,
        duplicates: rows.length - accepted.length,
        events: accepted.map((event) => presentLearningIntegrationEvent(event, db.people))
      };
    },
    async applyLearningIntegrationEvent(eventId, payload, actorUser) {
      if (!isOrgWideUser(actorUser)) {
        throw new Error("Perfil sem permissao para aplicar integracoes de aprendizagem.");
      }

      const event = db.learningIntegrationEvents.find((item) => item.id === eventId);
      if (!event) {
        throw new Error("Evento de aprendizagem nao encontrado.");
      }

      const application = buildLearningIntegrationApplicationPayload(
        event,
        payload,
        db.competencies
      );
      const appliedEntity =
        application.entityType === "development_record"
          ? await this.createDevelopmentRecord(application.payload, actorUser)
          : await this.createDevelopmentPlan(application.payload, actorUser);

      event.processingStatus = "applied";
      event.appliedEntityType = application.entityType;
      event.appliedEntityId = appliedEntity.id;
      event.appliedAt = new Date().toISOString();
      event.reviewNote = String(payload?.reviewNote || "").trim();

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.development,
        action: "applied",
        entityType: "learning_integration_event",
        entityId: event.id,
        entityLabel: event.title,
        actorUser,
        summary: `Evento de aprendizagem aplicado em ${application.entityType === "development_record" ? "desenvolvimento" : "PDI"}`,
        detail: `${event.sourceSystem} · ${event.externalId} · ${appliedEntity.id}`
      });

      return {
        event: presentLearningIntegrationEvent(event, db.people),
        appliedEntity
      };
    },
    async getDevelopmentPlans(actorUser) {
      const actorPersonId = actorUser.person?.id || actorUser.personId;
      const plans = db.developmentPlans.map((item) =>
        enrichDevelopmentPlan(item, db.people, db.cycles, db.competencies)
      );

      if (isOrgWideUser(actorUser)) {
        return plans;
      }

      if (isManagerUser(actorUser)) {
        const visiblePersonIds = new Set([
          actorPersonId,
          ...getTeamPeople(db.people, actorPersonId).map((item) => item.id)
        ]);
        return plans.filter((item) => visiblePersonIds.has(item.personId));
      }

      return plans.filter((item) => item.personId === actorPersonId);
    },
    async createDevelopmentPlan(payload, actorUser) {
      assertCanCreateDevelopmentPlan(actorUser, db.people, payload.personId);
      if (payload.cycleId && !db.cycles.some((item) => item.id === payload.cycleId)) {
        throw new Error("Ciclo do PDI nao encontrado.");
      }
      if (
        payload.competencyId &&
        !db.competencies.some((item) => item.id === payload.competencyId)
      ) {
        throw new Error("Competencia do PDI nao encontrada.");
      }

      const plan = {
        id: createId("development_plan"),
        personId: payload.personId,
        cycleId: payload.cycleId || null,
        competencyId: payload.competencyId || null,
        focusTitle: payload.focusTitle,
        actionText: payload.actionText,
        dueDate: payload.dueDate,
        expectedEvidence: payload.expectedEvidence,
        status: "active",
        createdByUserId: actorUser.id,
        createdAt: new Date().toISOString(),
        archivedAt: null
      };
      db.developmentPlans.unshift(plan);
      const person = db.people.find((item) => item.id === plan.personId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.development,
        action: "plan_created",
        entityType: "development_plan",
        entityId: plan.id,
        entityLabel: plan.focusTitle,
        actorUser,
        summary: `PDI criado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentPlanAuditDetail(plan)
      });
      return enrichDevelopmentPlan(plan, db.people, db.cycles, db.competencies);
    },
    async updateDevelopmentPlan(planId, payload, actorUser) {
      const plan = db.developmentPlans.find((item) => item.id === planId);
      if (!plan) {
        throw new Error("PDI nao encontrado.");
      }

      assertCanCreateDevelopmentPlan(actorUser, db.people, payload.personId);
      assertValidDevelopmentPlanStatus(payload.status);
      if (payload.cycleId && !db.cycles.some((item) => item.id === payload.cycleId)) {
        throw new Error("Ciclo do PDI nao encontrado.");
      }
      if (
        payload.competencyId &&
        !db.competencies.some((item) => item.id === payload.competencyId)
      ) {
        throw new Error("Competencia do PDI nao encontrada.");
      }

      plan.personId = payload.personId;
      plan.cycleId = payload.cycleId || null;
      plan.competencyId = payload.competencyId || null;
      plan.focusTitle = payload.focusTitle;
      plan.actionText = payload.actionText;
      plan.dueDate = payload.dueDate;
      plan.expectedEvidence = payload.expectedEvidence;
      plan.status = payload.status;
      plan.archivedAt = payload.status === "archived" ? new Date().toISOString() : null;

      const person = db.people.find((item) => item.id === plan.personId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.development,
        action: payload.status === "archived" ? "plan_archived" : "plan_updated",
        entityType: "development_plan",
        entityId: plan.id,
        entityLabel: plan.focusTitle,
        actorUser,
        summary:
          payload.status === "archived"
            ? `PDI arquivado para ${person?.name || "pessoa"}`
            : `PDI atualizado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentPlanAuditDetail(plan)
      });

      return enrichDevelopmentPlan(plan, db.people, db.cycles, db.competencies);
    },
    async getDashboardOverview(actorUser, options = {}) {
      const allResponses = [
        ...db.submissions.map((item) => enrichSubmission(db, item)),
        ...anonymousResponseState.responses
      ];
      const availableAreas = [...new Set(db.people.map((person) => person.area))].sort();
      const timeGrouping = options.timeGrouping || "semester";

      if (isOrgWideUser(actorUser)) {
        const scopedPeople = options.area
          ? db.people.filter((person) => person.area === options.area)
          : db.people;
        const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
        const scopedAssignments = db.assignments.filter((item) =>
          scopedPersonIds.has(item.revieweePersonId)
        );
        const scopedCycleIds = new Set(scopedAssignments.map((item) => item.cycleId));
        const scopedApplause = db.applauseEntries.filter((item) =>
          scopedPersonIds.has(item.receiverPersonId)
        );
        const scopedDevelopment = db.developmentRecords.filter((item) =>
          scopedPersonIds.has(item.personId)
        );
        const scopedResponses = allResponses.filter((item) =>
          scopedPersonIds.has(item.revieweePersonId)
        );
        const scopedCycles = db.cycles.filter((cycle) => scopedCycleIds.has(cycle.id));

        return buildDashboardPayload({
          mode: "executive",
          notice: options.area
            ? `Leitura consolidada filtrada para a area ${options.area}.`
            : "Leitura consolidada para RH, compliance e lideranca.",
          scopeLabel: options.area ? `Area: ${options.area}` : "Consolidado organizacional",
          cycles: scopedCycles,
          people: scopedPeople,
          assignments: scopedAssignments,
          applauseEntries: scopedApplause,
          developmentRecords: scopedDevelopment,
          responses: scopedResponses,
          availableAreas,
          selectedArea: options.area,
          timeGrouping,
          evaluationHighlights: [
            "Leitura consolidada pronta para ritos executivos e comites.",
            "Filtro por area ajuda a comparar recortes sem expor detalhes indevidos.",
            "KPIs, donuts e mix de avaliacoes se ajustam ao escopo aplicado."
          ]
        });
      }

      if (isManagerUser(actorUser)) {
        const teamPeople = getTeamPeople(db.people, actorUser.person.id);
        const scopedPeople = [actorUser.person, ...teamPeople];
        const visiblePersonIds = new Set(scopedPeople.map((item) => item.id));
        const teamAssignments = db.assignments.filter(
          (item) =>
            item.reviewerUserId === actorUser.id || visiblePersonIds.has(item.revieweePersonId)
        );
        const teamCycleIds = new Set(teamAssignments.map((item) => item.cycleId));
        const teamResponses = allResponses.filter((response) =>
          visiblePersonIds.has(response.revieweePersonId)
        );
        const teamApplause = db.applauseEntries.filter((item) =>
          visiblePersonIds.has(item.receiverPersonId)
        );
        const teamDevelopment = db.developmentRecords.filter((item) =>
          visiblePersonIds.has(item.personId)
        );
        const teamCycles = db.cycles.filter((cycle) => teamCycleIds.has(cycle.id));

        return buildDashboardPayload({
          mode: "team",
          notice: "Leitura da sua equipe direta, sem exposicao de outras areas.",
          scopeLabel: "Equipe direta",
          cycles: teamCycles,
          people: scopedPeople,
          assignments: teamAssignments,
          applauseEntries: teamApplause,
          developmentRecords: teamDevelopment,
          responses: teamResponses,
          timeGrouping,
          evaluationHighlights: [
            "Voce acompanha somente sua equipe direta.",
            "Respostas confidenciais continuam agregadas quando aplicavel.",
            "O dashboard gerencial reforca entregas, cobertura e desenvolvimento do time."
          ]
        });
      }

      const myAssignments = db.assignments.filter((item) => item.reviewerUserId === actorUser.id);
      const myCycleIds = new Set(myAssignments.map((item) => item.cycleId));
      const personalResponses = allResponses.filter((response) => response.reviewerUserId === actorUser.id);
      const personalApplause = db.applauseEntries.filter(
        (item) => item.receiverPersonId === actorUser.person.id
      );
      const myDevelopmentRecords = db.developmentRecords.filter(
        (item) => item.personId === actorUser.person.id
      );
      const myCycles = db.cycles.filter((cycle) => myCycleIds.has(cycle.id));

      return buildDashboardPayload({
        mode: "personal",
        notice: "Voce esta vendo apenas seu recorte individual.",
        scopeLabel: "Visao pessoal",
        cycles: myCycles,
        people: [db.people.find((item) => item.id === actorUser.person.id)].filter(Boolean),
        assignments: myAssignments,
        applauseEntries: personalApplause,
        developmentRecords: myDevelopmentRecords,
        responses: personalResponses,
        timeGrouping,
        evaluationHighlights: [
          "Seu dashboard mostra apenas dados pessoais e agregados permitidos.",
          "Respostas confidenciais de lideranca e empresa entram somente em leitura agregada.",
          "A trilha de desenvolvimento e o ciclo aparecem no mesmo contexto operacional."
        ]
      });
    }
  };
}

function buildMysqlStore(
  pool,
  customLibraryState,
  anonymousResponseState,
  {
    supportsCycleConfig,
    supportsFeedbackAcknowledgement,
    supportsAssignmentReminder,
    supportsPairings,
    supportsLearningIntegrations
  } = {}
) {
  return {
    async checkHealth() {
      await pool.query("SELECT 1");
      return {
        database: "ok"
      };
    },
    async findUserByEmail(email) {
      const [rows] = await pool.query(
        `SELECT u.id, u.person_id AS personId, u.email, u.password_hash AS passwordHash,
                u.role_key AS roleKey, u.status
         FROM users u
         WHERE u.email = ?
         LIMIT 1`,
        [email]
      );
      return rows[0] || null;
    },
    async getUserById(userId) {
      let rows;
      try {
        [rows] = await pool.query(
          `SELECT u.id, u.email, u.role_key AS roleKey, u.status,
                  p.id AS personId, p.name, p.role_title AS roleTitle, p.area,
                  p.manager_person_id AS managerPersonId, manager.name AS managerName,
                  p.employment_type AS employmentType
           FROM users u
           JOIN people p ON p.id = u.person_id
           LEFT JOIN people manager ON manager.id = p.manager_person_id
           WHERE u.id = ?
           LIMIT 1`,
          [userId]
        );
      } catch (error) {
        if (error?.code !== "ER_BAD_FIELD_ERROR" && error?.errno !== 1054) {
          throw error;
        }
        [rows] = await pool.query(
          `SELECT u.id, u.email, u.role_key AS roleKey, u.status,
                  p.id AS personId, p.name, p.role_title AS roleTitle, p.area,
                  p.manager_person_id AS managerPersonId, manager.name AS managerName
           FROM users u
           JOIN people p ON p.id = u.person_id
           LEFT JOIN people manager ON manager.id = p.manager_person_id
           WHERE u.id = ?
           LIMIT 1`,
          [userId]
        );
      }

      if (!rows[0]) {
        return null;
      }

      return {
        id: rows[0].id,
        email: rows[0].email,
        roleKey: rows[0].roleKey,
        status: rows[0].status,
        person: {
          id: rows[0].personId,
          name: rows[0].name,
          roleTitle: rows[0].roleTitle,
          area: rows[0].area,
          managerPersonId: rows[0].managerPersonId || null,
          managerName: rows[0].managerName,
          employmentType: rows[0].employmentType || "internal"
        }
      };
    },
    async authenticateUser(email, password) {
      const user = await this.findUserByEmail(email);
      if (!user || user.status !== "active" || !verifyPasswordHash(user.passwordHash, password)) {
        return null;
      }
      return this.getUserById(user.id);
    },
    async getAreas(actorUser) {
      const [areas, people] = await Promise.all([fetchAreaRows(pool), fetchPeopleRows(pool)]);
      return filterAreasForUser(areas, people, actorUser);
    },
    async getCompetencies() {
      return fetchCompetencyRows(pool);
    },
    async createCompetency(payload, actorUser) {
      if (!canManageCompetencies(actorUser)) {
        throw new Error("Perfil sem permissao para cadastrar competencias.");
      }

      const existing = await fetchCompetencyRows(pool);
      const competencyData = prepareCompetencyMutation(existing, payload);

      const competency = {
        id: createId("competency"),
        ...competencyData
      };

      await pool.query(
        `INSERT INTO competencies (id, competency_key, name, description, status)
         VALUES (?, ?, ?, ?, ?)`,
        [competency.id, competency.key, competency.name, competency.description, competency.status]
      );

      await persistAuditLog(pool, {
        category: AUDIT_CATEGORIES.competency,
        action: "created",
        entityType: "competency",
        entityId: competency.id,
        entityLabel: competency.name,
        actorUser,
        summary: `Competencia criada: ${competency.name}`,
        detail: `${competency.key} · ${competency.status}`
      });

      return presentCompetency(competency);
    },
    async updateCompetency(competencyId, payload, actorUser) {
      if (!canManageCompetencies(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar competencias.");
      }

      const existing = await fetchCompetencyRows(pool);
      const competency = existing.find((item) => item.id === competencyId);
      if (!competency) {
        throw new Error("Competencia nao encontrada.");
      }

      const competencyData = prepareCompetencyMutation(existing, payload, {
        competencyId
      });

      await pool.query(
        `UPDATE competencies
         SET competency_key = ?, name = ?, description = ?, status = ?
         WHERE id = ?`,
        [
          competencyData.key,
          competencyData.name,
          competencyData.description,
          competencyData.status,
          competencyId
        ]
      );

      await persistAuditLog(pool, {
        category: AUDIT_CATEGORIES.competency,
        action: "updated",
        entityType: "competency",
        entityId: competencyId,
        entityLabel: competencyData.name,
        actorUser,
        summary: `Competencia atualizada: ${competencyData.name}`,
        detail: `${competencyData.key} · ${competencyData.status}`
      });

      return presentCompetency({
        ...competency,
        ...competencyData
      });
    },
    async createArea(payload, actorUser) {
      if (!canManagePeople(actorUser)) {
        throw new Error("Perfil sem permissao para cadastrar areas.");
      }

      const [areas, people] = await Promise.all([fetchAreaRows(pool), fetchPeopleRows(pool)]);
      const areaMutation = prepareAreaMutation({
        areas,
        payload,
        people,
        assertValidAreaManagerReference
      });

      const area = {
        id: createId("area"),
        name: areaMutation.normalizedName,
        managerPersonId: areaMutation.managerPersonId || null
      };

      await pool.query(
        `INSERT INTO areas (id, name, manager_person_id)
         VALUES (?, ?, ?)`,
        [area.id, area.name, area.managerPersonId]
      );

      return enrichArea(people, area);
    },
    async updateArea(areaId, payload, actorUser) {
      if (!canManagePeople(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar areas.");
      }

      const [areas, people] = await Promise.all([fetchAreaRows(pool), fetchPeopleRows(pool)]);
      const area = areas.find((item) => item.id === areaId);
      if (!area) {
        throw new Error("Area nao encontrada.");
      }

      const areaMutation = prepareAreaMutation({
        areaId,
        areas,
        payload,
        people,
        assertValidAreaManagerReference
      });
      const nextManagerPersonId =
        areaMutation.managerPersonId === undefined
          ? area.managerPersonId
          : areaMutation.managerPersonId;

      await pool.query(
        `UPDATE areas
         SET name = ?, manager_person_id = ?
         WHERE id = ?`,
        [areaMutation.normalizedName, nextManagerPersonId, areaId]
      );

      if (area.name !== areaMutation.normalizedName) {
        await pool.query(`UPDATE people SET area = ? WHERE area = ?`, [
          areaMutation.normalizedName,
          area.name
        ]);
      }

      return enrichArea(people.map((person) => ({
        ...person,
        area: person.area === area.name ? areaMutation.normalizedName : person.area
      })), {
        ...area,
        name: areaMutation.normalizedName,
        managerPersonId: nextManagerPersonId
      });
    },
    async getPeople(actorUser) {
      const [people, areas] = await Promise.all([fetchPeopleRows(pool), fetchAreaRows(pool)]);
      return filterPeopleForUser(people, actorUser, areas);
    },
    async createPerson(payload, actorUser) {
      if (!canManagePeople(actorUser)) {
        throw new Error("Perfil sem permissao para cadastrar pessoas.");
      }

      const [people, areas] = await Promise.all([fetchPeopleRows(pool), fetchAreaRows(pool)]);
      const { personPayload, shouldLeadArea } = preparePersonMutation({
        areas,
        payload,
        people,
        assertNoDuplicatePersonProfile,
        assertNoManagerCycle,
        assertValidAreaReference,
        assertValidManagerReference
      });

      const person = {
        id: createId("person"),
        ...personPayload,
        satisfactionScore: null
      };

      try {
        await pool.query(
          `INSERT INTO people
           (id, name, role_title, area, work_unit, work_mode, manager_person_id, employment_type, satisfaction_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            person.id,
            person.name,
            person.roleTitle,
            person.area,
            person.workUnit,
            person.workMode,
            person.managerPersonId,
            person.employmentType,
            person.satisfactionScore
          ]
        );
      } catch (error) {
        if (error?.code !== "ER_BAD_FIELD_ERROR" && error?.errno !== 1054) {
          throw error;
        }

        await pool.query(
          `INSERT INTO people
           (id, name, role_title, area, manager_person_id, employment_type, satisfaction_score)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            person.id,
            person.name,
            person.roleTitle,
            person.area,
            person.managerPersonId,
            person.employmentType,
            person.satisfactionScore
          ]
        );
      }

      await pool.query(`UPDATE areas SET manager_person_id = NULL WHERE manager_person_id = ?`, [person.id]);
      if (shouldLeadArea) {
        await pool.query(
          `UPDATE areas
           SET manager_person_id = ?
           WHERE LOWER(name) = LOWER(?)
           LIMIT 1`,
          [person.id, person.area]
        );
      }

      const nextAreas = assignAreaLeadershipSnapshot(areas, person.id, person.area, shouldLeadArea);
      return enrichPerson(people, person, nextAreas);
    },
    async updatePerson(personId, payload, actorUser) {
      if (!canManagePeople(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar pessoas.");
      }

      const [people, areas] = await Promise.all([fetchPeopleRows(pool), fetchAreaRows(pool)]);
      const person = people.find((item) => item.id === personId);
      if (!person) {
        throw new Error("Pessoa nao encontrada.");
      }

      const { personPayload, shouldLeadArea } = preparePersonMutation({
        areaId: personId,
        areas,
        payload: {
          ...payload
        },
        people,
        assertNoDuplicatePersonProfile,
        assertNoManagerCycle,
        assertValidAreaReference,
        assertValidManagerReference
      });

      try {
        await pool.query(
          `UPDATE people
           SET name = ?, role_title = ?, area = ?, work_unit = ?, work_mode = ?, manager_person_id = ?, employment_type = ?, satisfaction_score = ?
           WHERE id = ?`,
          [
            personPayload.name,
            personPayload.roleTitle,
            personPayload.area,
            personPayload.workUnit,
            personPayload.workMode,
            personPayload.managerPersonId,
            personPayload.employmentType,
            person.satisfactionScore,
            personId
          ]
        );
      } catch (error) {
        if (error?.code !== "ER_BAD_FIELD_ERROR" && error?.errno !== 1054) {
          throw error;
        }

        await pool.query(
          `UPDATE people
           SET name = ?, role_title = ?, area = ?, manager_person_id = ?, employment_type = ?, satisfaction_score = ?
           WHERE id = ?`,
          [
            personPayload.name,
            personPayload.roleTitle,
            personPayload.area,
            personPayload.managerPersonId,
            personPayload.employmentType,
            person.satisfactionScore,
            personId
          ]
        );
      }

      await pool.query(`UPDATE areas SET manager_person_id = NULL WHERE manager_person_id = ?`, [personId]);
      if (shouldLeadArea) {
        await pool.query(
          `UPDATE areas
           SET manager_person_id = ?
           WHERE LOWER(name) = LOWER(?)
           LIMIT 1`,
          [personId, personPayload.area]
        );
      }

      const nextAreas = assignAreaLeadershipSnapshot(
        areas,
        personId,
        personPayload.area,
        shouldLeadArea
      );
      return enrichPerson(
        people.map((item) =>
          item.id === personId
            ? {
                ...item,
                ...personPayload
              }
            : item
        ),
        {
          ...person,
          ...personPayload
        },
        nextAreas
      );
    },
    async getUsers(actorUser) {
      if (!canManageUsers(actorUser)) {
        return [];
      }

      const [rows] = await pool.query(
        `SELECT u.id, u.person_id AS personId, p.name AS personName, p.area AS personArea,
                p.role_title AS personRoleTitle, p.work_unit AS personWorkUnit,
                p.work_mode AS personWorkMode, manager.name AS managerName, areaManager.name AS areaManagerName,
                u.email, u.role_key AS roleKey, u.status
         FROM users u
         JOIN people p ON p.id = u.person_id
         LEFT JOIN people manager ON manager.id = p.manager_person_id
         LEFT JOIN areas a ON a.name = p.area
         LEFT JOIN people areaManager ON areaManager.id = a.manager_person_id
         ORDER BY p.name`
      );
      return rows;
    },
    async getAuditTrail(actorUser, options = {}) {
      return fetchAuditLogs(pool, actorUser, options);
    },
    async createUser(payload, actorUser) {
      if (!canManageUsers(actorUser)) {
        throw new Error("Perfil sem permissao para cadastrar usuarios.");
      }

      const userData = prepareUserWrite([], payload, { requirePassword: true });

      const [personRows] = await pool.query(
        `SELECT p.id, p.name, p.area, p.role_title AS roleTitle, p.work_unit AS workUnit,
                p.work_mode AS workMode, manager.name AS managerName, areaManager.name AS areaManagerName
         FROM people p
         LEFT JOIN people manager ON manager.id = p.manager_person_id
         LEFT JOIN areas a ON a.name = p.area
         LEFT JOIN people areaManager ON areaManager.id = a.manager_person_id
         WHERE p.id = ?
         LIMIT 1`,
        [payload.personId]
      );
      assertUserPersonExists(personRows[0]);

      const [personUserRows] = await pool.query(
        `SELECT id
         FROM users
         WHERE person_id = ?
         LIMIT 1`,
        [payload.personId]
      );
      assertPersonHasNoLinkedUser(Boolean(personUserRows[0]));

      const [emailRows] = await pool.query(
        `SELECT id, email
         FROM users
         WHERE email = ? OR id = ?
         LIMIT 2`,
        [userData.email, "__no_user__"]
      );
      prepareUserWrite(emailRows, userData, { requirePassword: true });

      const user = {
        id: createId("user"),
        personId: payload.personId,
        email: userData.email,
        roleKey: userData.roleKey,
        status: userData.status
      };

      await pool.query(
        `INSERT INTO users
         (id, person_id, email, password_hash, role_key, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.id, user.personId, user.email, hashPassword(userData.password), user.roleKey, user.status]
      );

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.user,
        action: "created",
        entityType: "user",
        entityId: user.id,
        entityLabel: personRows[0].name,
        actorUser,
        summary: `Usuario criado para ${personRows[0].name}`,
        detail: buildUserAuditDetail(userData)
      });

      return {
        ...user,
        personName: personRows[0].name,
        personArea: personRows[0].area,
        personRoleTitle: personRows[0].roleTitle || "",
        personWorkUnit: personRows[0].workUnit || "",
        personWorkMode: personRows[0].workMode || "",
        managerName: personRows[0].managerName || "",
        areaManagerName: personRows[0].areaManagerName || ""
      };
    },
    async updateUser(userId, payload, actorUser) {
      if (!canManageUsers(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar usuarios.");
      }

      const userData = prepareUserWrite([], payload, { userId });

      const [rows] = await pool.query(
        `SELECT u.id, u.person_id AS personId, p.name AS personName, p.area AS personArea,
                p.role_title AS personRoleTitle, p.work_unit AS personWorkUnit,
                p.work_mode AS personWorkMode, manager.name AS managerName, areaManager.name AS areaManagerName,
                u.email
         FROM users u
         JOIN people p ON p.id = u.person_id
         LEFT JOIN people manager ON manager.id = p.manager_person_id
         LEFT JOIN areas a ON a.name = p.area
         LEFT JOIN people areaManager ON areaManager.id = a.manager_person_id
         WHERE u.id = ?
         LIMIT 1`,
        [userId]
      );
      if (!rows[0]) {
        throw new Error("Usuario nao encontrado.");
      }

      const [emailRows] = await pool.query(
        `SELECT id, email
         FROM users
         WHERE email = ? OR id = ?
         LIMIT 2`,
        [userData.email, userId]
      );
      prepareUserWrite(emailRows, userData, { userId });

      if (userData.password) {
        await pool.query(
          `UPDATE users
           SET email = ?, role_key = ?, status = ?, password_hash = ?
           WHERE id = ?`,
          [userData.email, userData.roleKey, userData.status, hashPassword(userData.password), userId]
        );
      } else {
        await pool.query(
          `UPDATE users
           SET email = ?, role_key = ?, status = ?
           WHERE id = ?`,
          [userData.email, userData.roleKey, userData.status, userId]
        );
      }

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.user,
        action: "updated",
        entityType: "user",
        entityId: userId,
        entityLabel: rows[0].personName,
        actorUser,
        summary: `Acesso atualizado para ${rows[0].personName}`,
        detail: buildUserAuditDetail(userData)
      });

      return {
        id: userId,
        personId: rows[0].personId,
        personName: rows[0].personName,
        personArea: rows[0].personArea,
        personRoleTitle: rows[0].personRoleTitle || "",
        personWorkUnit: rows[0].personWorkUnit || "",
        personWorkMode: rows[0].personWorkMode || "",
        managerName: rows[0].managerName || "",
        areaManagerName: rows[0].areaManagerName || "",
        email: userData.email,
        roleKey: userData.roleKey,
        status: userData.status
      };
    },
    async getSummary(actorUser) {
      if (isFullAccessUser(actorUser)) {
        const [people] = await pool.query("SELECT COUNT(*) AS total FROM people");
        const [incidents] = await pool.query(
          "SELECT COUNT(*) AS total FROM incident_reports WHERE status <> 'Concluido'"
        );
        const [cycles] = await pool.query(
          "SELECT COUNT(*) AS total FROM evaluation_cycles WHERE status = ?",
          [CYCLE_STATUS.released]
        );
        const [applause] = await pool.query("SELECT COUNT(*) AS total FROM applause_entries");
        const [development] = await pool.query(
          "SELECT COUNT(*) AS total FROM development_records"
        );
        const [assignments] = await pool.query(
          "SELECT COUNT(*) AS total FROM evaluation_assignments WHERE status = 'pending'"
        );

        return {
          mode: "executive",
          peopleCount: people[0].total,
          openIncidents: incidents[0].total,
          activeEvaluationCycles: cycles[0].total,
          applauseCount: applause[0].total,
          developmentRecords: development[0].total,
          pendingAssignments: assignments[0].total
        };
      }

      if (isManagerUser(actorUser)) {
        const people = await fetchPeopleRows(pool);
        const visiblePersonIds = new Set([
          actorUser.person.id,
          ...getTeamPeople(people, actorUser.person.id).map((item) => item.id)
        ]);
        const [cycles] = await pool.query(
          "SELECT COUNT(*) AS total FROM evaluation_cycles WHERE status = ?",
          [CYCLE_STATUS.released]
        );
        const [assignments] = await pool.query(
          `SELECT reviewer_user_id AS reviewerUserId, reviewee_person_id AS revieweePersonId, status
           FROM evaluation_assignments`
        );
        const [applause] = await pool.query(
          `SELECT sender_person_id AS senderPersonId, receiver_person_id AS receiverPersonId
           FROM applause_entries`
        );
        const [development] = await pool.query(
          `SELECT person_id AS personId FROM development_records`
        );

        return {
          mode: "team",
          peopleCount: visiblePersonIds.size,
          openIncidents: 0,
          activeEvaluationCycles: cycles[0].total,
          applauseCount: applause.filter(
            (item) =>
              visiblePersonIds.has(item.senderPersonId) ||
              visiblePersonIds.has(item.receiverPersonId)
          ).length,
          developmentRecords: development.filter((item) => visiblePersonIds.has(item.personId))
            .length,
          pendingAssignments: assignments.filter(
            (item) =>
              item.status === "pending" &&
              (item.reviewerUserId === actorUser.id ||
                visiblePersonIds.has(item.revieweePersonId))
          ).length
        };
      }

      const [cycles] = await pool.query(
        "SELECT COUNT(*) AS total FROM evaluation_cycles WHERE status = ?",
        [CYCLE_STATUS.released]
      );
      const [assignments] = await pool.query(
        `SELECT COUNT(*) AS total
         FROM evaluation_assignments
         WHERE reviewer_user_id = ? AND status = 'pending'`,
        [actorUser.id]
      );
      const [applause] = await pool.query(
        `SELECT COUNT(*) AS total FROM applause_entries WHERE receiver_person_id = ?`,
        [actorUser.person.id]
      );
      const [development] = await pool.query(
        `SELECT COUNT(*) AS total FROM development_records WHERE person_id = ?`,
        [actorUser.person.id]
      );

      return {
        mode: "personal",
        peopleCount: 1,
        openIncidents: 0,
        activeEvaluationCycles: cycles[0].total,
        applauseCount: applause[0].total,
        developmentRecords: development[0].total,
        pendingAssignments: assignments[0].total
      };
    },
    async getIncidents(actorUser) {
      if (!canAccessIncidents(actorUser)) {
        return [];
      }

      const [areas, people] = await Promise.all([fetchAreaRows(pool), fetchPeopleRows(pool)]);
      const [rows] = await pool.query(
        `SELECT id, title, category, classification, status, anonymity, reporter_label AS reporterLabel,
                responsible_area AS responsibleArea, assigned_person_id AS assignedPersonId,
                assigned_to AS assignedTo, created_at AS createdAt, description
         FROM incident_reports
         ORDER BY created_at DESC`
      );
      return rows.map((row) => enrichIncident(row, people, areas));
    },
    async createIncident(payload, actorUser) {
      const [areas, people] = await Promise.all([fetchAreaRows(pool), fetchPeopleRows(pool)]);
      assertIncidentCreatePayload(payload, areas, people);
      const incidentRouting = resolveIncidentAssignment(payload, areas, people);

      const incident = {
        id: createId("incident"),
        status: "Em triagem",
        createdAt: new Date().toISOString(),
        ...payload,
        responsibleArea: incidentRouting.responsibleArea,
        assignedPersonId: incidentRouting.assignedPersonId,
        assignedTo: incidentRouting.assignedTo
      };

      await pool.query(
        `INSERT INTO incident_reports
         (id, title, category, classification, status, anonymity, reporter_label, responsible_area, assigned_person_id, assigned_to, created_at, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          incident.id,
          incident.title,
          incident.category,
          incident.classification,
          incident.status,
          incident.anonymity,
          incident.reporterLabel,
          incident.responsibleArea,
          incident.assignedPersonId,
          incident.assignedTo,
          incident.createdAt,
          incident.description
        ]
      );

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.incident,
        action: "created",
        entityType: "incident",
        entityId: incident.id,
        entityLabel: incident.title,
        actorUser,
        summary: `Relato registrado: ${incident.title}`,
        detail: buildIncidentAuditDetail({
          classification: incident.classification,
          responsibleArea: incident.responsibleArea,
          assignedTo: incident.assignedTo
        })
      });

      return enrichIncident(incident, people, areas);
    },
    async updateIncident(incidentId, payload, actorUser) {
      if (!canManageIncidentQueue(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar o caso.");
      }

      const [areas, people] = await Promise.all([fetchAreaRows(pool), fetchPeopleRows(pool)]);
      assertIncidentUpdatePayload(payload, areas, people);
      const incidentRouting = resolveIncidentAssignment(payload, areas, people);

      const [rows] = await pool.query(
        `SELECT id
         FROM incident_reports
         WHERE id = ?
         LIMIT 1`,
        [incidentId]
      );

      if (!rows[0]) {
        throw new Error("Caso de compliance nao encontrado.");
      }

      await pool.query(
        `UPDATE incident_reports
         SET classification = ?, status = ?, responsible_area = ?, assigned_person_id = ?, assigned_to = ?
         WHERE id = ?`,
        [
          payload.classification,
          payload.status,
          incidentRouting.responsibleArea,
          incidentRouting.assignedPersonId,
          incidentRouting.assignedTo,
          incidentId
        ]
      );

      const [updatedRows] = await pool.query(
        `SELECT id, title, category, classification, status, anonymity, reporter_label AS reporterLabel,
                responsible_area AS responsibleArea, assigned_person_id AS assignedPersonId,
                assigned_to AS assignedTo, created_at AS createdAt, description
         FROM incident_reports
         WHERE id = ?
         LIMIT 1`,
        [incidentId]
      );

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.incident,
        action: "updated",
        entityType: "incident",
        entityId: incidentId,
        entityLabel: updatedRows[0].title,
        actorUser,
        summary: `Caso atualizado: ${updatedRows[0].title}`,
        detail: buildIncidentAuditDetail({
          status: updatedRows[0].status,
          classification: updatedRows[0].classification,
          responsibleArea: updatedRows[0].responsibleArea,
          assignedTo: updatedRows[0].assignedTo
        })
      });

      return enrichIncident(updatedRows[0], people, areas);
    },
    async getEvaluationTemplate() {
      return buildTemplate(evaluationLibrary.templates.collaboration);
    },
    async getEvaluationLibrary() {
      return buildEvaluationLibraryPayload(customLibraryState.published);
    },
    async importCustomLibraryDraft(payload) {
      const draft = {
        id: createId("library_draft"),
        fileName: payload.fileName,
        createdAt: new Date().toISOString(),
        createdByUserId: payload.createdByUserId,
        errors: payload.errors,
        templates: payload.templates,
        summary: payload.summary
      };
      customLibraryState.drafts.unshift(draft);
      await saveCustomLibraryState(customLibraryState);
      return draft;
    },
      async publishCustomLibraryDraft(payload) {
        const draft = customLibraryState.drafts.find((item) => item.id === payload.draftId);
      if (!draft) {
        throw new Error("Rascunho da biblioteca nao encontrado.");
      }
      if (draft.errors.length) {
        throw new Error("Nao e possivel publicar uma biblioteca com erros.");
      }

      const published = {
        id: createId("library"),
        name: payload.name,
        description: payload.description || "",
        sourceFileName: draft.fileName,
        createdAt: new Date().toISOString(),
        createdByUserId: payload.createdByUserId,
        templateCount: draft.templates.length,
        questionCount: draft.summary.questions,
        templates: draft.templates
      };
      customLibraryState.published.unshift(published);
      customLibraryState.drafts = customLibraryState.drafts.filter(
        (item) => item.id !== payload.draftId
      );
        await saveCustomLibraryState(customLibraryState);
        return published;
      },
      async updateCustomLibrary(libraryId, payload) {
        const libraryIndex = customLibraryState.published.findIndex((item) => item.id === libraryId);
        if (libraryIndex < 0) {
          throw new Error("Biblioteca customizada nao encontrada.");
        }

        const updatedLibrary = preparePublishedCustomLibraryUpdate(
          customLibraryState.published[libraryIndex],
          payload
        );

        customLibraryState.published[libraryIndex] = updatedLibrary;
        await saveCustomLibraryState(customLibraryState);
        return updatedLibrary;
      },
      async getEvaluationTemplateForCycleRelationship(cycleId, relationshipType) {
      const [rows] = await pool.query(
        `SELECT id, template_id AS templateId, library_id AS libraryId, library_name AS libraryName
         FROM evaluation_cycles
         WHERE id = ?
         LIMIT 1`,
        [cycleId]
      );

      return buildTemplate(
        getTemplateDefinitionForCycle({
          cycle: presentCycle(rows[0] || {}),
          relationshipType,
          customLibraries: customLibraryState.published
        })
      );
    },
    async getEvaluationCycles(actorUser = null) {
      const [rows] = await pool.query(
        supportsCycleConfig
          ? `SELECT c.id, c.template_id AS templateId, c.title, c.semester_label AS semesterLabel,
                    c.status, c.is_enabled AS isEnabled, c.enabled_relationships_json AS enabledRelationshipsJson,
                    c.transversal_config_json AS transversalConfigJson,
                    c.due_date AS dueDate, c.target_group AS targetGroup,
                    c.library_id AS libraryId, c.library_name AS libraryName,
                    COALESCE(c.library_name, t.name) AS modelName, c.created_by_user_id AS createdByUserId,
                    COUNT(DISTINCT cp.person_id) AS participantCount,
                    COUNT(DISTINCT CONCAT(cr.participant_person_id, ':', cr.rater_user_id, ':', cr.relationship_type)) AS raterCount,
                    COUNT(DISTINCT er.id) AS reportSnapshotCount
             FROM evaluation_cycles c
             JOIN evaluation_templates t ON t.id = c.template_id
             LEFT JOIN evaluation_cycle_participants cp ON cp.cycle_id = c.id
             LEFT JOIN evaluation_cycle_raters cr ON cr.cycle_id = c.id
             LEFT JOIN evaluation_cycle_reports er ON er.cycle_id = c.id
             GROUP BY c.id, c.template_id, c.title, c.semester_label, c.status, c.is_enabled, c.enabled_relationships_json,
                      c.transversal_config_json,
                      c.due_date, c.target_group, c.library_id, c.library_name, t.name, c.created_by_user_id
             ORDER BY c.due_date DESC`
          : `SELECT c.id, c.template_id AS templateId, c.title, c.semester_label AS semesterLabel,
                    c.status, c.due_date AS dueDate, c.target_group AS targetGroup,
                    c.library_id AS libraryId, c.library_name AS libraryName,
                    COALESCE(c.library_name, t.name) AS modelName, c.created_by_user_id AS createdByUserId,
                    COUNT(DISTINCT cp.person_id) AS participantCount,
                    COUNT(DISTINCT CONCAT(cr.participant_person_id, ':', cr.rater_user_id, ':', cr.relationship_type)) AS raterCount,
                    COUNT(DISTINCT er.id) AS reportSnapshotCount
             FROM evaluation_cycles c
             JOIN evaluation_templates t ON t.id = c.template_id
             LEFT JOIN evaluation_cycle_participants cp ON cp.cycle_id = c.id
             LEFT JOIN evaluation_cycle_raters cr ON cr.cycle_id = c.id
             LEFT JOIN evaluation_cycle_reports er ON er.cycle_id = c.id
             GROUP BY c.id, c.template_id, c.title, c.semester_label, c.status, c.due_date, c.target_group,
                      c.library_id, c.library_name, t.name, c.created_by_user_id
             ORDER BY c.due_date DESC`
      );
      const cycles = rows.map((row) => ({
        ...presentCycle(row),
        supportsConfig: Boolean(supportsCycleConfig)
      }));

      if (actorUser && !isOrgWideUser(actorUser)) {
        return cycles.filter((cycle) => cycle.isEnabled);
      }

      return cycles;
    },
    async createEvaluationCycle(payload, actorUser) {
      const selectedLibrary =
        payload.libraryId && payload.libraryId !== DEFAULT_EVALUATION_LIBRARY_ID
          ? findPublishedLibrary(customLibraryState.published, payload.libraryId)
          : null;

      if (payload.libraryId && payload.libraryId !== DEFAULT_EVALUATION_LIBRARY_ID && !selectedLibrary) {
        throw new Error("Biblioteca selecionada nao foi encontrada.");
      }

      const cycle = prepareEvaluationCycle({
        payload,
        createId,
        questionTemplateId: questionTemplate.id,
        selectedLibrary
      });
      const users = await fetchUserRows(pool);
      const people = await fetchPeopleRows(pool);
      const existingPairings = supportsPairings
        ? await pool
            .query(
              `SELECT cycle_id AS cycleId, reviewer_user_id AS reviewerUserId, reviewee_person_id AS revieweePersonId, blocked_at AS blockedAt, relationship_type AS relationshipType
               FROM evaluation_pairings
               WHERE relationship_type = 'cross-functional'`
            )
            .then(([rows]) => rows)
        : [];
      const crossFunctionalPlan = buildCrossFunctionalPlan({
        users,
        people,
        cycleId: cycle.id,
        transversalConfig: cycle.transversalConfig,
        priorPairings: existingPairings
      });
      const generatedAssignments = generateAssignments({
        users,
        people,
        cycleId: cycle.id,
        dueDate: cycle.dueDate,
        crossFunctionalPlan
      });
      const generatedStructure = buildCycleParticipantsAndRaters({
        assignments: generatedAssignments,
        users,
        people,
        cycleId: cycle.id
      });

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        if (supportsCycleConfig) {
          await connection.query(
            `INSERT INTO evaluation_cycles
             (id, template_id, title, semester_label, status, is_enabled, enabled_relationships_json, transversal_config_json, due_date, target_group, created_by_user_id, library_id, library_name)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              cycle.id,
              cycle.templateId,
              cycle.title,
              cycle.semesterLabel,
              cycle.status,
              1,
              null,
              JSON.stringify(cycle.transversalConfig),
              cycle.dueDate,
              cycle.targetGroup,
              cycle.createdByUserId,
              cycle.libraryId,
              cycle.libraryName
            ]
          );
        } else {
          await connection.query(
            `INSERT INTO evaluation_cycles
             (id, template_id, title, semester_label, status, due_date, target_group, created_by_user_id, library_id, library_name)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              cycle.id,
              cycle.templateId,
              cycle.title,
              cycle.semesterLabel,
              cycle.status,
              cycle.dueDate,
              cycle.targetGroup,
              cycle.createdByUserId,
              cycle.libraryId,
              cycle.libraryName
            ]
          );
        }

        for (const assignment of generatedAssignments) {
          await connection.query(
            `INSERT INTO evaluation_assignments
             (id, cycle_id, reviewer_user_id, reviewee_person_id, relationship_type, project_context,
              collaboration_context, status, due_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              assignment.id,
              assignment.cycleId,
              assignment.reviewerUserId,
              assignment.revieweePersonId,
              assignment.relationshipType,
              assignment.projectContext,
              assignment.collaborationContext,
              assignment.status,
              assignment.dueDate
            ]
          );
        }

        if (supportsPairings) {
          for (const pairing of crossFunctionalPlan.pairings) {
            const record = createCrossFunctionalPairingRecord({
              pairing,
              cycleId: cycle.id,
              actorUser,
              createId,
              source: "automatic",
              reason: "Pareamento automatico balanceado",
              seed: cycle.id
            });
            await connection.query(
              `INSERT INTO evaluation_pairings
               (id, cycle_id, relationship_type, reviewer_user_id, reviewee_person_id, pairing_source, pairing_reason, seed, created_at, created_by_user_id, blocked_at, blocked_by_user_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                record.id,
                record.cycleId,
                record.relationshipType,
                record.reviewerUserId,
                record.revieweePersonId,
                record.pairingSource,
                record.pairingReason,
                record.seed,
                record.createdAt,
                record.createdByUserId,
                record.blockedAt,
                record.blockedByUserId
              ]
            );
          }
        }

        for (const participant of generatedStructure.participants) {
          await connection.query(
            `INSERT INTO evaluation_cycle_participants
             (id, cycle_id, person_id, status)
             VALUES (?, ?, ?, ?)`,
            [participant.id, participant.cycleId, participant.personId, participant.status]
          );
        }

        for (const rater of generatedStructure.raters) {
          await connection.query(
            `INSERT INTO evaluation_cycle_raters
             (id, cycle_id, participant_person_id, rater_user_id, relationship_type, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              rater.id,
              rater.cycleId,
              rater.participantPersonId,
              rater.raterUserId,
              rater.relationshipType,
              rater.status
            ]
          );
        }

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: "created",
          entityType: "cycle",
          entityId: cycle.id,
          entityLabel: cycle.title,
          actorUser,
          summary: `Ciclo criado: ${cycle.title}`,
          detail: buildCycleCreatedAuditDetail({
            semesterLabel: cycle.semesterLabel,
            assignmentCount: generatedAssignments.length
          })
        });

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      return {
        ...presentCycle(cycle),
        supportsConfig: Boolean(supportsCycleConfig),
        participantCount: generatedStructure.participants.length,
        raterCount: generatedStructure.raters.length,
        generatedAssignmentsCount: generatedAssignments.length
      };
    },
    async getEvaluationCycleParticipants(cycleId) {
      const [cycleRows] = await pool.query(
        `SELECT id, template_id AS templateId, title, semester_label AS semesterLabel,
                status, due_date AS dueDate, target_group AS targetGroup,
                is_enabled AS isEnabled, enabled_relationships_json AS enabledRelationshipsJson,
                transversal_config_json AS transversalConfigJson,
                library_id AS libraryId, library_name AS libraryName
         FROM evaluation_cycles
         WHERE id = ?
         LIMIT 1`,
        [cycleId]
      );

      if (!cycleRows[0]) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const [allCycleRows, people, users, participantRows, raterRows, assignmentRows, pairingRows, allPairingRows, pairingExceptionRows] = await Promise.all([
        pool.query(
          `SELECT id, template_id AS templateId, title, semester_label AS semesterLabel,
                  status, due_date AS dueDate, target_group AS targetGroup,
                  is_enabled AS isEnabled, enabled_relationships_json AS enabledRelationshipsJson,
                  transversal_config_json AS transversalConfigJson,
                  library_id AS libraryId, library_name AS libraryName
           FROM evaluation_cycles`
        ).then(([rows]) => rows),
        fetchPeopleRows(pool),
        fetchUserRows(pool),
        fetchCycleParticipantRows(pool, cycleId),
        fetchCycleRaterRows(pool, cycleId),
        fetchCycleAssignmentRows(pool, cycleId, { supportsAssignmentReminder }),
        supportsPairings ? fetchCyclePairingRows(pool, cycleId) : Promise.resolve([]),
        supportsPairings ? fetchCyclePairingRows(pool) : Promise.resolve([]),
        supportsPairings ? fetchCyclePairingExceptionRows(pool, cycleId) : Promise.resolve([])
      ]);

      return presentCycleParticipantStructure(
        {
          cycles: allCycleRows,
          people,
          users,
          assignments: assignmentRows,
          cycleParticipants: participantRows,
          cycleRaters: raterRows,
          evaluationPairings: pairingRows,
          evaluationPairingExceptions: pairingExceptionRows,
          allPairings: allPairingRows
        },
        cycleId,
        customLibraryState.published
      );
    },
    async blockCrossFunctionalPairing(cycleId, pairingId, reason, actorUser) {
      if (!supportsPairings) {
        throw new Error("Este ambiente ainda nao suporta governanca de pareamentos.");
      }
      const normalizedReason = String(reason || "").trim();
      if (!normalizedReason) {
        throw new Error("Informe a justificativa da excecao.");
      }

      const [pairingRows] = await pool.query(
        `SELECT id, reviewer_user_id AS reviewerUserId, reviewee_person_id AS revieweePersonId, blocked_at AS blockedAt
         FROM evaluation_pairings
         WHERE id = ? AND cycle_id = ? AND relationship_type = 'cross-functional'
         LIMIT 1`,
        [pairingId, cycleId]
      );
      const pairing = pairingRows[0];
      if (!pairing || pairing.blockedAt) {
        throw new Error("Pareamento transversal nao encontrado.");
      }

      const [assignmentRows] = await pool.query(
        `SELECT id, status
         FROM evaluation_assignments
         WHERE cycle_id = ? AND reviewer_user_id = ? AND reviewee_person_id = ? AND relationship_type = 'cross-functional'
         LIMIT 1`,
        [cycleId, pairing.reviewerUserId, pairing.revieweePersonId]
      );
      if (assignmentRows[0]?.status === "submitted") {
        throw new Error("Nao e possivel bloquear um pareamento ja respondido.");
      }

      const [cycleRows] = await pool.query(
        `SELECT id, title FROM evaluation_cycles WHERE id = ? LIMIT 1`,
        [cycleId]
      );
      if (!cycleRows[0]) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `UPDATE evaluation_pairings
           SET blocked_at = ?, blocked_by_user_id = ?
           WHERE id = ?`,
          [new Date().toISOString(), actorUser.id, pairingId]
        );
        await connection.query(
          `DELETE FROM evaluation_assignments
           WHERE cycle_id = ? AND reviewer_user_id = ? AND reviewee_person_id = ? AND relationship_type = 'cross-functional'`,
          [cycleId, pairing.reviewerUserId, pairing.revieweePersonId]
        );
        const exceptionRecord = createPairingExceptionRecord({
          cycleId,
          pairingId,
          reviewerUserId: pairing.reviewerUserId,
          previousRevieweePersonId: pairing.revieweePersonId,
          nextRevieweePersonId: null,
          actionType: "blocked",
          reason: normalizedReason,
          actorUser,
          createId
        });
        await connection.query(
          `INSERT INTO evaluation_pairing_exceptions
           (id, cycle_id, pairing_id, action_type, reviewer_user_id, previous_reviewee_person_id, next_reviewee_person_id, reason, actor_user_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            exceptionRecord.id,
            exceptionRecord.cycleId,
            exceptionRecord.pairingId,
            exceptionRecord.actionType,
            exceptionRecord.reviewerUserId,
            exceptionRecord.previousRevieweePersonId,
            exceptionRecord.nextRevieweePersonId,
            exceptionRecord.reason,
            exceptionRecord.actorUserId,
            exceptionRecord.createdAt
          ]
        );

        const [users, people, assignments] = await Promise.all([
          fetchUserRows(connection),
          fetchPeopleRows(connection),
          fetchCycleAssignmentRows(connection, cycleId, { supportsAssignmentReminder })
        ]);
        const generatedStructure = buildCycleParticipantsAndRaters({
          assignments,
          users,
          people,
          cycleId
        });
        await connection.query(`DELETE FROM evaluation_cycle_raters WHERE cycle_id = ?`, [cycleId]);
        await connection.query(`DELETE FROM evaluation_cycle_participants WHERE cycle_id = ?`, [cycleId]);
        for (const participant of generatedStructure.participants) {
          await connection.query(
            `INSERT INTO evaluation_cycle_participants (id, cycle_id, person_id, status) VALUES (?, ?, ?, ?)`,
            [participant.id, participant.cycleId, participant.personId, participant.status]
          );
        }
        for (const rater of generatedStructure.raters) {
          await connection.query(
            `INSERT INTO evaluation_cycle_raters (id, cycle_id, participant_person_id, rater_user_id, relationship_type, status) VALUES (?, ?, ?, ?, ?, ?)`,
            [rater.id, rater.cycleId, rater.participantPersonId, rater.raterUserId, rater.relationshipType, rater.status]
          );
        }
        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: "pairing_blocked",
          entityType: "cycle",
          entityId: cycleId,
          entityLabel: cycleRows[0].title,
          actorUser,
          summary: "Pareamento transversal bloqueado",
          detail: normalizedReason
        });
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      return this.getEvaluationCycleParticipants(cycleId);
    },
    async forceCrossFunctionalPairing(cycleId, payload, actorUser) {
      if (!supportsPairings) {
        throw new Error("Este ambiente ainda nao suporta governanca de pareamentos.");
      }
      const normalizedReason = String(payload?.reason || "").trim();
      if (!normalizedReason) {
        throw new Error("Informe a justificativa da excecao.");
      }

      const [users, people, cycleRows] = await Promise.all([
        fetchUserRows(pool),
        fetchPeopleRows(pool),
        pool.query(`SELECT id, title, due_date AS dueDate FROM evaluation_cycles WHERE id = ? LIMIT 1`, [cycleId]).then(([rows]) => rows)
      ]);
      const cycle = cycleRows[0];
      if (!cycle) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }
      const reviewer = users.find((item) => item.id === payload?.reviewerUserId && item.status === "active");
      const reviewerPerson = reviewer ? people.find((item) => item.id === reviewer.personId) : null;
      const reviewee = people.find((item) => item.id === payload?.revieweePersonId);
      if (!reviewer || !reviewerPerson || !reviewee) {
        throw new Error("Revisor ou avaliado nao encontrado.");
      }
      if (!isCrossFunctionalCandidate({ id: reviewer.id, person: reviewerPerson }, { id: reviewee.id, person: reviewee })) {
        throw new Error("O pareamento informado nao atende as regras do Feedback transversal.");
      }

      const [previousPairingRows] = await pool.query(
        `SELECT id, reviewee_person_id AS revieweePersonId
         FROM evaluation_pairings
         WHERE cycle_id = ? AND reviewer_user_id = ? AND reviewee_person_id = ? AND relationship_type = 'cross-functional' AND blocked_at IS NULL
         LIMIT 1`,
        [cycleId, reviewer.id, reviewee.id]
      );
      const [previousAssignmentRows] = await pool.query(
        `SELECT id, status
         FROM evaluation_assignments
         WHERE cycle_id = ? AND reviewer_user_id = ? AND reviewee_person_id = ? AND relationship_type = 'cross-functional'
         LIMIT 1`,
        [cycleId, reviewer.id, reviewee.id]
      );
      if (previousPairingRows[0]) {
        throw new Error("Esse pareamento transversal ja esta ativo no ciclo.");
      }
      if (previousAssignmentRows[0]?.status === "submitted") {
        throw new Error("Nao e possivel alterar um pareamento ja respondido.");
      }

      const newPairing = createCrossFunctionalPairingRecord({
        pairing: { reviewerUserId: reviewer.id, revieweePersonId: reviewee.id },
        cycleId,
        actorUser,
        createId,
        source: "manual",
        reason: normalizedReason,
        seed: cycleId
      });
      const exceptionRecord = createPairingExceptionRecord({
        cycleId,
        pairingId: newPairing.id,
        reviewerUserId: reviewer.id,
        previousRevieweePersonId: null,
        nextRevieweePersonId: reviewee.id,
        actionType: "forced",
        reason: normalizedReason,
        actorUser,
        createId
      });

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `INSERT INTO evaluation_pairings
           (id, cycle_id, relationship_type, reviewer_user_id, reviewee_person_id, pairing_source, pairing_reason, seed, created_at, created_by_user_id, blocked_at, blocked_by_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newPairing.id,
            newPairing.cycleId,
            newPairing.relationshipType,
            newPairing.reviewerUserId,
            newPairing.revieweePersonId,
            newPairing.pairingSource,
            newPairing.pairingReason,
            newPairing.seed,
            newPairing.createdAt,
            newPairing.createdByUserId,
            newPairing.blockedAt,
            newPairing.blockedByUserId
          ]
        );
        await connection.query(
          `INSERT INTO evaluation_pairing_exceptions
           (id, cycle_id, pairing_id, action_type, reviewer_user_id, previous_reviewee_person_id, next_reviewee_person_id, reason, actor_user_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            exceptionRecord.id,
            exceptionRecord.cycleId,
            exceptionRecord.pairingId,
            exceptionRecord.actionType,
            exceptionRecord.reviewerUserId,
            exceptionRecord.previousRevieweePersonId,
            exceptionRecord.nextRevieweePersonId,
            exceptionRecord.reason,
            exceptionRecord.actorUserId,
            exceptionRecord.createdAt
          ]
        );
        await connection.query(
          `INSERT INTO evaluation_assignments
           (id, cycle_id, reviewer_user_id, reviewee_person_id, relationship_type, project_context, collaboration_context, status, due_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            createId("assignment"),
            cycleId,
            reviewer.id,
            reviewee.id,
            "cross-functional",
            "Colaboracao transversal entre areas",
            "Feedback transversal gerado automaticamente para colaboracao entre areas da mesma unidade.",
            "pending",
            cycle.dueDate
          ]
        );
        const refreshedAssignments = await fetchCycleAssignmentRows(connection, cycleId, { supportsAssignmentReminder });
        const generatedStructure = buildCycleParticipantsAndRaters({
          assignments: refreshedAssignments,
          users,
          people,
          cycleId
        });
        await connection.query(`DELETE FROM evaluation_cycle_raters WHERE cycle_id = ?`, [cycleId]);
        await connection.query(`DELETE FROM evaluation_cycle_participants WHERE cycle_id = ?`, [cycleId]);
        for (const participant of generatedStructure.participants) {
          await connection.query(
            `INSERT INTO evaluation_cycle_participants (id, cycle_id, person_id, status) VALUES (?, ?, ?, ?)`,
            [participant.id, participant.cycleId, participant.personId, participant.status]
          );
        }
        for (const rater of generatedStructure.raters) {
          await connection.query(
            `INSERT INTO evaluation_cycle_raters (id, cycle_id, participant_person_id, rater_user_id, relationship_type, status) VALUES (?, ?, ?, ?, ?, ?)`,
            [rater.id, rater.cycleId, rater.participantPersonId, rater.raterUserId, rater.relationshipType, rater.status]
          );
        }
        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: "pairing_forced",
          entityType: "cycle",
          entityId: cycleId,
          entityLabel: cycle.title,
          actorUser,
          summary: "Pareamento transversal ajustado",
          detail: normalizedReason
        });
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      return this.getEvaluationCycleParticipants(cycleId);
    },
    async notifyCycleDelinquents(cycleId, actorUser) {
      const [cycleRows] = await pool.query(
        `SELECT id, title, status
         FROM evaluation_cycles
         WHERE id = ?
         LIMIT 1`,
        [cycleId]
      );
      if (!cycleRows[0]) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const assignments = await fetchCycleAssignmentRows(pool, cycleId, {
        supportsAssignmentReminder
      });
      const delinquentAssignments = assignments.filter((assignment) =>
        isAssignmentDelinquent(assignment, cycleRows[0].status)
      );

      if (!delinquentAssignments.length) {
        return {
          cycleId,
          notifiedAssignments: 0,
          delinquentAssignments: []
        };
      }

      const reminderSentAt = new Date().toISOString();
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        for (const assignment of delinquentAssignments) {
          if (supportsAssignmentReminder) {
            await connection.query(
              `UPDATE evaluation_assignments
               SET reminder_count = COALESCE(reminder_count, 0) + 1,
                   last_reminder_sent_at = ?
               WHERE id = ?`,
              [reminderSentAt, assignment.id]
            );
          }
        }

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: "delinquent_reminder_sent",
          entityType: "evaluation_cycle",
          entityId: cycleRows[0].id,
          entityLabel: cycleRows[0].title,
          actorUser,
          summary: `Lembrete enviado para inadimplentes: ${cycleRows[0].title}`,
          detail: buildCycleReminderAuditDetail(delinquentAssignments.length)
        });

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const [people, users] = await Promise.all([fetchPeopleRows(pool), fetchUserRows(pool)]);
      const refreshedAssignments = await fetchCycleAssignmentRows(pool, cycleId, {
        supportsAssignmentReminder
      });

      return {
        cycleId,
        notifiedAssignments: delinquentAssignments.length,
        delinquentAssignments: refreshedAssignments
          .filter((assignment) => isAssignmentDelinquent(assignment, cycleRows[0].status))
          .map((assignment) =>
            presentDelinquentAssignment(
              assignment,
              { people, users },
              cycleRows[0].status
            )
          )
      };
    },
    async updateEvaluationCycleStatus(cycleId, nextStatus, actorUser) {
      const [rows] = await pool.query(
        `SELECT id, status
         FROM evaluation_cycles
         WHERE id = ?
         LIMIT 1`,
        [cycleId]
      );

      if (!rows[0]) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const previousStatus = rows[0].status;
      assertCycleStatusTransition(rows[0].status, nextStatus);

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query(
          `UPDATE evaluation_cycles
           SET status = ?
           WHERE id = ?`,
          [nextStatus, cycleId]
        );

        if (nextStatus === CYCLE_STATUS.processed) {
          const responses = [
            ...(await fetchMysqlResponses(pool, customLibraryState.published, {
              supportsFeedbackAcknowledgement
            })).filter((response) => response.cycleId === cycleId),
            ...anonymousResponseState.responses.filter((response) => response.cycleId === cycleId)
          ];
          const snapshots = buildCycleReportSnapshots(cycleId, responses);

          await connection.query(`DELETE FROM evaluation_cycle_reports WHERE cycle_id = ?`, [
            cycleId
          ]);

          for (const snapshot of snapshots) {
            await connection.query(
              `INSERT INTO evaluation_cycle_reports
               (id, cycle_id, relationship_type, total_responses, average_score, question_averages_json, generated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                snapshot.id,
                snapshot.cycleId,
                snapshot.relationshipType,
                snapshot.totalResponses,
                snapshot.averageScore,
                JSON.stringify(snapshot.questionAverages),
                snapshot.generatedAt
              ]
            );
          }
        }

        const [updatedRows] = await connection.query(
          `SELECT c.id, c.template_id AS templateId, c.title, c.semester_label AS semesterLabel,
                  c.status, c.due_date AS dueDate, c.target_group AS targetGroup,
                  c.library_id AS libraryId, c.library_name AS libraryName,
                  COALESCE(c.library_name, t.name) AS modelName, c.created_by_user_id AS createdByUserId,
                  COUNT(DISTINCT er.id) AS reportSnapshotCount
           FROM evaluation_cycles c
           JOIN evaluation_templates t ON t.id = c.template_id
           LEFT JOIN evaluation_cycle_reports er ON er.cycle_id = c.id
           WHERE c.id = ?
           GROUP BY c.id, c.template_id, c.title, c.semester_label, c.status, c.due_date, c.target_group,
                    c.library_id, c.library_name, t.name, c.created_by_user_id`,
          [cycleId]
        );

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: nextStatus === CYCLE_STATUS.processed ? "processed" : "status_changed",
          entityType: "cycle",
          entityId: cycleId,
          entityLabel: updatedRows[0].title,
          actorUser,
          summary:
            nextStatus === CYCLE_STATUS.processed
              ? `Ciclo processado: ${updatedRows[0].title}`
              : `Status do ciclo atualizado: ${updatedRows[0].title}`,
          detail: buildCycleStatusAuditDetail(previousStatus, nextStatus)
        });

        await connection.commit();
        return presentCycle(updatedRows[0]);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async updateEvaluationCycleConfig(cycleId, payload, actorUser) {
      if (!["admin", "hr"].includes(actorUser?.roleKey || "")) {
        throw new Error("Perfil sem permissao para configurar ciclos.");
      }

      const [rows] = await pool.query(
        `SELECT id, title, is_enabled AS isEnabled, enabled_relationships_json AS enabledRelationshipsJson, transversal_config_json AS transversalConfigJson
         FROM evaluation_cycles
         WHERE id = ?
         LIMIT 1`,
        [cycleId]
      );

      if (!rows[0]) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const current = presentCycle(rows[0]);
      const cycleConfigUpdate = resolveCycleConfigUpdate(
        normalizeCycleModuleAvailability(current.moduleAvailability),
        normalizeTransversalConfig(current.transversalConfig),
        payload
      );
      const nextIsEnabled =
        cycleConfigUpdate.nextIsEnabled === undefined
          ? current.isEnabled
          : cycleConfigUpdate.nextIsEnabled;
      const nextModuleAvailability =
        cycleConfigUpdate.nextModuleAvailability ||
        normalizeCycleModuleAvailability(current.moduleAvailability);
      const nextTransversalConfig =
        cycleConfigUpdate.nextTransversalConfig ||
        normalizeTransversalConfig(current.transversalConfig);

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query(
          `UPDATE evaluation_cycles
           SET is_enabled = ?, enabled_relationships_json = ?, transversal_config_json = ?
           WHERE id = ?`,
          [
            nextIsEnabled ? 1 : 0,
            JSON.stringify(nextModuleAvailability),
            JSON.stringify(nextTransversalConfig),
            cycleId
          ]
        );

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: "config_changed",
          entityType: "cycle",
          entityId: cycleId,
          entityLabel: rows[0].title,
          actorUser,
          summary: `Configuracao do ciclo atualizada: ${rows[0].title}`,
          detail: buildCycleConfigAuditDetail(nextIsEnabled)
        });

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const [updatedRows] = await pool.query(
        `SELECT c.id, c.template_id AS templateId, c.title, c.semester_label AS semesterLabel,
                c.status, c.is_enabled AS isEnabled, c.enabled_relationships_json AS enabledRelationshipsJson,
                c.transversal_config_json AS transversalConfigJson,
                c.due_date AS dueDate, c.target_group AS targetGroup,
                c.library_id AS libraryId, c.library_name AS libraryName,
                COALESCE(c.library_name, t.name) AS modelName, c.created_by_user_id AS createdByUserId
         FROM evaluation_cycles c
         JOIN evaluation_templates t ON t.id = c.template_id
         WHERE c.id = ?
         LIMIT 1`,
        [cycleId]
      );

      return updatedRows[0]
        ? { ...presentCycle(updatedRows[0]), supportsConfig: true }
        : { ...presentCycle(rows[0]), supportsConfig: true };
    },
    async getEvaluationAssignmentsForUser(userId) {
      const [rows] = await pool.query(
        supportsCycleConfig
          ? `SELECT a.id, a.cycle_id AS cycleId, a.reviewer_user_id AS reviewerUserId,
                    a.reviewee_person_id AS revieweePersonId, a.relationship_type AS relationshipType,
                    a.project_context AS projectContext, a.collaboration_context AS collaborationContext,
                    a.status, a.due_date AS dueDate, c.title AS cycleTitle, c.semester_label AS semesterLabel,
                    c.template_id AS templateId, c.status AS cycleStatus, c.is_enabled AS isEnabled, c.enabled_relationships_json AS enabledRelationshipsJson, c.transversal_config_json AS transversalConfigJson,
                    c.library_id AS libraryId, c.library_name AS libraryName,
                    p.name AS revieweeName, p.area AS revieweeArea,
                    reviewer_person.name AS reviewerName, s.overall_score AS overallScore,
                    s.submitted_at AS submittedAt
             FROM evaluation_assignments a
             JOIN evaluation_cycles c ON c.id = a.cycle_id
             JOIN people p ON p.id = a.reviewee_person_id
             JOIN users reviewer_user ON reviewer_user.id = a.reviewer_user_id
             JOIN people reviewer_person ON reviewer_person.id = reviewer_user.person_id
             LEFT JOIN evaluation_submissions s ON s.assignment_id = a.id
             WHERE a.reviewer_user_id = ?
             ORDER BY a.due_date ASC`
          : `SELECT a.id, a.cycle_id AS cycleId, a.reviewer_user_id AS reviewerUserId,
                    a.reviewee_person_id AS revieweePersonId, a.relationship_type AS relationshipType,
                    a.project_context AS projectContext, a.collaboration_context AS collaborationContext,
                    a.status, a.due_date AS dueDate, c.title AS cycleTitle, c.semester_label AS semesterLabel,
                    c.template_id AS templateId, c.status AS cycleStatus,
                    c.library_id AS libraryId, c.library_name AS libraryName,
                    p.name AS revieweeName, p.area AS revieweeArea,
                    reviewer_person.name AS reviewerName, s.overall_score AS overallScore,
                    s.submitted_at AS submittedAt
             FROM evaluation_assignments a
             JOIN evaluation_cycles c ON c.id = a.cycle_id
             JOIN people p ON p.id = a.reviewee_person_id
             JOIN users reviewer_user ON reviewer_user.id = a.reviewer_user_id
             JOIN people reviewer_person ON reviewer_person.id = reviewer_user.person_id
             LEFT JOIN evaluation_submissions s ON s.assignment_id = a.id
             WHERE a.reviewer_user_id = ?
             ORDER BY a.due_date ASC`,
        [userId]
      );
      return rows
        .map((row) => presentAssignment(row, customLibraryState.published))
        .filter((assignment) => isCycleRelationshipEnabled(assignment, assignment.relationshipType));
    },
    async getEvaluationAssignmentById(assignmentId, userId) {
      const [rows] = await pool.query(
        supportsCycleConfig
          ? `SELECT a.id, a.cycle_id AS cycleId, a.reviewer_user_id AS reviewerUserId,
                    a.reviewee_person_id AS revieweePersonId, a.relationship_type AS relationshipType,
                    a.project_context AS projectContext, a.collaboration_context AS collaborationContext,
                    a.status, a.due_date AS dueDate, c.title AS cycleTitle, c.semester_label AS semesterLabel,
                    c.template_id AS templateId, c.status AS cycleStatus, c.is_enabled AS isEnabled, c.enabled_relationships_json AS enabledRelationshipsJson, c.transversal_config_json AS transversalConfigJson,
                    c.library_id AS libraryId, c.library_name AS libraryName,
                    p.name AS revieweeName, p.area AS revieweeArea
             FROM evaluation_assignments a
             JOIN evaluation_cycles c ON c.id = a.cycle_id
             JOIN people p ON p.id = a.reviewee_person_id
             WHERE a.id = ? AND a.reviewer_user_id = ?
             LIMIT 1`
          : `SELECT a.id, a.cycle_id AS cycleId, a.reviewer_user_id AS reviewerUserId,
                    a.reviewee_person_id AS revieweePersonId, a.relationship_type AS relationshipType,
                    a.project_context AS projectContext, a.collaboration_context AS collaborationContext,
                    a.status, a.due_date AS dueDate, c.title AS cycleTitle, c.semester_label AS semesterLabel,
                    c.template_id AS templateId, c.status AS cycleStatus,
                    c.library_id AS libraryId, c.library_name AS libraryName,
                    p.name AS revieweeName, p.area AS revieweeArea
             FROM evaluation_assignments a
             JOIN evaluation_cycles c ON c.id = a.cycle_id
             JOIN people p ON p.id = a.reviewee_person_id
             WHERE a.id = ? AND a.reviewer_user_id = ?
             LIMIT 1`,
        [assignmentId, userId]
      );
      const assignment = rows[0] ? presentAssignment(rows[0], customLibraryState.published) : null;
      if (!assignment) {
        return null;
      }
      if (!isCycleRelationshipEnabled(assignment, assignment.relationshipType)) {
        return null;
      }
      return assignment;
    },
    async getEvaluationResponses(actorUser) {
      const submissions = await fetchMysqlResponses(pool, customLibraryState.published, {
        supportsFeedbackAcknowledgement
      });
      const [cycles, cycleReports] = await Promise.all([
        this.getEvaluationCycles(),
        fetchCycleReportRows(pool)
      ]);
      return buildEvaluationResponseBundle({
        submissions,
        anonymousResponses: anonymousResponseState.responses,
        buildSubmission: (item) => item,
        actorUser,
        buildResponsesBundle,
        cycles,
        cycleReports
      });
    },
    async getReceivedManagerFeedback(actorUser) {
      const submissions = await fetchMysqlResponses(pool, customLibraryState.published, {
        supportsFeedbackAcknowledgement
      });
      return filterReceivedManagerFeedback({
        submissions,
        actorUser,
        buildSubmission: (item) => item
      });
    },
    async getFeedbackRequests(actorUser) {
      const [requestRows] = await pool.query(
        `SELECT r.id, r.cycle_id AS cycleId, r.requester_user_id AS requesterUserId,
                r.reviewee_person_id AS revieweePersonId, r.status, r.context_note AS contextNote,
                r.requested_at AS requestedAt, r.decided_at AS decidedAt,
                r.decided_by_user_id AS decidedByUserId,
                c.title AS cycleTitle, c.semester_label AS semesterLabel, c.status AS cycleStatus,
                requester_person.name AS requesterName, reviewee.name AS revieweeName,
                decided_person.name AS decidedByName
         FROM evaluation_feedback_requests r
         JOIN evaluation_cycles c ON c.id = r.cycle_id
         JOIN users requester_user ON requester_user.id = r.requester_user_id
         JOIN people requester_person ON requester_person.id = requester_user.person_id
         JOIN people reviewee ON reviewee.id = r.reviewee_person_id
         LEFT JOIN users decided_user ON decided_user.id = r.decided_by_user_id
         LEFT JOIN people decided_person ON decided_person.id = decided_user.person_id
         ORDER BY r.requested_at DESC`
      );
      const [itemRows] = await pool.query(
        `SELECT i.id, i.request_id AS requestId, i.provider_person_id AS providerPersonId,
                i.assignment_id AS assignmentId, p.name AS providerName
         FROM evaluation_feedback_request_items i
         JOIN people p ON p.id = i.provider_person_id
         ORDER BY p.name`
      );

      const requests = requestRows.map((row) => ({
        ...row,
        providers: itemRows.filter((item) => item.requestId === row.id)
      }));

      if (isOrgWideUser(actorUser)) {
        return requests;
      }

      if (isManagerUser(actorUser)) {
        const people = await fetchPeopleRows(pool);
        return requests.filter((item) => {
          const reviewee = people.find((person) => person.id === item.revieweePersonId);
          return (
            item.requesterUserId === actorUser.id ||
            item.revieweePersonId === actorUser.person.id ||
            reviewee?.managerPersonId === actorUser.person.id
          );
        });
      }

      return requests.filter((item) => item.requesterUserId === actorUser.id);
    },
    async createFeedbackRequest(payload, actorUser) {
      const people = await fetchPeopleRows(pool);
      const users = await fetchUserRows(pool);
      const dbSnapshot = {
        people,
        users,
        cycles: await this.getEvaluationCycles(),
        assignments: await pool
          .query(
            `SELECT id, cycle_id AS cycleId, reviewer_user_id AS reviewerUserId,
                    reviewee_person_id AS revieweePersonId, relationship_type AS relationshipType
             FROM evaluation_assignments`
          )
          .then(([rows]) => rows)
      };
      const providerPersonIds = assertCanCreateFeedbackRequest(dbSnapshot, actorUser, payload);

      const request = prepareFeedbackRequest({
        payload,
        actorUser,
        createId,
        requestedAt: new Date().toISOString()
      });

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `INSERT INTO evaluation_feedback_requests
           (id, cycle_id, requester_user_id, reviewee_person_id, status, context_note, requested_at, decided_at, decided_by_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
          [
            request.id,
            request.cycleId,
            request.requesterUserId,
            request.revieweePersonId,
            request.status,
            request.contextNote,
            request.requestedAt
          ]
        );

        for (const item of buildFeedbackRequestItems({
          providerPersonIds,
          requestId: request.id,
          createId
        })) {
          await connection.query(
            `INSERT INTO evaluation_feedback_request_items
             (id, request_id, provider_person_id, assignment_id)
             VALUES (?, ?, ?, NULL)`,
            [item.id, item.requestId, item.providerPersonId]
          );
        }

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.feedbackRequest,
          action: "created",
          entityType: "feedback_request",
          entityId: request.id,
          entityLabel: actorUser.person?.name || actorUser.email,
          actorUser,
          summary: "Solicitacao de feedback direto registrada",
          detail: buildFeedbackRequestCreateAuditDetail(providerPersonIds, request.cycleId)
        });

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const requests = await this.getFeedbackRequests(actorUser);
      return requests.find((item) => item.id === request.id);
    },
    async reviewFeedbackRequest(requestId, payload, actorUser) {
      if (!["admin", "hr"].includes(actorUser.roleKey)) {
        throw new Error("Perfil sem permissao para aprovar solicitacoes de feedback.");
      }

      assertValidFeedbackRequestStatus(payload.status);

      const [requestRows] = await pool.query(
        `SELECT r.id, r.cycle_id AS cycleId, r.requester_user_id AS requesterUserId,
                r.reviewee_person_id AS revieweePersonId, r.status, r.context_note AS contextNote,
                c.due_date AS dueDate
         FROM evaluation_feedback_requests r
         JOIN evaluation_cycles c ON c.id = r.cycle_id
         WHERE r.id = ?
         LIMIT 1`,
        [requestId]
      );
      if (!requestRows[0]) {
        throw new Error("Solicitacao de feedback nao encontrada.");
      }
      if (requestRows[0].status !== FEEDBACK_REQUEST_STATUS.pending) {
        throw new Error("A solicitacao ja foi tratada.");
      }

      const [itemRows] = await pool.query(
        `SELECT i.id, i.provider_person_id AS providerPersonId
         FROM evaluation_feedback_request_items i
         WHERE i.request_id = ?`,
        [requestId]
      );

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `UPDATE evaluation_feedback_requests
           SET status = ?, decided_at = ?, decided_by_user_id = ?
           WHERE id = ?`,
          [payload.status, new Date().toISOString(), actorUser.id, requestId]
        );

        if (payload.status === FEEDBACK_REQUEST_STATUS.approved) {
          if (supportsCycleConfig) {
            const [cycleConfigRows] = await connection.query(
              `SELECT is_enabled AS isEnabled, enabled_relationships_json AS enabledRelationshipsJson, transversal_config_json AS transversalConfigJson
               FROM evaluation_cycles
               WHERE id = ?
               LIMIT 1`,
              [requestRows[0].cycleId]
            );
            if (!cycleConfigRows[0]) {
              throw new Error("Ciclo de avaliacao nao encontrado.");
            }
            if (!isCycleRelationshipEnabled(cycleConfigRows[0], "peer")) {
              throw new Error("Feedback direto esta desativado neste ciclo.");
            }
          }

          const users = await fetchUserRows(pool);
          for (const item of itemRows) {
            const reviewerUser = users.find(
              (user) => user.personId === item.providerPersonId && user.status === "active"
            );
            if (!reviewerUser) {
              continue;
            }

            const assignmentId = createId("assignment");
            await connection.query(
              `INSERT INTO evaluation_assignments
               (id, cycle_id, reviewer_user_id, reviewee_person_id, relationship_type, project_context,
                collaboration_context, status, due_date)
               VALUES (?, ?, ?, ?, 'peer', ?, ?, 'pending', ?)`,
              [
                assignmentId,
                requestRows[0].cycleId,
                reviewerUser.id,
                requestRows[0].revieweePersonId,
                "Feedback direto solicitado",
                requestRows[0].contextNote,
                requestRows[0].dueDate
              ]
            );
            await connection.query(
              `UPDATE evaluation_feedback_request_items
               SET assignment_id = ?
               WHERE id = ?`,
              [assignmentId, item.id]
            );
          }
        }

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.feedbackRequest,
          action: payload.status === FEEDBACK_REQUEST_STATUS.approved ? "approved" : "rejected",
          entityType: "feedback_request",
          entityId: requestId,
          entityLabel: requestRows[0].revieweePersonId,
          actorUser,
          summary:
            payload.status === FEEDBACK_REQUEST_STATUS.approved
              ? "Solicitacao de feedback aprovada"
              : "Solicitacao de feedback rejeitada",
          detail: buildFeedbackRequestReviewAuditDetail(requestRows[0])
        });

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const requests = await this.getFeedbackRequests(actorUser);
      return requests.find((item) => item.id === requestId);
    },
    async submitEvaluationAssignment(payload) {
      const assignment = await this.getEvaluationAssignmentById(
        payload.assignmentId,
        payload.reviewerUserId
      );
      if (!assignment) {
        throw new Error("Assignment de avaliacao nao encontrado.");
      }
      if (assignment.status === "submitted") {
        throw new Error("Esta avaliacao ja foi enviada.");
      }
      if (!isReleasedCycle(assignment.cycleStatus)) {
        throw new Error("As avaliacoes deste ciclo ainda nao foram liberadas pelo RH.");
      }
      if (!isCycleRelationshipEnabled(assignment, assignment.relationshipType)) {
        throw new Error("Este questionario nao esta ativo neste ciclo.");
      }

      const templateDefinition = getTemplateDefinitionForCycle({
        cycle: assignment,
        relationshipType: assignment.relationshipType,
        customLibraries: customLibraryState.published
      });
      validateEvaluationAnswers(payload.answers, templateDefinition);

      if (isAnonymousRelationship(assignment.relationshipType)) {
        const anonymousSubmission = createAnonymousSubmissionPayload(
          assignment,
          payload,
          templateDefinition
        );
        anonymousResponseState.responses.unshift(anonymousSubmission);
        await saveAnonymousResponseState(anonymousResponseState);
        await pool.query(
          `UPDATE evaluation_assignments SET status = 'submitted' WHERE id = ?`,
          [assignment.id]
        );
        await pool.query(
          `UPDATE evaluation_cycle_raters
           SET status = 'completed'
           WHERE cycle_id = ? AND participant_person_id = ? AND rater_user_id = ? AND relationship_type = ?`,
          [
            assignment.cycleId,
            assignment.revieweePersonId,
            assignment.reviewerUserId,
            assignment.relationshipType
          ]
        );
        if (
          assignment.relationshipType === "company" &&
          Number.isFinite(Number(anonymousSubmission.overallScore))
        ) {
          await pool.query(
            `UPDATE people
             SET satisfaction_score = ?
             WHERE id = ?`,
            [Number(Number(anonymousSubmission.overallScore).toFixed(2)), assignment.revieweePersonId]
          );
        }
        return anonymousSubmission;
      }

      const submission = prepareEvaluationSubmission({
        assignment,
        payload,
        createId,
        getAnsweredScaleScores,
        average
      });

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query(
          `INSERT INTO evaluation_submissions
          (id, assignment_id, cycle_id, reviewer_user_id, reviewee_person_id, overall_score,
            strengths_note, development_note, submitted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            submission.id,
            submission.assignmentId,
            submission.cycleId,
            submission.reviewerUserId,
            submission.revieweePersonId,
            submission.overallScore,
            submission.strengthsNote,
            submission.developmentNote,
            submission.submittedAt
          ]
        );

        for (const answer of buildEvaluationAnswerRows({
          answers: payload.answers,
          templateDefinition,
          submissionId: submission.id,
          createId
        })) {
          await connection.query(
            `INSERT INTO evaluation_answers
             (id, submission_id, question_id, answer_type, score, evidence_note, answer_text, answer_options_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              answer.id,
              answer.submissionId,
              answer.questionId,
              answer.answerType,
              answer.score,
              answer.evidenceNote,
              answer.textValue,
              JSON.stringify(answer.selectedOptions)
            ]
          );
        }

        await connection.query(
          `UPDATE evaluation_assignments SET status = 'submitted' WHERE id = ?`,
          [assignment.id]
        );

        await connection.query(
          `UPDATE evaluation_cycle_raters
           SET status = 'completed'
           WHERE cycle_id = ? AND participant_person_id = ? AND rater_user_id = ? AND relationship_type = ?`,
          [
            assignment.cycleId,
            assignment.revieweePersonId,
            assignment.reviewerUserId,
            assignment.relationshipType
          ]
        );

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const responses = await fetchMysqlResponses(pool, customLibraryState.published, {
        supportsFeedbackAcknowledgement
      });
      return responses.find((item) => item.id === submission.id);
    },
    async acknowledgeReceivedManagerFeedback(submissionId, payload, actorUser) {
      if (!supportsFeedbackAcknowledgement) {
        throw new Error(
          "Este ambiente ainda nao suporta o registro de concordancia do colaborador."
        );
      }

      const acknowledgement = validateFeedbackAcknowledgementPayload(payload);
      const [rows] = await pool.query(
        `SELECT s.id, s.assignment_id AS assignmentId, s.reviewee_person_id AS revieweePersonId,
                a.relationship_type AS relationshipType
         FROM evaluation_submissions s
         JOIN evaluation_assignments a ON a.id = s.assignment_id
         WHERE s.id = ?
         LIMIT 1`,
        [submissionId]
      );

      if (!rows[0]) {
        throw new Error("Feedback do lider nao encontrado.");
      }
      if (rows[0].relationshipType !== "manager") {
        throw new Error("Somente feedback do lider permite concordancia do colaborador.");
      }
      if (rows[0].revieweePersonId !== actorUser?.person?.id) {
        throw new Error("Usuario nao autorizado a responder este feedback.");
      }

      const acknowledgedAt = new Date().toISOString();
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `UPDATE evaluation_submissions
           SET reviewee_acknowledgement_status = ?, reviewee_acknowledgement_note = ?, reviewee_acknowledged_at = ?
           WHERE id = ?`,
          [acknowledgement.status, acknowledgement.note, acknowledgedAt, submissionId]
        );

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action:
            acknowledgement.status === FEEDBACK_ACKNOWLEDGEMENT_STATUS.agreed
              ? "manager_feedback_agreed"
              : "manager_feedback_disagreed",
          entityType: "evaluation_submission",
          entityId: submissionId,
          entityLabel: actorUser.person?.name || actorUser.email,
          actorUser,
          summary:
            acknowledgement.status === FEEDBACK_ACKNOWLEDGEMENT_STATUS.agreed
              ? "Colaborador concordou com o feedback do lider"
              : "Colaborador discordou do feedback do lider",
          detail: acknowledgement.note || "Sem observacoes adicionais."
        });

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const responses = await fetchMysqlResponses(pool, customLibraryState.published, {
        supportsFeedbackAcknowledgement
      });
      return responses.find((item) => item.id === submissionId) || null;
    },
    async getApplauseEntries(actorUser) {
      const [rows] = await pool.query(
        `SELECT a.id, a.sender_person_id AS senderPersonId, a.receiver_person_id AS receiverPersonId,
                a.category, a.impact, a.context_note AS contextNote, a.created_at AS createdAt,
                a.status, sender.name AS senderName, receiver.name AS receiverName
         FROM applause_entries a
         JOIN people sender ON sender.id = a.sender_person_id
         JOIN people receiver ON receiver.id = a.receiver_person_id
         ORDER BY a.created_at DESC`
      );

      if (isFullAccessUser(actorUser)) {
        return rows;
      }

      if (isManagerUser(actorUser)) {
        const people = await fetchPeopleRows(pool);
        const visiblePersonIds = new Set([
          actorUser.person.id,
          ...getTeamPeople(people, actorUser.person.id).map((item) => item.id)
        ]);
        return rows.filter(
          (item) =>
            visiblePersonIds.has(item.senderPersonId) ||
            visiblePersonIds.has(item.receiverPersonId)
        );
      }

      return rows.filter(
        (item) =>
          item.senderPersonId === actorUser.person.id ||
          item.receiverPersonId === actorUser.person.id
      );
    },
    async createApplauseEntry(payload) {
      const [rows] = await pool.query(
        `SELECT sender_person_id AS senderPersonId, receiver_person_id AS receiverPersonId, created_at AS createdAt
         FROM applause_entries`
      );
      assertCanCreateApplause(rows, payload);

      const applause = {
        id: createId("applause"),
        createdAt: new Date().toISOString(),
        status: "Validado",
        ...payload
      };
      await pool.query(
        `INSERT INTO applause_entries
         (id, sender_person_id, receiver_person_id, category, impact, context_note, created_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          applause.id,
          applause.senderPersonId,
          applause.receiverPersonId,
          applause.category,
          applause.impact,
          applause.contextNote,
          applause.createdAt,
          applause.status
        ]
      );
      const [people] = await pool.query(`SELECT id, name FROM people WHERE id IN (?, ?)`, [
        applause.senderPersonId,
        applause.receiverPersonId
      ]);
      const sender = people.find((person) => person.id === applause.senderPersonId);
      const receiver = people.find((person) => person.id === applause.receiverPersonId);
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.applause,
        action: "created",
        entityType: "applause_entry",
        entityId: applause.id,
        entityLabel: applause.category,
        actorUser: {
          id: null,
          email: null,
          roleKey: "employee",
          person: sender ? { id: sender.id, name: sender.name } : null
        },
        summary: `Aplause registrado para ${receiver?.name || "colaborador"}`,
        detail: buildApplauseAuditDetail({
          category: applause.category,
          senderName: sender?.name,
          receiverName: receiver?.name
        })
      });
      return {
        ...applause,
        senderName: sender?.name || "",
        receiverName: receiver?.name || ""
      };
    },
    async updateApplauseEntry(applauseId, payload, actorUser) {
      const [people, rows] = await Promise.all([
        fetchPeopleRows(pool),
        pool
          .query(
            `SELECT id, sender_person_id AS senderPersonId, receiver_person_id AS receiverPersonId,
                    category, impact, context_note AS contextNote, created_at AS createdAt, status
             FROM applause_entries
             WHERE id = ?
             LIMIT 1`,
            [applauseId]
          )
          .then(([result]) => result)
      ]);

      const applause = rows[0];
      if (!applause) {
        throw new Error("Registro de Aplause nao encontrado.");
      }

      assertCanManageApplauseEntry(actorUser, people, applause, {
        isOrgWideUser,
        getTeamPeople
      });
      assertValidApplauseStatus(payload.status);

      await pool.query(
        `UPDATE applause_entries
         SET receiver_person_id = ?, category = ?, impact = ?, context_note = ?, status = ?
         WHERE id = ?`,
        [
          payload.receiverPersonId,
          payload.category,
          payload.impact,
          payload.contextNote,
          payload.status,
          applauseId
        ]
      );

      const sender = people.find((person) => person.id === applause.senderPersonId);
      const receiver = people.find((person) => person.id === payload.receiverPersonId);
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.applause,
        action: payload.status === "Arquivado" ? "archived" : "updated",
        entityType: "applause_entry",
        entityId: applauseId,
        entityLabel: payload.category,
        actorUser,
        summary:
          payload.status === "Arquivado"
            ? `Aplause arquivado para ${receiver?.name || "colaborador"}`
            : `Aplause atualizado para ${receiver?.name || "colaborador"}`,
        detail: buildApplauseAuditDetail({
          category: payload.category,
          senderName: sender?.name,
          receiverName: receiver?.name
        })
      });

      return {
        ...applause,
        ...payload,
        id: applauseId,
        senderPersonId: applause.senderPersonId,
        createdAt: applause.createdAt,
        senderName: sender?.name || "",
        receiverName: receiver?.name || ""
      };
    },
    async getDevelopmentRecords(actorUser) {
      const actorPersonId = actorUser.person?.id || actorUser.personId;
      const [rows] = await pool.query(
        `SELECT d.id, d.person_id AS personId, p.name AS personName, d.record_type AS recordType,
                d.title, d.provider_name AS providerName, d.completed_at AS completedAt,
                d.skill_signal AS skillSignal, d.notes, d.status, d.archived_at AS archivedAt
         FROM development_records d
         JOIN people p ON p.id = d.person_id
         ORDER BY d.completed_at DESC`
      );

      if (isFullAccessUser(actorUser)) {
        return rows;
      }

      if (isManagerUser(actorUser)) {
        const people = await fetchPeopleRows(pool);
        const visiblePersonIds = new Set([
          actorPersonId,
          ...getTeamPeople(people, actorPersonId).map((item) => item.id)
        ]);
        return rows.filter((item) => visiblePersonIds.has(item.personId));
      }

      return rows.filter((item) => item.personId === actorPersonId);
    },
    async createDevelopmentRecord(payload, actorUser) {
      const people = await fetchPeopleRows(pool);
      assertCanManageDevelopmentSubject(actorUser, people, payload.personId, {
        isOrgWideUser,
        isManagerUser,
        getTeamPeople
      });

      const record = {
        id: createId("development"),
        ...payload,
        status: "active",
        archivedAt: null
      };
      await pool.query(
        `INSERT INTO development_records
         (id, person_id, record_type, title, provider_name, completed_at, skill_signal, notes, status, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.personId,
          record.recordType,
          record.title,
          record.providerName,
          record.completedAt,
          record.skillSignal,
          record.notes,
          record.status,
          record.archivedAt
        ]
      );
      const person = people.find((item) => item.id === record.personId);
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.development,
        action: "created",
        entityType: "development_record",
        entityId: record.id,
        entityLabel: record.title,
        actorUser,
        summary: `Registro de desenvolvimento criado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentRecordAuditDetail(record)
      });
      return record;
    },
    async updateDevelopmentRecord(recordId, payload, actorUser) {
      const people = await fetchPeopleRows(pool);
      const [[existingRecord]] = await pool.query(
        `SELECT id, person_id AS personId
         FROM development_records
         WHERE id = ?`,
        [recordId]
      );

      if (!existingRecord) {
        throw new Error("Registro de desenvolvimento nao encontrado.");
      }

      assertCanManageDevelopmentSubject(
        actorUser,
        people,
        payload.personId || existingRecord.personId,
        {
          isOrgWideUser,
          isManagerUser,
          getTeamPeople
        }
      );
      assertValidDevelopmentRecordStatus(payload.status);

      const archivedAt = payload.status === "archived" ? new Date().toISOString() : null;
      await pool.query(
        `UPDATE development_records
         SET person_id = ?, record_type = ?, title = ?, provider_name = ?, completed_at = ?,
             skill_signal = ?, notes = ?, status = ?, archived_at = ?
         WHERE id = ?`,
        [
          payload.personId,
          payload.recordType,
          payload.title,
          payload.providerName,
          payload.completedAt,
          payload.skillSignal,
          payload.notes,
          payload.status,
          archivedAt,
          recordId
        ]
      );

      const person = people.find((item) => item.id === payload.personId);
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.development,
        action: payload.status === "archived" ? "archived" : "updated",
        entityType: "development_record",
        entityId: recordId,
        entityLabel: payload.title,
        actorUser,
        summary:
          payload.status === "archived"
            ? `Registro de desenvolvimento arquivado para ${person?.name || "pessoa"}`
            : `Registro de desenvolvimento atualizado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentRecordAuditDetail(payload)
      });

      return {
        id: recordId,
        ...payload,
        archivedAt,
        personName: person?.name || ""
      };
    },
    async getLearningIntegrationEvents(actorUser) {
      if (!isOrgWideUser(actorUser)) {
        throw new Error("Perfil sem permissao para visualizar integracoes de aprendizagem.");
      }

      if (!supportsLearningIntegrations) {
        return [];
      }

      const [rows, people] = await Promise.all([
        fetchLearningIntegrationEventRows(pool),
        fetchPeopleRows(pool)
      ]);

      return rows.map((event) => presentLearningIntegrationEvent(event, people));
    },
    async ingestLearningIntegrationEvents(payload, actorUser) {
      if (!isOrgWideUser(actorUser)) {
        throw new Error("Perfil sem permissao para receber integracoes de aprendizagem.");
      }

      if (!supportsLearningIntegrations) {
        throw new Error("Fila de integracao de aprendizagem indisponivel no banco atual.");
      }

      const [people, users] = await Promise.all([fetchPeopleRows(pool), fetchUserRows(pool)]);
      const rows = buildLearningIntegrationEventRows(payload, people, users, actorUser);
      const accepted = [];

      for (const row of rows) {
        const [result] = await pool.query(
          `INSERT IGNORE INTO learning_integration_events
           (id, source_system, external_id, person_email, person_document, person_id, event_type,
            title, provider_name, status, occurred_at, workload_hours, competency_key, suggested_action,
            processing_status, raw_payload_json, created_at, created_by_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.id,
            row.sourceSystem,
            row.externalId,
            row.personEmail,
            row.personDocument || null,
            row.personId,
            row.eventType,
            row.title,
            row.providerName,
            row.status,
            row.occurredAt || null,
            row.workloadHours,
            row.competencyKey || null,
            row.suggestedAction,
            row.processingStatus,
            JSON.stringify(row.rawPayload || {}),
            row.createdAt,
            row.createdByUserId
          ]
        );

        if (result.affectedRows) {
          accepted.push(row);
        }
      }

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.development,
        action: "imported",
        entityType: "learning_integration_event",
        entityId: accepted[0]?.id || rows[0]?.id || "learning_integration",
        entityLabel: payload.sourceSystem || "Integracao de aprendizagem",
        actorUser,
        summary: `${accepted.length} eventos de aprendizagem recebidos de ${payload.sourceSystem || "sistema externo"}`,
        detail: `${accepted.filter((item) => item.processingStatus === "ready_for_review").length} prontos para revisao · ${accepted.filter((item) => item.processingStatus === "needs_review").length} exigem conciliacao`
      });

      return {
        sourceSystem: payload.sourceSystem,
        received: rows.length,
        accepted: accepted.length,
        duplicates: rows.length - accepted.length,
        events: accepted.map((event) => presentLearningIntegrationEvent(event, people))
      };
    },
    async applyLearningIntegrationEvent(eventId, payload, actorUser) {
      if (!isOrgWideUser(actorUser)) {
        throw new Error("Perfil sem permissao para aplicar integracoes de aprendizagem.");
      }

      if (!supportsLearningIntegrations) {
        throw new Error("Fila de integracao de aprendizagem indisponivel no banco atual.");
      }

      const [events, people, competencies] = await Promise.all([
        fetchLearningIntegrationEventRows(pool),
        fetchPeopleRows(pool),
        fetchCompetencyRows(pool)
      ]);
      const event = events.find((item) => item.id === eventId);
      if (!event) {
        throw new Error("Evento de aprendizagem nao encontrado.");
      }

      const application = buildLearningIntegrationApplicationPayload(
        event,
        payload,
        competencies
      );
      const appliedEntity =
        application.entityType === "development_record"
          ? await this.createDevelopmentRecord(application.payload, actorUser)
          : await this.createDevelopmentPlan(application.payload, actorUser);
      const appliedAt = new Date().toISOString();
      const reviewNote = String(payload?.reviewNote || "").trim();

      await pool.query(
        `UPDATE learning_integration_events
         SET processing_status = ?, applied_entity_type = ?, applied_entity_id = ?,
             applied_at = ?, review_note = ?
         WHERE id = ?`,
        [
          "applied",
          application.entityType,
          appliedEntity.id,
          appliedAt,
          reviewNote || null,
          eventId
        ]
      );

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.development,
        action: "applied",
        entityType: "learning_integration_event",
        entityId: event.id,
        entityLabel: event.title,
        actorUser,
        summary: `Evento de aprendizagem aplicado em ${application.entityType === "development_record" ? "desenvolvimento" : "PDI"}`,
        detail: `${event.sourceSystem} · ${event.externalId} · ${appliedEntity.id}`
      });

      return {
        event: presentLearningIntegrationEvent(
          {
            ...event,
            processingStatus: "applied",
            appliedEntityType: application.entityType,
            appliedEntityId: appliedEntity.id,
            appliedAt,
            reviewNote
          },
          people
        ),
        appliedEntity
      };
    },
    async getDevelopmentPlans(actorUser) {
      const actorPersonId = actorUser.person?.id || actorUser.personId;
      const [plans, people, cycles, competencies] = await Promise.all([
        fetchDevelopmentPlanRows(pool),
        fetchPeopleRows(pool),
        pool
          .query(
            `SELECT id, title, semester_label AS semesterLabel, due_date AS dueDate
             FROM evaluation_cycles`
          )
          .then(([rows]) => rows),
        fetchCompetencyRows(pool)
      ]);

      const enrichedPlans = plans.map((item) =>
        enrichDevelopmentPlan(item, people, cycles, competencies)
      );

      if (isOrgWideUser(actorUser)) {
        return enrichedPlans;
      }

      if (isManagerUser(actorUser)) {
        const visiblePersonIds = new Set([
          actorPersonId,
          ...getTeamPeople(people, actorPersonId).map((item) => item.id)
        ]);
        return enrichedPlans.filter((item) => visiblePersonIds.has(item.personId));
      }

      return enrichedPlans.filter((item) => item.personId === actorPersonId);
    },
    async createDevelopmentPlan(payload, actorUser) {
      const [people, competencies] = await Promise.all([
        fetchPeopleRows(pool),
        fetchCompetencyRows(pool)
      ]);
      assertCanCreateDevelopmentPlan(actorUser, people, payload.personId);

      if (payload.cycleId) {
        const [[cycle]] = await pool.query(
          `SELECT id FROM evaluation_cycles WHERE id = ? LIMIT 1`,
          [payload.cycleId]
        );
        if (!cycle) {
          throw new Error("Ciclo do PDI nao encontrado.");
        }
      }

      if (payload.competencyId && !competencies.some((item) => item.id === payload.competencyId)) {
        throw new Error("Competencia do PDI nao encontrada.");
      }

      const plan = {
        id: createId("development_plan"),
        personId: payload.personId,
        cycleId: payload.cycleId || null,
        competencyId: payload.competencyId || null,
        focusTitle: payload.focusTitle,
        actionText: payload.actionText,
        dueDate: payload.dueDate,
        expectedEvidence: payload.expectedEvidence,
        status: "active",
        createdByUserId: actorUser.id,
        createdAt: new Date().toISOString(),
        archivedAt: null
      };

      await pool.query(
        `INSERT INTO development_plans
         (id, person_id, cycle_id, competency_id, focus_title, action_text, due_date,
          expected_evidence, status, created_by_user_id, created_at, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          plan.id,
          plan.personId,
          plan.cycleId,
          plan.competencyId,
          plan.focusTitle,
          plan.actionText,
          plan.dueDate,
          plan.expectedEvidence,
          plan.status,
          plan.createdByUserId,
          plan.createdAt,
          plan.archivedAt
        ]
      );

      const person = people.find((item) => item.id === plan.personId);
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.development,
        action: "plan_created",
        entityType: "development_plan",
        entityId: plan.id,
        entityLabel: plan.focusTitle,
        actorUser,
        summary: `PDI criado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentPlanAuditDetail(plan)
      });

      const [cycles] = await pool.query(
        `SELECT id, title, semester_label AS semesterLabel, due_date AS dueDate
         FROM evaluation_cycles`
      );
      return enrichDevelopmentPlan(plan, people, cycles, competencies);
    },
    async updateDevelopmentPlan(planId, payload, actorUser) {
      const [people, competencies] = await Promise.all([
        fetchPeopleRows(pool),
        fetchCompetencyRows(pool)
      ]);
      const [[existingPlan]] = await pool.query(
        `SELECT id, person_id AS personId, created_by_user_id AS createdByUserId,
                created_at AS createdAt
         FROM development_plans
         WHERE id = ?`,
        [planId]
      );

      if (!existingPlan) {
        throw new Error("PDI nao encontrado.");
      }

      assertCanCreateDevelopmentPlan(actorUser, people, payload.personId || existingPlan.personId);
      assertValidDevelopmentPlanStatus(payload.status);

      if (payload.cycleId) {
        const [[cycle]] = await pool.query(
          `SELECT id FROM evaluation_cycles WHERE id = ? LIMIT 1`,
          [payload.cycleId]
        );
        if (!cycle) {
          throw new Error("Ciclo do PDI nao encontrado.");
        }
      }

      if (payload.competencyId && !competencies.some((item) => item.id === payload.competencyId)) {
        throw new Error("Competencia do PDI nao encontrada.");
      }

      const archivedAt = payload.status === "archived" ? new Date().toISOString() : null;
      await pool.query(
        `UPDATE development_plans
         SET person_id = ?, cycle_id = ?, competency_id = ?, focus_title = ?, action_text = ?,
             due_date = ?, expected_evidence = ?, status = ?, archived_at = ?
         WHERE id = ?`,
        [
          payload.personId,
          payload.cycleId || null,
          payload.competencyId || null,
          payload.focusTitle,
          payload.actionText,
          payload.dueDate,
          payload.expectedEvidence,
          payload.status,
          archivedAt,
          planId
        ]
      );

      const person = people.find((item) => item.id === payload.personId);
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.development,
        action: payload.status === "archived" ? "plan_archived" : "plan_updated",
        entityType: "development_plan",
        entityId: planId,
        entityLabel: payload.focusTitle,
        actorUser,
        summary:
          payload.status === "archived"
            ? `PDI arquivado para ${person?.name || "pessoa"}`
            : `PDI atualizado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentPlanAuditDetail(payload)
      });

      const [cycles] = await pool.query(
        `SELECT id, title, semester_label AS semesterLabel, due_date AS dueDate
         FROM evaluation_cycles`
      );
      return enrichDevelopmentPlan(
        {
          id: planId,
          ...payload,
          cycleId: payload.cycleId || null,
          competencyId: payload.competencyId || null,
          createdByUserId: existingPlan.createdByUserId,
          createdAt: existingPlan.createdAt,
          archivedAt
        },
        people,
        cycles,
        competencies
      );
    },
    async getDashboardOverview(actorUser, options = {}) {
      const timeGrouping = options.timeGrouping || "semester";
      const [people, cycles, responses, assignmentRows, applauseRows, developmentRows] = await Promise.all([
        fetchPeopleRows(pool),
        pool
          .query(
            `SELECT id, title, semester_label AS semesterLabel, due_date AS dueDate
             FROM evaluation_cycles`
          )
          .then(([rows]) => rows),
        fetchMysqlResponses(pool, customLibraryState.published, {
          supportsFeedbackAcknowledgement
        }).then((items) => [...items, ...anonymousResponseState.responses]),
        pool
          .query(
            `SELECT cycle_id AS cycleId, relationship_type AS relationshipType,
                    reviewer_user_id AS reviewerUserId,
                    reviewee_person_id AS revieweePersonId, status
             FROM evaluation_assignments`
          )
          .then(([rows]) => rows),
        pool
          .query(
            `SELECT sender_person_id AS senderPersonId, receiver_person_id AS receiverPersonId
             FROM applause_entries`
          )
          .then(([rows]) => rows),
        pool
          .query(
            `SELECT d.person_id AS personId, d.record_type AS recordType
             FROM development_records d`
          )
          .then(([rows]) => rows)
      ]);

      const availableAreas = [...new Set(people.map((person) => person.area))].sort();

      if (isFullAccessUser(actorUser)) {
        const scopedPeople = options.area
          ? people.filter((person) => person.area === options.area)
          : people;
        const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
        const scopedAssignments = assignmentRows.filter((item) =>
          scopedPersonIds.has(item.revieweePersonId)
        );
        const scopedCycleIds = new Set(scopedAssignments.map((item) => item.cycleId));

        return buildDashboardPayload({
          mode: "executive",
          notice: options.area
            ? `Leitura consolidada filtrada para a area ${options.area}.`
            : "Leitura consolidada para RH, compliance e lideranca.",
          scopeLabel: options.area ? `Area: ${options.area}` : "Consolidado organizacional",
          cycles: cycles.filter((cycle) => scopedCycleIds.has(cycle.id)),
          people: scopedPeople,
          assignments: scopedAssignments,
          applauseEntries: applauseRows.filter((item) =>
            scopedPersonIds.has(item.receiverPersonId)
          ),
          developmentRecords: developmentRows.filter((item) =>
            scopedPersonIds.has(item.personId)
          ),
          responses: responses.filter((item) => scopedPersonIds.has(item.revieweePersonId)),
          availableAreas,
          selectedArea: options.area,
          timeGrouping,
          evaluationHighlights: [
            "Leitura consolidada pronta para ritos executivos e comites.",
            "Filtro por area ajuda a comparar recortes sem expor detalhes indevidos.",
            "KPIs, donuts e mix de avaliacoes se ajustam ao escopo aplicado."
          ]
        });
      }

      if (isManagerUser(actorUser)) {
        const scopedPeople = people.filter(
          (person) => person.id === actorUser.person.id || person.managerPersonId === actorUser.person.id
        );
        const visiblePersonIds = new Set(scopedPeople.map((item) => item.id));
        const scopedAssignments = assignmentRows.filter(
          (item) =>
            item.reviewerUserId === actorUser.id || visiblePersonIds.has(item.revieweePersonId)
        );
        const scopedCycleIds = new Set(scopedAssignments.map((item) => item.cycleId));

        return buildDashboardPayload({
          mode: "team",
          notice: "Leitura da sua equipe direta, sem exposicao de outras areas.",
          scopeLabel: "Equipe direta",
          cycles: cycles.filter((cycle) => scopedCycleIds.has(cycle.id)),
          people: scopedPeople,
          assignments: scopedAssignments,
          applauseEntries: applauseRows.filter((item) =>
            visiblePersonIds.has(item.receiverPersonId)
          ),
          developmentRecords: developmentRows.filter((item) =>
            visiblePersonIds.has(item.personId)
          ),
          responses: responses.filter((item) => visiblePersonIds.has(item.revieweePersonId)),
          timeGrouping,
          evaluationHighlights: [
            "Voce acompanha somente sua equipe direta.",
            "Respostas confidenciais continuam agregadas quando aplicavel.",
            "O dashboard gerencial reforca entregas, cobertura e desenvolvimento do time."
          ]
        });
      }

      const myAssignments = assignmentRows.filter((item) => item.reviewerUserId === actorUser.id);
      const myCycleIds = new Set(myAssignments.map((item) => item.cycleId));

      return buildDashboardPayload({
        mode: "personal",
        notice: "Voce esta vendo apenas seu recorte individual.",
        scopeLabel: "Visao pessoal",
        cycles: cycles.filter((cycle) => myCycleIds.has(cycle.id)),
        people: people.filter((person) => person.id === actorUser.person.id),
        assignments: myAssignments,
        applauseEntries: applauseRows.filter((item) => item.receiverPersonId === actorUser.person.id),
        developmentRecords: developmentRows.filter((item) => item.personId === actorUser.person.id),
        responses: responses.filter((item) => item.reviewerUserId === actorUser.id),
        timeGrouping,
        evaluationHighlights: [
          "Seu dashboard mostra apenas dados pessoais e agregados permitidos.",
          "Respostas confidenciais de lideranca e empresa entram somente em leitura agregada.",
          "A trilha de desenvolvimento e o ciclo aparecem no mesmo contexto operacional."
        ]
      });
    }
  };
}

export async function createStore() {
  const customLibraryState = await loadCustomLibraryState();
  const anonymousResponseState = await loadAnonymousResponseState();

  if (env.storageMode !== "mysql") {
    return buildMemoryStore(customLibraryState, anonymousResponseState);
  }

  const pool = mysql.createPool({
    host: env.mysql.host,
    port: env.mysql.port,
    user: env.mysql.user,
    password: env.mysql.password,
    database: env.mysql.database,
    ssl: env.mysql.ssl || undefined,
    waitForConnections: true,
    connectionLimit: 10
  });

  const [
    supportsCycleConfig,
    supportsFeedbackAcknowledgement,
    _supportsPeopleWorkContext,
    supportsAssignmentReminder,
    supportsPairings,
    supportsLearningIntegrations
  ] =
    await Promise.all([
      ensureMysqlCycleConfigSupport(pool),
      ensureMysqlFeedbackAcknowledgementSupport(pool),
      ensureMysqlPeopleWorkContextSupport(pool),
      ensureMysqlAssignmentReminderSupport(pool),
      ensureMysqlPairingSupport(pool),
      ensureMysqlLearningIntegrationSupport(pool)
    ]);
  return buildMysqlStore(pool, customLibraryState, anonymousResponseState, {
    supportsCycleConfig,
    supportsFeedbackAcknowledgement,
    supportsAssignmentReminder,
    supportsPairings,
    supportsLearningIntegrations
  });
}
