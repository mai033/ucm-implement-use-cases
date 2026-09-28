const stages = {
  "no-transcript": {
    number: "01",
    label: "Agent-entered context",
    title: "No transcript available",
    description:
      "The human agent supplies the call reason or notes. Agentforce uses approved guidance and accessible Salesforce records.",
    implementation:
      "Employee-facing Agentforce, Salesforce Knowledge, Flow or Apex actions, and the records already available to the signed-in agent.",
    requirement:
      "Approved department criteria and SOPs, patient identification, record access, and confirmation before any record is created or updated."
  },
  "post-call": {
    number: "02",
    label: "Completed transcript",
    title: "Completed transcript after the call",
    description:
      "The completed transcript is accessible to Salesforce and matched to the correct Voice Call, patient, and Case.",
    implementation:
      "Salesforce Voice transcription, Work Summaries or prompt templates, Agentforce actions, and Flow or Apex for Case and Task automation.",
    requirement:
      "Reliable transcript completion, VoiceCall-to-Case linkage, consent and retention controls, and agent review before saving generated content."
  },
  live: {
    number: "03",
    label: "Live transcript",
    title: "Live transcript during the call",
    description:
      "Suggestions respond to what the patient is saying now. The human agent checks every recommendation before taking action.",
    implementation:
      "Salesforce Voice real-time transcription, Voice Toolkit events, Agentforce or Next Best Action orchestration, and an agent-console component.",
    requirement:
      "Low-latency transcription, approved guidance, clear uncertainty handling, PHI-safe event processing, and easy agent override."
  }
};

