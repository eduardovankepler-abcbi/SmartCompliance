import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { emptyArea, emptyPerson, emptyUser } from "./appConfig.js";
import {
  buildSuggestedUserEmail,
  getPersonConsistencyMessages,
  validatePersonPayload,
  validateUserPayload
} from "./registry.js";

export function useRegistryFlow({
  areas,
  people,
  reloadData,
  setActiveSection,
  setError,
  users
}) {
  const [areaForm, setAreaForm] = useState(emptyArea);
  const [personForm, setPersonForm] = useState(emptyPerson);
  const [userForm, setUserForm] = useState(emptyUser);

  const peopleOptions = useMemo(
    () => people.map((person) => ({ value: person.id, label: person.name })),
    [people]
  );

  const peopleById = useMemo(
    () => Object.fromEntries(people.map((person) => [person.id, person])),
    [people]
  );

  const areaOptions = useMemo(
    () => areas.map((area) => ({ value: area.name, label: area.name })),
    [areas]
  );

  const managerOptions = useMemo(
    () => [{ value: "", label: "Sem gestor direto definido" }, ...peopleOptions],
    [peopleOptions]
  );

  const usersByPersonId = useMemo(
    () => Object.fromEntries(users.map((item) => [item.personId, item])),
    [users]
  );

  const availableUserPeopleOptions = useMemo(() => {
    const linkedPersonIds = new Set(users.map((item) => item.personId));

    return people
      .filter((person) => !linkedPersonIds.has(person.id))
      .map((person) => ({
        value: person.id,
        label: `${person.name} · ${person.area} · ${person.workUnit || "Unidade principal"}`
      }));
  }, [people, users]);

  const peopleAccessJourney = useMemo(
    () =>
      people.map((person) => {
        const linkedUser = usersByPersonId[person.id] || null;
        const accessState = !linkedUser
          ? "pending"
          : linkedUser.status === "active"
            ? "active"
            : "inactive";

        return {
          ...person,
          linkedUser,
          accessState
        };
      }),
    [people, usersByPersonId]
  );

  const accessJourneySummary = useMemo(
    () => ({
      totalPeople: peopleAccessJourney.length,
      pending: peopleAccessJourney.filter((person) => person.accessState === "pending").length,
      active: peopleAccessJourney.filter((person) => person.accessState === "active").length,
      inactive: peopleAccessJourney.filter((person) => person.accessState === "inactive").length
    }),
    [peopleAccessJourney]
  );

  const pendingAccessPeople = useMemo(
    () => peopleAccessJourney.filter((person) => person.accessState === "pending"),
    [peopleAccessJourney]
  );

  const personAccessStateById = useMemo(
    () =>
      Object.fromEntries(
        peopleAccessJourney.map((person) => [
          person.id,
          {
            key: person.accessState,
            user: person.linkedUser
          }
        ])
      ),
    [peopleAccessJourney]
  );

  const selectedUserPerson = useMemo(
    () => peopleById[userForm.personId] || null,
    [peopleById, userForm.personId]
  );

  const suggestedUserRole = useMemo(
    () => getSuggestedRoleForPerson(selectedUserPerson, people),
    [people, selectedUserPerson]
  );

  const suggestedUserRoleReason = useMemo(() => {
    if (!selectedUserPerson) {
      return "";
    }
    if (selectedUserPerson.areaManagerPersonId === selectedUserPerson.id) {
      return "Pessoa marcada como lider atual da area.";
    }
    if (people.some((item) => item.managerPersonId === selectedUserPerson.id)) {
      return "Pessoa com colaboradores vinculados como gestor direto.";
    }
    return "Acesso individual recomendado para quem nao lidera time nem area.";
  }, [people, selectedUserPerson]);

  const suggestedUserEmail = useMemo(
    () => buildSuggestedUserEmail(selectedUserPerson?.name || ""),
    [selectedUserPerson]
  );

  useEffect(() => {
    if (!areas.length) {
      return;
    }

    if (!areaOptions.some((option) => option.value === personForm.area)) {
      setPersonForm((current) => ({
        ...current,
        area: areaOptions[0]?.value || ""
      }));
    }
  }, [areaOptions, areas.length, personForm.area]);

  useEffect(() => {
    if (!personForm.area) {
      return;
    }

    const selectedArea = areas.find((area) => area.name === personForm.area);
    if (!selectedArea) {
      return;
    }

    if (
      !personForm.managerPersonId ||
      !people.some((person) => person.id === personForm.managerPersonId)
    ) {
      setPersonForm((current) => ({
        ...current,
        managerPersonId: current.managerPersonId || selectedArea.managerPersonId || ""
      }));
    }
  }, [areas, people, personForm.area, personForm.managerPersonId]);

  useEffect(() => {
    const nextPersonId =
      availableUserPeopleOptions.find((person) => person.value === userForm.personId)?.value ||
      availableUserPeopleOptions[0]?.value ||
      "";

    if (nextPersonId !== userForm.personId) {
      const nextPerson = peopleById[nextPersonId] || null;
      setUserForm((current) => ({
        ...current,
        personId: nextPersonId,
        roleKey: nextPerson ? getSuggestedRoleForPerson(nextPerson, people) : emptyUser.roleKey
      }));
    }
  }, [availableUserPeopleOptions, people, peopleById, userForm.personId]);

  useEffect(() => {
    if (!userForm.personId || !suggestedUserEmail) {
      return;
    }

    setUserForm((current) => {
      const currentEmail = String(current.email || "").trim().toLowerCase();
      const previousSuggestedEmail = buildSuggestedUserEmail(
        peopleById[current.personId]?.name || ""
      );

      if (currentEmail && currentEmail !== previousSuggestedEmail) {
        return current;
      }

      if (currentEmail === suggestedUserEmail) {
        return current;
      }

      return {
        ...current,
        email: suggestedUserEmail
      };
    });
  }, [peopleById, suggestedUserEmail, userForm.personId]);

  async function handlePersonSubmit(event, options = {}) {
    event?.preventDefault?.();

    try {
      const validationError = validatePersonPayload(personForm);
      if (validationError) {
        setError(validationError);
        return;
      }

      const personConsistency = getPersonConsistencyMessages(personForm, { areas, people });
      if (personConsistency.blocking.length) {
        setError(personConsistency.blocking[0]);
        return;
      }

      setError("");
      const createdPerson = await api.createPerson({
        ...personForm,
        managerPersonId: personForm.managerPersonId || null
      });
      const shouldCreateUserAfter = options.createUserAfter;
      const isAreaManager = personForm.isAreaManager === "yes";

      setPersonForm(emptyPerson);
      await reloadData();

      if (shouldCreateUserAfter) {
        setUserForm(
          buildUserFormFromPerson(createdPerson, people, {
            isAreaManager
          })
        );
        setActiveSection("Usuarios");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAreaSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      await api.createArea({
        name: areaForm.name
      });
      setAreaForm(emptyArea);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAreaUpdate(areaId, payload) {
    try {
      setError("");
      await api.updateArea(areaId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePersonUpdate(personId, payload) {
    try {
      const validationError = validatePersonPayload(payload);
      if (validationError) {
        setError(validationError);
        return;
      }

      const personConsistency = getPersonConsistencyMessages(payload, {
        areas,
        currentPersonId: personId,
        people
      });
      if (personConsistency.blocking.length) {
        setError(personConsistency.blocking[0]);
        return;
      }

      setError("");
      await api.updatePerson(personId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUserSubmit(event) {
    event.preventDefault();

    try {
      const validationError = validateUserPayload(userForm);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError("");
      await api.createUser(userForm);
      setUserForm((current) => ({
        ...emptyUser,
        personId: current.personId
      }));
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUserUpdate(userId, payload) {
    try {
      const validationError = validateUserPayload(payload, { requirePassword: false });
      if (validationError) {
        setError(validationError);
        return;
      }

      setError("");
      await api.updateUser(userId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function prepareUserProvisioning(personId) {
    const person = peopleById[personId];
    if (!person) {
      return;
    }

    setUserForm(buildUserFormFromPerson(person, people));
    setActiveSection("Usuarios");
  }

  function handleUserPersonSelect(personId) {
    const person = peopleById[personId] || null;

    setUserForm((current) => ({
      ...current,
      personId,
      roleKey: person ? getSuggestedRoleForPerson(person, people) : emptyUser.roleKey
    }));
  }

  function resetRegistryForms() {
    setAreaForm(emptyArea);
    setPersonForm(emptyPerson);
    setUserForm(emptyUser);
  }

  return {
    accessJourneySummary,
    areaForm,
    areaOptions,
    availableUserPeopleOptions,
    handleAreaSubmit,
    handleAreaUpdate,
    handlePersonSubmit,
    handlePersonUpdate,
    handleUserPersonSelect,
    handleUserSubmit,
    handleUserUpdate,
    managerOptions,
    pendingAccessPeople,
    peopleAccessJourney,
    personAccessStateById,
    personForm,
    prepareUserProvisioning,
    resetRegistryForms,
    selectedUserPerson,
    setAreaForm,
    setPersonForm,
    setUserForm,
    suggestedUserEmail,
    suggestedUserRole,
    suggestedUserRoleReason,
    userForm
  };
}

function getSuggestedRoleForPerson(person, people) {
  if (!person) {
    return emptyUser.roleKey;
  }

  const isAreaLeader = person.areaManagerPersonId === person.id;
  const hasDirectReports = people.some((item) => item.managerPersonId === person.id);

  return isAreaLeader || hasDirectReports ? "manager" : "employee";
}

function buildUserFormFromPerson(person, people, options = {}) {
  return {
    ...emptyUser,
    personId: person?.id || "",
    email: buildSuggestedUserEmail(person?.name || ""),
    roleKey:
      options.roleKey ||
      (options.isAreaManager ? "manager" : getSuggestedRoleForPerson(person, people))
  };
}