const useCases = [
  {
    id: "right-department-entered",
    stage: "no-transcript",
    name: "Find the right department",
    experience:
      "Types a brief description and gets a suggested destination, transfer criteria, and source policy.",
    example:
      "Patient says their specialist never received the referral. The assistant identifies the referral team and shows what details to collect before transferring.",
    implementation:
      "Ground a routing action in a governed department directory, transfer rules, and escalation criteria. Return the destination, reason, required intake fields, and source citation.",
    needs:
      "Department ownership matrix, transfer criteria, queue identifiers, approved policy source, and fallback handling for ambiguous requests."
  },
  {
    id: "policy-coach",
    stage: "no-transcript",
    name: "Procedure and policy coach",
    experience:
      "Asks a question and receives steps from approved UCM Knowledge or standard operating procedures.",
    example:
      "What should I do when a patient says their procedure authorization is still pending? The assistant shows the approved process and escalation point.",
    implementation:
      "Use Agentforce knowledge grounding with citations and tightly scoped instructions. Separate policy guidance from patient-specific status checks.",
    needs:
      "Current UCM SOPs, named content owners, review dates, article access rules, and an explicit response when no approved answer is found."
  },
  {
    id: "patient-case-catch-up",
    stage: "no-transcript",
    name: "Patient and Case catch-up",
    experience:
      "Reviews a summary of accessible Salesforce records after identifying the patient.",
    example:
      "The assistant shows an open referral Case and a callback task due today, so the agent continues that work instead of starting over.",
    implementation:
      "Query only the verified patient’s accessible Cases, Tasks, recent activities, and commitments. Summarize status without exposing restricted fields.",
    needs:
      "Patient matching, record-level access, relevant Case and Task fields, recency rules, and clear source links back to each record."
  },
  {
    id: "guided-intake",
    stage: "no-transcript",
    name: "Guided intake and Case capture",
    experience:
      "Selects a call reason, completes a short form, then reviews a proposed Case or links an existing one.",
    example:
      "For a missing medical-records request, Salesforce prepopulates the patient and call details. The agent adds the request date and confirms the Case.",
    implementation:
      "Use a short guided Flow launched from Agentforce. Search for likely existing Cases before presenting a confirmed create-or-link decision.",
    needs:
      "Call-reason taxonomy, minimum required fields, Case ownership and routing rules, duplicate criteria, and explicit save confirmation."
  },
  {
    id: "duplicate-follow-up",
    stage: "no-transcript",
    name: "Duplicate and follow-up check",
    experience:
      "Gets a warning about a similar open Case or an outstanding commitment before creating more work.",
    example:
      "Before creating another billing Case, the agent sees that the billing team already has an open Case for the same question.",
    implementation:
      "Invoke a deterministic search across open Cases and Tasks using patient, request category, ownership, status, and a configurable time window.",
    needs:
      "Duplicate-matching rules, false-positive handling, status definitions, task ownership, and a documented path to proceed when a new Case is justified."
  },
  {
    id: "agent-transfer-brief",
    stage: "no-transcript",
    name: "Agent-written transfer brief",
    experience:
      "Enters a short reason and actions taken; a Case or Task carries that context to the receiving team.",
    example:
      "Patient called about a referral fax. I confirmed the referring clinic and fax date; the referral team needs to check receipt.",
    implementation:
      "Provide a structured brief template, let the rep edit it, and write the approved text to the handoff record before Omni routing or transfer.",
    needs:
      "Shared handoff field, receiving-team access, transfer workflow, retention policy, and clear ownership of the next action."
  },
  {
    id: "draft-summary-case",
    stage: "post-call",
    name: "Draft call summary and Case",
    experience:
      "Reviews an AI draft of the issue, actions taken, outcome, and next steps before saving it.",
    example:
      "After a records-request call, the draft states that the patient asked about an outstanding request, the process was explained, and follow-up is needed.",
    implementation:
      "Generate a structured Work Summary from the completed transcript, then map reviewed outputs into VoiceCall fields and a proposed Case action.",
    needs:
      "Completed transcript, speaker identification, VoiceCall linkage, summary field mappings, Case criteria, and mandatory agent confirmation."
  },
  {
    id: "calls-without-cases",
    stage: "post-call",
    name: "Find calls without Cases",
    experience:
      "Works through a supervisor list of completed calls for which a Case may be missing.",
    example:
      "A supervisor sees answered calls with no linked Case. For an unresolved referral, the transcript provides a proposed Case description for review.",
    implementation:
      "Report on completed VoiceCall records without a qualifying Case link. Retrieve the transcript only when a reviewer opens a candidate.",
    needs:
      "Definition of a qualifying Case, completed-call status, VoiceCall-to-Case relationship, review queue, ownership, and dismissal reason."
  },
  {
    id: "next-agent-catch-up",
    stage: "post-call",
    name: "Next-agent catch-up",
    experience:
      "Reads a short recap of a prior call when the patient contacts UCM again.",
    example:
      "Yesterday the patient reported that the referral was missing. The prior agent asked the clinic to resend it; receipt has not yet been confirmed.",
    implementation:
      "Persist a reviewed recap on the VoiceCall or Case and retrieve the most relevant recent interaction after patient identification.",
    needs:
      "Patient and record matching, summary retention, relevance and recency rules, source links, and access controls across receiving teams."
  },
  {
    id: "promised-follow-ups",
    stage: "post-call",
    name: "Extract promised follow-ups",
    experience: "Confirms suggested Tasks found in the completed conversation.",
    example:
      "The transcript contains “We’ll call you once the records team responds.” The assistant proposes a callback Task for the appropriate team.",
    implementation:
      "Extract explicit commitments, normalize owner and timing, and present proposed Tasks. Never create a Task without a human review step.",
    needs:
      "Commitment definition, due-date rules, team ownership, confidence threshold, transcript citation, and duplicate-Task check."
  },
  {
    id: "knowledge-gaps",
    stage: "post-call",
    name: "Identify Knowledge gaps",
    experience:
      "Supervisors review recurring unanswered questions or confusing procedures across completed calls.",
    example:
      "Several calls show agents giving different instructions for obtaining medical records. The Knowledge owner reviews and updates the article.",
    implementation:
      "Classify de-identified transcript themes, compare outcomes and answers, and route evidence-backed clusters into a governed Knowledge improvement queue.",
    needs:
      "Analytics pipeline, minimum cohort sizes, PHI handling, topic taxonomy, Knowledge ownership, and human validation before content changes."
  },
  {
    id: "live-knowledge",
    stage: "live",
    name: "Live Knowledge suggestions",
    experience:
      "Sees a relevant approved article appear as the patient’s issue becomes clear.",
    example:
      "The patient says, “I need a copy of my imaging report.” The records-request article appears without the agent searching for it.",
    implementation:
      "Use live transcript events to search approved Knowledge and surface ranked results with citations in the agent console.",
    needs:
      "Real-time transcript access, indexed approved content, latency target, relevance threshold, article permissions, and an unobtrusive console experience."
  },
  {
    id: "dynamic-plan",
    stage: "live",
    name: "Dynamic service plan",
    experience:
      "Sees suggested steps update as the conversation and understood issue develop.",
    example:
      "The initial steps cover referral status. When the patient explains that it went to the wrong clinic, guidance changes to correction and escalation.",
    implementation:
      "Translate live transcript signals into a supported Case context or action state that can drive an adaptive Service Assistant plan.",
    needs:
      "Workflow state model, Case or session context bridge, approved action sequence, change detection, latency controls, and agent override."
  },
  {
    id: "right-department-live",
    stage: "live",
    name: "Right-department guidance",
    experience:
      "Gets a suggested team and an explanation while speaking with the patient.",
    example:
      "The patient describes an authorization denial. The assistant suggests the appropriate authorization team and shows its transfer criteria.",
    implementation:
      "Evaluate live utterances against the same governed routing action used by the agent-entered experience and update only when confidence improves.",
    needs:
      "Live transcript event stream, department rules, confidence and stability thresholds, destination availability, and source policy."
  },
  {
    id: "missing-information",
    stage: "live",
    name: "Missing-information prompts",
    experience:
      "Sees a reminder to collect information required by the relevant workflow.",
    example:
      "Before a referral handoff, the assistant prompts for the referring provider, destination clinic, and approximate date sent.",
    implementation:
      "Maintain a workflow checklist, mark details present in the live conversation, and surface only the highest-value missing items.",
    needs:
      "Required-field matrix by call reason, transcript extraction, state tracking, suppression rules, and a way for the agent to mark an item unavailable."
  },
  {
    id: "in-call-case-draft",
    stage: "live",
    name: "In-call Case draft",
    experience:
      "Watches the proposed reason, actions, and next step develop, then confirms them at wrap-up.",
    example:
      "During a medical-records call, the draft captures the request type and agreed follow-up; the agent corrects any mistakes before saving.",
    implementation:
      "Incrementally update a non-persistent draft from live transcript events. Save only the agent-approved final version at wrap-up.",
    needs:
      "Draft data model, transcript event handling, field-level confidence, correction workflow, save confirmation, and no premature record writes."
  },
  {
    id: "live-transfer-catch-up",
    stage: "live",
    name: "Live transfer catch-up",
    experience:
      "Reviews a short draft brief for the receiving team before transferring.",
    example:
      "Patient is checking whether a referral fax arrived. Referring clinic and send date are confirmed; the receiving team needs to check the referral queue.",
    implementation:
      "Generate a mid-conversation summary, let the sending rep approve it, and attach it to the transfer context shown to the receiving rep.",
    needs:
      "Transfer event integration, conversation catch-up, editable summary, shared record access, queue routing, and clear next-owner assignment."
  }
];

const sectionsContainer = document.querySelector("#use-case-sections");
const searchInput = document.querySelector("#use-case-search");
const filterButtons = [...document.querySelectorAll(".filter-button")];
const emptyState = document.querySelector("#empty-state");
const clearSearchButton = document.querySelector("#clear-search");
const dialog = document.querySelector("#use-case-dialog");
const dialogContent = document.querySelector("#dialog-content");
const closeDialogButton = document.querySelector(".dialog-close");

let activeFilter = "all";
let searchTerm = "";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function searchableText(useCase) {
  return [
    useCase.name,
    useCase.experience,
    useCase.example,
    useCase.implementation,
    useCase.needs,
    stages[useCase.stage].label
  ]
    .join(" ")
    .toLowerCase();
}

function cardMarkup(useCase, index) {
  return `
    <article
      class="use-case-card"
      data-stage="${useCase.stage}"
      data-use-case-id="${useCase.id}"
      role="button"
      tabindex="0"
      aria-label="View details for ${escapeHtml(useCase.name)}"
    >
      <span class="card-index">${String(index + 1).padStart(2, "0")}</span>
      <h4>${escapeHtml(useCase.name)}</h4>
      <p>${escapeHtml(useCase.experience)}</p>
      <div class="card-example">
        <span>Example</span>
        <p>“${escapeHtml(useCase.example)}”</p>
      </div>
      <div class="card-action">
        <span>View use case</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14M14 7l5 5-5 5" />
        </svg>
      </div>
    </article>
  `;
}

function sectionMarkup(stageKey, cases) {
  const stage = stages[stageKey];
  return `
    <section class="use-case-section" data-stage="${stageKey}" aria-labelledby="stage-${stageKey}">
      <div class="stage-header">
        <span class="stage-number">${stage.number}</span>
        <div class="stage-title">
          <h3 id="stage-${stageKey}">${stage.title}</h3>
          <p>${stage.description}</p>
        </div>
        <span class="stage-count">${cases.length} use case${cases.length === 1 ? "" : "s"}</span>
      </div>
      <div class="use-case-grid">
        ${cases.map(cardMarkup).join("")}
      </div>
    </section>
  `;
}

function renderUseCases() {
  const visible = useCases.filter((useCase) => {
    const matchesFilter =
      activeFilter === "all" || useCase.stage === activeFilter;
    const matchesSearch =
      !searchTerm || searchableText(useCase).includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const stageOrder = ["no-transcript", "post-call", "live"];
  sectionsContainer.innerHTML = stageOrder
    .map((stageKey) => {
      const stageCases = visible.filter(
        (useCase) => useCase.stage === stageKey
      );
      return stageCases.length ? sectionMarkup(stageKey, stageCases) : "";
    })
    .join("");

  emptyState.hidden = visible.length > 0;
  bindCards();
}

function bindCards() {
  document.querySelectorAll(".use-case-card").forEach((card) => {
    const open = () => openDialog(card.dataset.useCaseId);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
}

function openDialog(id) {
  const useCase = useCases.find((item) => item.id === id);
  if (!useCase) return;

  const stage = stages[useCase.stage];
  dialogContent.innerHTML = `
    <span class="dialog-stage" data-stage="${useCase.stage}">${stage.label}</span>
    <h2 class="dialog-title">${escapeHtml(useCase.name)}</h2>
    <p class="dialog-summary">${escapeHtml(useCase.experience)}</p>
    <blockquote class="dialog-example">
      <span>Example experience</span>
      <p>“${escapeHtml(useCase.example)}”</p>
    </blockquote>
    <div class="dialog-detail-grid">
      <div>
        <span class="dialog-section-label">Implementation approach</span>
        <h3>How it could work</h3>
        <p>${escapeHtml(useCase.implementation)}</p>
      </div>
      <div>
        <span class="dialog-section-label">Foundation</span>
        <h3>What must be in place</h3>
        <p>${escapeHtml(useCase.needs)}</p>
      </div>
    </div>
  `;
  dialog.showModal();
  closeDialogButton.focus();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    renderUseCases();
  });
});

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderUseCases();
});

clearSearchButton.addEventListener("click", () => {
  searchInput.value = "";
  searchTerm = "";
  searchInput.focus();
  renderUseCases();
});

closeDialogButton.addEventListener("click", () => dialog.close());

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

filterButtons.forEach((button, index) => {
  button.setAttribute("aria-pressed", String(index === 0));
});

renderUseCases();
